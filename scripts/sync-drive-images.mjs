import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

const ROOT_FOLDER_ID = "14ztsw_4GTMGKbfY73J0JZi4ERm8kOCEK";
const PUBLIC_DIR = path.resolve("public/participants");
const DATA_PATH = path.resolve("src/data/participants.json");
const CONCURRENCY = 8;

async function runGdrive(args) {
  const cmd = process.platform === "win32" ? "cmd.exe" : "gdrive";
  const finalArgs = process.platform === "win32" ? ["/c", "gdrive", ...args] : args;
  return execFileAsync(cmd, finalArgs, { maxBuffer: 20 * 1024 * 1024 });
}

async function gdriveJson(args) {
  const { stdout } = await runGdrive([...args, "--json"]);
  return JSON.parse(stdout);
}

function parseFolderName(folderName) {
  const match = folderName.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  const name = match ? match[1].trim() : folderName.trim();
  const group = match ? match[2].trim() : null;
  const id = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return { id, name, group, folderName };
}

function getExt(file) {
  const extFromName = path.extname(file.name || "").toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(extFromName)) {
    return extFromName === ".jpeg" ? ".jpg" : extFromName;
  }
  if (file.mimeType === "image/png") return ".png";
  if (file.mimeType === "image/webp") return ".webp";
  return ".jpg";
}

async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function next() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await worker(items[i], i);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => next())
  );
  return results;
}

async function main() {
  console.log("Listing root Drive folder...");
  const rootItems = await gdriveJson(["readonly", "ls", ROOT_FOLDER_ID, "--max", "0"]);
  const folders = rootItems
    .filter((item) => item.mimeType === "application/vnd.google-apps.folder")
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Found ${folders.length} participant folders.`);

  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });

  const participants = [];
  const downloadTasks = [];

  // Fetch file listings for each participant folder
  const folderFilesList = await runPool(folders, CONCURRENCY, async (folder) => {
    const meta = parseFolderName(folder.name);
    const files = await gdriveJson(["readonly", "ls", folder.id, "--max", "0"]);
    const images = files
      .filter((f) => f.mimeType && f.mimeType.startsWith("image/"))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { folder, meta, images };
  });

  for (const { meta, images } of folderFilesList) {
    if (images.length === 0) {
      throw new Error(`No images found in folder "${meta.folderName}"`);
    }
    const slugDir = path.join(PUBLIC_DIR, meta.id);
    await fs.mkdir(slugDir, { recursive: true });

    const imagePaths = [];
    images.forEach((img, idx) => {
      const num = String(idx + 1).padStart(2, "0");
      const ext = getExt(img);
      const filename = `${num}${ext}`;
      const outPath = path.join(slugDir, filename);
      const publicPath = `/participants/${meta.id}/${filename}`;
      imagePaths.push(publicPath);
      downloadTasks.push({
        fileId: img.id,
        outPath,
        label: `${meta.name} #${num}`,
      });
    });

    participants.push({
      id: meta.id,
      name: meta.name,
      group: meta.group,
      folderName: meta.folderName,
      images: imagePaths,
    });
  }

  console.log(
    `Downloading ${downloadTasks.length} images across ${participants.length} participants...`
  );

  let completed = 0;
  await runPool(downloadTasks, CONCURRENCY, async (task) => {
    try {
      const stat = await fs.stat(task.outPath);
      if (stat.size > 0) {
        completed++;
        return;
      }
    } catch {
      // File doesn't exist yet
    }

    await runGdrive(["readonly", "download", task.fileId, "--out", task.outPath]);
    completed++;
    if (completed % 25 === 0 || completed === downloadTasks.length) {
      console.log(`Progress: ${completed}/${downloadTasks.length}`);
    }
  });

  await fs.writeFile(
    DATA_PATH,
    JSON.stringify(participants, null, 2) + "\n",
    "utf8"
  );

  console.log(
    `Done! Saved ${participants.length} participants and ${downloadTasks.length} images.`
  );
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
