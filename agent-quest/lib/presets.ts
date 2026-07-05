// クラフトUIのマスタデータ（設計書でいう「公式アイテムカタログ」のプロトタイプ版）

export const AVATARS = [
  { id: "hiyoko", emoji: "🐣", name: "ひよこ", color: "#FFD84D" },
  { id: "kitsune", emoji: "🦊", name: "きつね", color: "#FF9A5C" },
  { id: "penguin", emoji: "🐧", name: "ペンギン", color: "#7EC8FF" },
  { id: "neko", emoji: "🐱", name: "ねこ", color: "#C9A7FF" },
] as const;

export const PERSONAS = [
  {
    id: "genki",
    label: "げんき",
    emoji: "☀️",
    desc: "いつも全力！テンション高めの応援タイプ",
    prompt:
      "あなたは明るく元気いっぱいの性格です。テンション高めで、ユーザーを励ましながら話します。",
  },
  {
    id: "ottori",
    label: "おっとり",
    emoji: "🌸",
    desc: "やさしくていねい。癒やし系",
    prompt:
      "あなたはおっとりした癒やし系の性格です。やわらかい言葉づかいで、ていねいに寄り添って話します。",
  },
  {
    id: "cool",
    label: "クール",
    emoji: "🌙",
    desc: "冷静で頼れる。ちょっとツンデレ",
    prompt:
      "あなたはクールで頼れる性格です。簡潔で的確に話しますが、ときどき優しさがにじみます。",
  },
  {
    id: "monoshiri",
    label: "ものしり",
    emoji: "🎓",
    desc: "豆知識が大好きな博士タイプ",
    prompt:
      "あなたは豆知識が大好きな博士タイプです。役立つ雑学を交えながら、楽しく解説します。",
  },
] as const;

export const SKILLS = [
  {
    id: "web_search",
    emoji: "🔍",
    name: "ウェブけんさく",
    desc: "インターネットで最新情報をしらべる",
    recommended: true,
  },
  {
    id: "calc",
    emoji: "🧮",
    name: "けいさん",
    desc: "予算やわりかんをすばやく計算",
    recommended: false,
  },
  {
    id: "memo",
    emoji: "📝",
    name: "プランメモ",
    desc: "こたえをきれいなプラン形式にまとめる",
    recommended: false,
  },
] as const;

export const MAX_SKILL_SLOTS = 2;

export const RANDOM_NAMES = [
  "たびすけ",
  "ぽんた",
  "そらまる",
  "ぴっぴ",
  "こんこん",
  "みかづき",
  "わたあめ",
  "もちもち",
];

// クエストボード（順番にクリアしていく）
export type Quest = {
  id: string;
  emoji: string;
  title: string;
  goal: string;
  xp: number;
  specialty: string; // システムプロンプトに注入する得意分野
  quickPrompts: string[];
};

export const QUESTS: Quest[] = [
  {
    id: "travel",
    emoji: "🎒",
    title: "はじめてのクエスト",
    goal: "週末のおでかけプランを聞いてみよう！",
    xp: 50,
    specialty: [
      "いまのクエストでのあなたの得意分野は旅行・おでかけプランの提案です。",
      "行き先の候補は2〜3個にしぼり、それぞれ「見どころ・ごはん・アクセス」を短くまとめてください。",
    ].join("\n"),
    quickPrompts: [
      "週末、東京から日帰りでどこか行きたい！",
      "箱根で温泉りょこうのプランを考えて",
      "雨の日でも楽しめるおでかけ先おしえて",
    ],
  },
  {
    id: "kondate",
    emoji: "🍳",
    title: "こんだてクエスト",
    goal: "今週のばんごはんを相談してみよう！",
    xp: 60,
    specialty: [
      "いまのクエストでのあなたの得意分野は献立・ばんごはんの提案です。",
      "献立の案は2〜3個にしぼり、それぞれ「メイン・サイド・ポイント」を短くまとめてください。",
      "家にある食材を聞かれたら、それを活かした献立を優先してください。",
    ].join("\n"),
    quickPrompts: [
      "今週3日分のばんごはんを考えて！",
      "冷蔵庫にキャベツと豚肉があるよ。なに作る？",
      "子どもがよろこぶ献立おしえて",
    ],
  },
];

// クエスト外（試遊リンクなど）での汎用ガイド
export const GENERAL_SPECIALTY =
  "ユーザーのそうだんに、みじかく楽しくこたえてください。おでかけプランやごはんの相談がとくいです。";

export const TRY_PROMPTS = [
  "週末のおでかけプラン考えて！",
  "今週のばんごはん、なにがいい？",
  "自己紹介して！",
];

export const XP_PER_RUN = 20;
export const XP_PER_LEVEL = 50;
export const MAX_ENERGY = 5;
export const TRY_MAX_RUNS = 3; // 試遊リンクでのおためし回数
