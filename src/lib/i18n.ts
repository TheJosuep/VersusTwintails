import type { CriterionKey } from "./types";
import type { ExclusionReason } from "./quality";

export type Locale = "es" | "en" | "ja";

export const LOCALE_OPTIONS: Array<{ code: Locale; label: string }> = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
  { code: "ja", label: "日本語" },
];

export interface CriterionTranslation {
  label: string;
  shortLabel: string;
  ranges: {
    low: string;
    mid: string;
    high: string;
  };
}

export interface Translations {
  appName: string;
  loadingTournament: string;
  loginBadge: string;
  loginSubtitle: string;
  loginPlaceholder: string;
  loginButton: string;
  loggingIn: string;
  loginEmptyError: string;
  statusCompleted: string;
  statusAutosave: string;
  finishedBadge: string;
  changeUser: string;
  sessionCreated: string;
  sessionRecoveredCompleted: string;
  sessionRecoveredProgress: string;
  navVersus: string;
  navResults: string;
  navHelp: string;
  navLockedHint: string;
  participantSideA: string;
  participantSideB: string;
  noGroup: string;
  fullscreenAriaPrefix: string;
  fullscreenTitle: string;
  savedEvalPrefix: string;
  evaluate5Prompt: string;
  editScores: string;
  hideScores: string;
  defaultFiveHint: string;
  pickWinnerPrefix: string;
  roundLabel: Record<number, string>;
  roundBadge: string;
  evaluatedLabel: string;
  duelLabel: string;
  resultsUnlockedButton: string;
  finalizeAndViewResults: string;
  roundGeneratedNotice: string;
  tournamentCompletedTitle: string;
  tournamentCompletedSubtitle: string;
  exploreResultsButton: string;
  saveVoteError: string;
  validateSurveyError: string;
  lightboxAriaPrefix: string;
  lightboxZoomOut: string;
  lightboxZoomIn: string;
  lightboxResetZoom: string;
  lightboxClose: string;
  lightboxHint: string;
  resultsTitle: string;
  resultsOwnSubtitle: string;
  resultsCommunitySubtitle: string;
  resultsCommunityLoading: string;
  refresh: string;
  scopeOwn: string;
  scopeCommunity: string;
  modeVersus: string;
  modeScore: string;
  sortAverageGeneral: string;
  searchPlaceholder: string;
  sortDesc: string;
  sortAsc: string;
  loadingCommunity: string;
  podiumYourVersus: string;
  podiumCommunityVersus: string;
  podiumYourScore: string;
  podiumCommunityScore: string;
  rankLabel: string;
  victoriesLabel: string;
  duelsLabel: string;
  opponentStrengthLabel: string;
  duelHistoryLabel: string;
  wonVsPrefix: string;
  lostVsPrefix: string;
  evaluatedChip: string;
  notEvaluatedChip: string;
  evalsCountSuffix: string;
  noDataLabel: string;
  personalRefPrefix: string;
  personalRefInVersus: string;
  personalRefInScore: string;
  noteShortPrefix: string;
  excludedOwnBanner: Record<ExclusionReason, string>;
  helpTitle: string;
  helpSubtitle: string;
  helpSteps: Array<{ step: string; title: string; desc: string }>;
  helpScaleTitle: string;
  helpScaleSubtitle: string;
  criteria: Record<CriterionKey, CriterionTranslation>;
}

