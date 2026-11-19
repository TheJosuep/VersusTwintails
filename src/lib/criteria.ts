import type { CriterionKey, Scores } from "./types";

export interface CriterionMeta {
  key: CriterionKey;
  label: string;
  ranges: {
    low: string;
    mid: string;
    high: string;
  };
}

export const CRITERIA: CriterionMeta[] = [
  {
    key: "originality",
    label: "Originalidad y personalidad",
    ranges: {
      low: "Estilo común",
      mid: "Buen toque personal",
      high: "Muy original",
    },
  },
  {
    key: "symmetry",
    label: "Simetría y forma",
    ranges: {
      low: "Asimétricas o sin forma",
      mid: "Buen equilibrio",
      high: "Perfecta simetría y estructura",
    },
  },
  {
    key: "color_aspect",
    label: "Color y aspecto general",
    ranges: {
      low: "Poco atractivo",
      mid: "Buen uso del color/accesorios",
      high: "Combinación visualmente impactante",
    },
  },
  {
    key: "facial_harmony",
    label: "Armonía con el rostro",
    ranges: {
      low: "Baja armonía",
      mid: "Agradable de ver",
      high: "Nacieron para estar juntos",
    },
  },
  {
    key: "general_impact",
    label: "Impacto general",
    ranges: {
      low: "Nada memorable",
      mid: "Agradable pero estándar",
      high: "Impresionante y memorable",
    },
  },
];

export const DEFAULT_SCORES: Scores = {
  originality: 5,
  symmetry: 5,
  color_aspect: 5,
  facial_harmony: 5,
  general_impact: 5,
};

export function getRangeLabel(criterion: CriterionMeta, score: number): string {
  if (score <= 3) return criterion.ranges.low;
  if (score <= 7) return criterion.ranges.mid;
  return criterion.ranges.high;
}

export function getRangeBand(score: number): "0–3" | "4–7" | "8–10" {
  if (score <= 3) return "0–3";
  if (score <= 7) return "4–7";
  return "8–10";
}

export function getAverageScore(scores: Scores): number {
  const sum = CRITERIA.reduce((acc, c) => acc + scores[c.key], 0);
  return sum / CRITERIA.length;
}
