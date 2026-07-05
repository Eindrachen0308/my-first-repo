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

// はじめてのクエスト（チュートリアル）
export const TUTORIAL_QUEST = {
  title: "はじめてのクエスト",
  goal: "週末のおでかけプランを聞いてみよう！",
  xp: 50,
};

export const QUICK_PROMPTS = [
  "週末、東京から日帰りでどこか行きたい！",
  "箱根で温泉りょこうのプランを考えて",
  "雨の日でも楽しめるおでかけ先おしえて",
];

export const XP_PER_RUN = 20;
export const XP_PER_LEVEL = 50;
export const MAX_ENERGY = 5;