export const TRANSLATIONS: Record<Locale, Translations> = {
  es: {
    appName: "Versus Twintails",
    loadingTournament: "Cargando torneo...",
    loginBadge: "Torneo Suizo · {rounds} Rondas · {duels} Duelos",
    loginSubtitle:
      "Ingresa tu nombre de usuario para iniciar, autoguardar o recuperar tu progreso.",
    loginPlaceholder: "Tu nombre de usuario",
    loginButton: "Entrar",
    loggingIn: "Entrando...",
    loginEmptyError: "Escribe un nombre de usuario.",
    statusCompleted: "Torneo completado",
    statusAutosave: "Autoguardado activo",
    finishedBadge: "Finalizado",
    changeUser: "Cambiar",
    sessionCreated: "Sesión creada para {name}",
    sessionRecoveredCompleted: "Torneo completado recuperado ({count} duelos)",
    sessionRecoveredProgress: "Progreso recuperado · {count}/{total} duelos",
    navVersus: "Versus",
    navResults: "Tabla de resultados",
    navHelp: "Ayuda",
    navLockedHint:
      "Completa las {rounds} rondas suizas ({matches}/{duels} duelos y {evals}/{participants} evaluadas) para desbloquear la Tabla de resultados.",
    participantSideA: "Participante A",
    participantSideB: "Participante B",
    noGroup: "Sin grupo",
    fullscreenAriaPrefix: "Pantalla completa de",
    fullscreenTitle: "Ver en pantalla de luz",
    savedEvalPrefix: "Evaluación guardada · Promedio",
    evaluate5Prompt: "Evalúa los 5 criterios (0 a 10)",
    editScores: "Editar",
    hideScores: "Ocultar",
    defaultFiveHint:
      "Mover los criterios es opcional, pero dejar muchas participantes en 5/10 o sin variación excluirá tus puntajes del promedio comunitario.",
    pickWinnerPrefix: "Elegir ganadora a",
    roundLabel: {
      1: "Evaluación inicial",
      2: "Clasificación suiza",
      3: "Semifinales suizas",
      4: "Ronda final suiza",
    },
    roundBadge: "Ronda {round}/{total} · {label}",
    evaluatedLabel: "Evaluadas:",
    duelLabel: "Duelo",
    resultsUnlockedButton: "Resultados desbloqueados · Ver tabla",
    finalizeAndViewResults: "Finalizar y ver resultados",
    roundGeneratedNotice: "Ronda {round}/{total} generada · {label}",
    tournamentCompletedTitle: "Torneo Suizo completado",
    tournamentCompletedSubtitle:
      "Evaluaste a las {participants} participantes y completaste tus {matches} duelos.",
    exploreResultsButton: "Explorar tabla de resultados",
    saveVoteError: "No se pudo guardar el voto.",
    validateSurveyError: "No se pudo validar el envío.",
    lightboxAriaPrefix: "Pantalla de luz de",
    lightboxZoomOut: "Alejar",
    lightboxZoomIn: "Acercar",
    lightboxResetZoom: "Restablecer zoom",
    lightboxClose: "Cerrar pantalla de luz",
    lightboxHint:
      "Zoom {scale}x · Doble toque o pellizco para acercar · Desliza para cambiar foto",
    resultsTitle: "Tabla de resultados",
    resultsOwnSubtitle:
      "Tus votos personales · {matches} duelos y {evals} evaluaciones",
    resultsCommunitySubtitle:
      "Comunidad · {users} usuarios · {matches} duelos · {trusted} evaluadores válidos ({excluded} filtrados)",
    resultsCommunityLoading: "Cargando resultados globales...",
    refresh: "Actualizar",
    scopeOwn: "Mis resultados",
    scopeCommunity: "Comunidad",
    modeVersus: "Por Versus",
    modeScore: "Por Puntuación",
    sortAverageGeneral: "Promedio general",
    searchPlaceholder: "Buscar participante o grupo...",
    sortDesc: "Mayor a menor",
    sortAsc: "Menor a mayor",
    loadingCommunity: "Cargando resultados de la comunidad...",
    podiumYourVersus: "Tu Versus",
    podiumCommunityVersus: "Versus Comunidad",
    podiumYourScore: "Tu Puntuación",
    podiumCommunityScore: "Puntuación Comunidad",
    rankLabel: "Puesto",
    victoriesLabel: "Victorias",
    duelsLabel: "Duelos",
    opponentStrengthLabel: "Fuerza rivales",
    duelHistoryLabel: "Historial de tus enfrentamientos:",
    wonVsPrefix: "✓ Ganó vs",
    lostVsPrefix: "✕ Cayó vs",
    evaluatedChip: "Evaluada",
    notEvaluatedChip: "Sin evaluar",
    evalsCountSuffix: "evals",
    noDataLabel: "Sin datos",
    personalRefPrefix: "Tu referencia personal:",
    personalRefInVersus: "en Versus",
    personalRefInScore: "en Puntuación",
    noteShortPrefix: "Nota",
    excludedOwnBanner: {
      default_five_spam:
        "Tus puntajes por criterio fueron excluidos del promedio comunitario porque la mayoría quedó en el valor por defecto 5/10 (tus duelos Versus sí cuentan).",
      low_variance:
        "Tus puntajes por criterio fueron excluidos del promedio comunitario por tener variación mínima entre participantes (tus duelos Versus sí cuentan).",
      uniform_spam:
        "Tus puntajes por criterio fueron excluidos del promedio comunitario por repetición excesiva de un mismo vector de notas (tus duelos Versus sí cuentan).",
      extreme_polarization:
        "Tus puntajes por criterio fueron excluidos del promedio comunitario por polarización extrema 0/10 (tus duelos Versus sí cuentan).",
    },
    helpTitle: "Cómo funciona",
    helpSubtitle: "Torneo Suizo de {rounds} rondas · {duels} duelos totales",
    helpSteps: [
      {
        step: "01",
        title: "Rondas suizas en 70 duelos",
        desc: "En lugar de 595 duelos, el formato Suizo enfrenta a las 35 participantes en 4 rondas (70 duelos) emparejando rivales de nivel similar.",
      },
      {
        step: "02",
        title: "Pantalla de luz global",
        desc: "En móvil toca la imagen para abrir la pantalla de luz con zoom; en escritorio pulsa el ícono [ ] de pantalla completa.",
      },
      {
        step: "03",
        title: "Evalúa con criterio y elige ganadora",
        desc: "Mover los sliders es opcional, pero dejar demasiadas en 5/10 o notas planas excluye tus criterios del promedio global. Tus duelos Versus siempre cuentan para el Elo.",
      },
      {
        step: "04",
        title: "Resultados separados",
        desc: "Al terminar los 70 duelos puedes alternar entre Mis resultados y Comunidad, y ordenar por Versus (Elo) o por Puntuación (0–10).",
      },
    ],
    helpScaleTitle: "Escala de evaluación (0 a 10)",
    helpScaleSubtitle: "Referencia para los 5 criterios",
    criteria: {
      originality: {
        label: "Originalidad y personalidad",
        shortLabel: "Originalidad",
        ranges: {
          low: "Estilo común",
          mid: "Buen toque personal",
          high: "Muy original",
        },
      },
      symmetry: {
        label: "Simetría y forma",
        shortLabel: "Simetría",
        ranges: {
          low: "Asimétricas o sin forma",
          mid: "Buen equilibrio",
          high: "Perfecta simetría y estructura",
        },
      },
      color_aspect: {
        label: "Color y aspecto general",
        shortLabel: "Color",
        ranges: {
          low: "Poco atractivo",
          mid: "Buen uso del color/accesorios",
          high: "Combinación visualmente impactante",
        },
      },
      facial_harmony: {
        label: "Armonía con el rostro",
        shortLabel: "Armonía",
        ranges: {
          low: "Baja armonía",
          mid: "Agradable de ver",
          high: "Nacieron para estar juntos",
        },
      },
      general_impact: {
        label: "Impacto general",
        shortLabel: "Impacto",
        ranges: {
          low: "Nada memorable",
          mid: "Agradable pero estándar",
          high: "Impresionante y memorable",
        },
      },
    },
  },
  en: {
    appName: "Versus Twintails",
    loadingTournament: "Loading tournament...",
    loginBadge: "Swiss Tournament · {rounds} Rounds · {duels} Duels",
    loginSubtitle:
      "Enter your username to start, autosave, or recover your progress.",
    loginPlaceholder: "Your username",
    loginButton: "Enter",
    loggingIn: "Signing in...",
    loginEmptyError: "Please enter a username.",
    statusCompleted: "Tournament completed",
    statusAutosave: "Autosave active",
    finishedBadge: "Completed",
    changeUser: "Switch",
    sessionCreated: "Session created for {name}",
    sessionRecoveredCompleted: "Completed tournament restored ({count} duels)",
    sessionRecoveredProgress: "Progress restored · {count}/{total} duels",
    navVersus: "Versus",
    navResults: "Results table",
    navHelp: "Help",
    navLockedHint:
      "Finish all {rounds} Swiss rounds ({matches}/{duels} duels and {evals}/{participants} evaluated) to unlock the Results table.",
    participantSideA: "Participant A",
    participantSideB: "Participant B",
    noGroup: "No group",
    fullscreenAriaPrefix: "Fullscreen view of",
    fullscreenTitle: "Open lightbox",
    savedEvalPrefix: "Saved evaluation · Avg",
    evaluate5Prompt: "Rate all 5 criteria (0 to 10)",
    editScores: "Edit",
    hideScores: "Hide",
    defaultFiveHint:
      "Adjusting scores is optional, but leaving many participants at 5/10 or with flat ratings excludes your scores from community averages.",
    pickWinnerPrefix: "Pick winner:",
    roundLabel: {
      1: "Initial evaluation",
      2: "Swiss qualifiers",
      3: "Swiss semifinals",
      4: "Swiss final round",
    },
    roundBadge: "Round {round}/{total} · {label}",
    evaluatedLabel: "Evaluated:",
    duelLabel: "Duel",
    resultsUnlockedButton: "Results unlocked · View table",
    finalizeAndViewResults: "Finish and view results",
    roundGeneratedNotice: "Round {round}/{total} generated · {label}",
    tournamentCompletedTitle: "Swiss Tournament completed",
    tournamentCompletedSubtitle:
      "You evaluated all {participants} participants and completed your {matches} duels.",
    exploreResultsButton: "Explore results table",
    saveVoteError: "Could not save your vote.",
    validateSurveyError: "Could not validate submission.",
    lightboxAriaPrefix: "Lightbox gallery for",
    lightboxZoomOut: "Zoom out",
    lightboxZoomIn: "Zoom in",
    lightboxResetZoom: "Reset zoom",
    lightboxClose: "Close lightbox",
    lightboxHint:
      "Zoom {scale}x · Double-tap or pinch to zoom · Swipe to switch photo",
    resultsTitle: "Results table",
    resultsOwnSubtitle:
      "Your personal votes · {matches} duels and {evals} evaluations",
    resultsCommunitySubtitle:
      "Community · {users} users · {matches} duels · {trusted} valid raters ({excluded} filtered)",
    resultsCommunityLoading: "Loading community results...",
    refresh: "Refresh",
    scopeOwn: "My results",
    scopeCommunity: "Community",
    modeVersus: "By Versus",
    modeScore: "By Score",
    sortAverageGeneral: "Overall average",
    searchPlaceholder: "Search participant or group...",
    sortDesc: "Highest first",
    sortAsc: "Lowest first",
    loadingCommunity: "Loading community results...",
    podiumYourVersus: "Your Versus",
    podiumCommunityVersus: "Community Versus",
    podiumYourScore: "Your Score",
    podiumCommunityScore: "Community Score",
    rankLabel: "Rank",
    victoriesLabel: "Wins",
    duelsLabel: "Duels",
    opponentStrengthLabel: "Opp. strength",
    duelHistoryLabel: "Your matchup history:",
    wonVsPrefix: "✓ Beat",
    lostVsPrefix: "✕ Lost to",
    evaluatedChip: "Rated",
    notEvaluatedChip: "Unrated",
    evalsCountSuffix: "evals",
    noDataLabel: "No data",
    personalRefPrefix: "Your personal rank:",
    personalRefInVersus: "in Versus",
    personalRefInScore: "in Score",
    noteShortPrefix: "Avg",
    excludedOwnBanner: {
      default_five_spam:
        "Your criteria scores were excluded from community averages because too many stayed at default 5/10 (your Versus duels still count).",
      low_variance:
        "Your criteria scores were excluded from community averages due to near-zero variance across participants (your Versus duels still count).",
      uniform_spam:
        "Your criteria scores were excluded from community averages due to excessive repetition of identical score vectors (your Versus duels still count).",
      extreme_polarization:
        "Your criteria scores were excluded from community averages due to extreme 0/10 polarization (your Versus duels still count).",
    },
    helpTitle: "How it works",
    helpSubtitle: "{rounds}-round Swiss tournament · {duels} total duels",
    helpSteps: [
      {
        step: "01",
        title: "Swiss rounds in 70 duels",
        desc: "Instead of 595 duels, the Swiss format matches all 35 participants across 4 rounds (70 duels) against opponents of similar rating.",
      },
      {
        step: "02",
        title: "Global lightbox",
        desc: "On mobile, tap any main photo to zoom in; on desktop, click the [ ] fullscreen button.",
      },
      {
        step: "03",
        title: "Rate fairly & pick winners",
        desc: "Moving sliders is optional, but leaving many at 5/10 or flat scores filters your criteria out of community averages. Versus wins always count toward Elo.",
      },
      {
        step: "04",
        title: "Separated results",
        desc: "After 70 duels, switch cleanly between My results and Community, and sort by Versus (Elo) or Score (0–10).",
      },
    ],
    helpScaleTitle: "Evaluation scale (0 to 10)",
    helpScaleSubtitle: "Reference for all 5 criteria",
    criteria: {
      originality: {
        label: "Originality & personality",
        shortLabel: "Originality",
        ranges: {
          low: "Common style",
          mid: "Nice personal touch",
          high: "Very original",
        },
      },
      symmetry: {
        label: "Symmetry & shape",
        shortLabel: "Symmetry",
        ranges: {
          low: "Asymmetric or shapeless",
          mid: "Good balance",
          high: "Perfect symmetry & structure",
        },
      },
      color_aspect: {
        label: "Color & overall look",
        shortLabel: "Color",
        ranges: {
          low: "Unappealing",
          mid: "Good use of color/accessories",
          high: "Visually striking combination",
        },
      },
      facial_harmony: {
        label: "Facial harmony",
        shortLabel: "Harmony",
        ranges: {
          low: "Low harmony",
          mid: "Pleasant to look at",
          high: "Meant to be together",
        },
      },
      general_impact: {
        label: "Overall impact",
        shortLabel: "Impact",
        ranges: {
          low: "Not memorable",
          mid: "Nice but standard",
          high: "Stunning and memorable",
        },
      },
    },
  },
  ja: {
    appName: "Versus Twintails",
    loadingTournament: "トーナメントを読み込み中...",
    loginBadge: "スイスドロー · 全{rounds}ラウンド · {duels}試合",
    loginSubtitle:
      "ユーザー名を入力して、開始・自動保存・進捗の復元を行います。",
    loginPlaceholder: "ユーザー名を入力",
    loginButton: "開始",
    loggingIn: "ログイン中...",
    loginEmptyError: "ユーザー名を入力してください。",
    statusCompleted: "トーナメント完了",
    statusAutosave: "自動保存オン",
    finishedBadge: "完了",
    changeUser: "切替",
    sessionCreated: "{name} のセッションを作成しました",
    sessionRecoveredCompleted: "完了済みデータを復元しました（{count}試合）",
    sessionRecoveredProgress: "進捗を復元しました · {count}/{total}試合",
    navVersus: "バーサス",
    navResults: "結果テーブル",
    navHelp: "ヘルプ",
    navLockedHint:
      "結果テーブルを解放するには全{rounds}ラウンド（{matches}/{duels}試合・{evals}/{participants}名評価）を完了してください。",
    participantSideA: "参加者 A",
    participantSideB: "参加者 B",
    noGroup: "グループなし",
    fullscreenAriaPrefix: "拡大表示：",
    fullscreenTitle: "ライトボックスを開く",
    savedEvalPrefix: "評価保存済み · 平均",
    evaluate5Prompt: "5項目を評価（0〜10）",
    editScores: "編集",
    hideScores: "閉じる",
    defaultFiveHint:
      "スコア調整は任意ですが、5/10のままや偏りのない評価が多い場合、全体平均の集計から自動除外されます。",
    pickWinnerPrefix: "勝者に選ぶ：",
    roundLabel: {
      1: "初回評価ラウンド",
      2: "スイス予選ラウンド",
      3: "スイス準決勝ラウンド",
      4: "スイス最終ラウンド",
    },
    roundBadge: "第{round}/{total}ラウンド · {label}",
    evaluatedLabel: "評価済み:",
    duelLabel: "試合",
    resultsUnlockedButton: "結果が解放されました · 表を見る",
    finalizeAndViewResults: "完了して結果を見る",
    roundGeneratedNotice: "第{round}/{total}ラウンド生成 · {label}",
    tournamentCompletedTitle: "スイスドロー完了",
    tournamentCompletedSubtitle:
      "全{participants}名の評価と{matches}試合の対戦を完了しました。",
    exploreResultsButton: "結果テーブルを見る",
    saveVoteError: "投票を保存できませんでした。",
    validateSurveyError: "送信を検証できませんでした。",
    lightboxAriaPrefix: "拡大ギャラリー：",
    lightboxZoomOut: "縮小",
    lightboxZoomIn: "拡大",
    lightboxResetZoom: "リセット",
    lightboxClose: "閉じる",
    lightboxHint:
      "倍率 {scale}x · ダブルタップまたはピンチで拡大 · スワイプで写真切替",
    resultsTitle: "結果テーブル",
    resultsOwnSubtitle:
      "あなたの個人結果 · {matches}試合 · {evals}件の評価",
    resultsCommunitySubtitle:
      "全体集計 · {users}名参加 · {matches}試合 · 有効評価者 {trusted}名（{excluded}名除外）",
    resultsCommunityLoading: "全体結果を読み込み中...",
    refresh: "更新",
    scopeOwn: "自分の結果",
    scopeCommunity: "全体集計",
    modeVersus: "バーサス順",
    modeScore: "スコア順",
    sortAverageGeneral: "総合平均",
    searchPlaceholder: "名前・グループで検索...",
    sortDesc: "高い順",
    sortAsc: "低い順",
    loadingCommunity: "全体結果を読み込み中...",
    podiumYourVersus: "あなたのバーサス",
    podiumCommunityVersus: "全体のバーサス",
    podiumYourScore: "あなたのスコア",
    podiumCommunityScore: "全体のスコア",
    rankLabel: "順位",
    victoriesLabel: "勝利",
    duelsLabel: "試合数",
    opponentStrengthLabel: "対戦相手強度",
    duelHistoryLabel: "対戦履歴:",
    wonVsPrefix: "✓ 勝利 vs",
    lostVsPrefix: "✕ 敗戦 vs",
    evaluatedChip: "評価済み",
    notEvaluatedChip: "未評価",
    evalsCountSuffix: "件",
    noDataLabel: "データなし",
    personalRefPrefix: "あなたの順位:",
    personalRefInVersus: "（バーサス）",
    personalRefInScore: "（スコア）",
    noteShortPrefix: "平均",
    excludedOwnBanner: {
      default_five_spam:
        "初期値5/10のままの評価が多いため、あなたの項目別スコアは全体平均の集計から除外されています（バーサス勝敗は反映されます）。",
      low_variance:
        "参加者間のスコア差がほぼないため、あなたの項目別スコアは全体平均から除外されています（バーサス勝敗は反映されます）。",
      uniform_spam:
        "同一パターンのスコアが極端に多いため、あなたの項目別スコアは全体平均から除外されています（バーサス勝敗は反映されます）。",
      extreme_polarization:
        "極端な0/10評価が集中しているため、あなたの項目別スコアは全体平均から除外されています（バーサス勝敗は反映されます）。",
    },
    helpTitle: "使い方",
    helpSubtitle: "スイスドロー全{rounds}ラウンド · 計{duels}試合",
    helpSteps: [
      {
        step: "01",
        title: "70試合のスイスドロー方式",
        desc: "595試合ではなく、全35名を4ラウンド（70試合）で実力の近い相手と対戦させ、重複なしで公平に順位を決定します。",
      },
      {
        step: "02",
        title: "グローバルライトボックス",
        desc: "モバイルでは画像を直接タップして拡大表示、PCでは右上の [ ] アイコンから全画面ズームを開けます。",
      },
      {
        step: "03",
        title: "適正な評価と勝者選択",
        desc: "スライダーの調整は任意ですが、初期値5/10や偏りのない評価が多い場合は全体平均から自動除外されます（Elo勝敗は常に有効）。",
      },
      {
        step: "04",
        title: "分離された結果表示",
        desc: "70試合終了後、「自分の結果」と「全体集計」を切り替え、バーサス（Elo）順・スコア順で比較できます。",
      },
    ],
    helpScaleTitle: "評価スケール（0〜10）",
    helpScaleSubtitle: "5つの評価基準",
    criteria: {
      originality: {
        label: "独創性と個性",
        shortLabel: "独創性",
        ranges: {
          low: "よくあるスタイル",
          mid: "程よい個性",
          high: "とても独創的",
        },
      },
      symmetry: {
        label: "左右対称とシルエット",
        shortLabel: "対称性",
        ranges: {
          low: "非対称・形が崩れている",
          mid: "良いバランス",
          high: "完璧な対称性と造形",
        },
      },
      color_aspect: {
        label: "配色と全体の印象",
        shortLabel: "配色",
        ranges: {
          low: "あまり魅力的でない",
          mid: "色や小物の使い方が良い",
          high: "視覚的に印象的な組み合わせ",
        },
      },
      facial_harmony: {
        label: "顔立ちとの調和",
        shortLabel: "調和",
        ranges: {
          low: "調和が低い",
          mid: "見ていて心地よい",
          high: "最高の相性",
        },
      },
      general_impact: {
        label: "総合インパクト",
        shortLabel: "印象",
        ranges: {
          low: "印象に残らない",
          mid: "良いが標準的",
          high: "圧倒的で記憶に残る",
        },
      },
    },
  },
};

export function formatText(
  template: string,
  vars: Record<string, string | number>
): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template
  );
}

export function getLocalizedRangeLabel(
  key: CriterionKey,
  score: number,
  locale: Locale
): string {
  const ranges = TRANSLATIONS[locale].criteria[key].ranges;
  if (score <= 3) return ranges.low;
  if (score <= 7) return ranges.mid;
  return ranges.high;
}

export function getLocalizedRoundLabel(round: number, locale: Locale): string {
  return (
    TRANSLATIONS[locale].roundLabel[round] ??
    (locale === "ja"
      ? `第${round}ラウンド`
      : locale === "en"
        ? `Round ${round}`
        : `Ronda ${round}`)
  );
}
