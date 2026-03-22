// ===== パワー値診断ロジック =====
// 仕様書: (犬種基礎点 × 性別係数 × 年齢係数) + 環境ブースト加点

export type BreedGroup = 'strong' | 'normal' | 'calm'
export type SexType = 'male_intact' | 'male_neutered' | 'female_intact' | 'female_spayed'
export type MentorAgeGroup = 'puppy' | 'adult' | 'middle' | 'senior'
export type MentorStatus = 'overheat' | 'high_energy' | 'standard' | 'therapy'
export type ChaosColor = 'red' | 'yellow' | 'blue'

// ===== 犬種グループ =====
const STRONG_BREEDS = [
  'フレンチブルドッグ', 'ジャックラッセルテリア', 'ピットブル', 'ロットワイラー', 'ブルテリア',
  'アメリカンスタッフォードシャーテリア', 'ドーベルマン', 'シベリアンハスキー', 'マラミュート',
  'チャウチャウ', 'アカイヌ', 'ボルドーマスティフ', 'カネコルソ', 'ベルジアンマリノア',
]
const CALM_BREEDS = [
  'シーズー', 'ゴールデンレトリーバー', 'ラブラドールレトリーバー', 'キャバリア',
  'マルチーズ', 'ビーグル', 'バセットハウンド', 'グレートデン', 'セントバーナード',
  'ニューファンドランド', 'バーニーズマウンテンドッグ',
]

export function getBreedGroup(breed: string): BreedGroup {
  if (STRONG_BREEDS.some((b) => breed.includes(b))) return 'strong'
  if (CALM_BREEDS.some((b) => breed.includes(b))) return 'calm'
  return 'normal'
}

// ===== 基礎点 =====
const BREED_BASE: Record<BreedGroup, number> = {
  strong: 25,
  normal: 10,
  calm: 5,
}

// ===== 性別係数 =====
const SEX_COEFFICIENT: Record<SexType, number> = {
  male_intact: 1.5,
  male_neutered: 1.2,
  female_intact: 1.0,
  female_spayed: 0.8,
}

// ===== 年齢グループ判定 =====
export function getMentorAgeGroup(birthDate: Date): MentorAgeGroup {
  const now = new Date()
  const monthsOld =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth())

  if (monthsOld < 18) return 'puppy'       // 0〜1.5歳
  if (monthsOld < 60) return 'adult'       // 1.5〜5歳
  if (monthsOld < 108) return 'middle'     // 5〜9歳（仕様は6〜9だが月齢で計算）
  return 'senior'                           // 10歳〜
}

// ===== 年齢係数 =====
const AGE_COEFFICIENT: Record<MentorAgeGroup, number> = {
  puppy: 2.0,
  adult: 1.2,
  middle: 0.8,
  senior: 0.5,
}

// ===== 環境ブースト加点 =====
// 各質問の回答（1〜3）から加点を計算
export function calcEnvironmentBoost(answers: number[]): number {
  // answers[0]〜answers[5] = 質問1〜6 の回答（1〜3）
  let boost = 0
  if (answers[2] === 1) boost += 30  // 質問3: 社会化の不足
  if (answers[3] === 1 || answers[3] === 2) boost += 20  // 質問4: メンター不在
  if (answers[4] === 1) boost += 15  // 質問5: 不安定な環境
  if (answers[5] === 1) boost += 20  // 質問6: エネルギー発散不足
  return boost
}

// ===== パワー値計算 =====
export function calcPowerScore(
  breedGroup: BreedGroup,
  sex: SexType,
  ageGroup: MentorAgeGroup,
  answers: number[], // 6問の回答（1〜3）
): number {
  const base = BREED_BASE[breedGroup]
  const sexCoef = SEX_COEFFICIENT[sex]
  const ageCoef = AGE_COEFFICIENT[ageGroup]
  const boost = calcEnvironmentBoost(answers)
  return Math.round(base * sexCoef * ageCoef + boost)
}

// ===== ステータス判定 =====
export function getMentorStatus(score: number): MentorStatus {
  if (score >= 80) return 'overheat'
  if (score >= 50) return 'high_energy'
  if (score >= 20) return 'standard'
  return 'therapy'
}

export interface StatusInfo {
  label: string
  emoji: string
  description: string
}

export const STATUS_INFO: Record<MentorStatus, StatusInfo> = {
  overheat: {
    label: 'オーバーヒート',
    emoji: '🔴',
    description: '環境による異常値。休息と環境改善が最優先です。',
  },
  high_energy: {
    label: 'ハイ・エナジー',
    emoji: '🟠',
    description: 'パワフルな個性。適切な「仕事」を与えることが鍵です。',
  },
  standard: {
    label: 'スタンダード',
    emoji: '🟡',
    description: '安定圏内。メンターの導きで名犬になれます。',
  },
  therapy: {
    label: 'セラピー候補',
    emoji: '🟢',
    description: '究極の安定。周囲を癒やす素質があります。',
  },
}

// ===== sexType ヘルパー =====
export function getSexType(gender: string, neutered: boolean): SexType {
  if (gender === 'male') return neutered ? 'male_neutered' : 'male_intact'
  return neutered ? 'female_spayed' : 'female_intact'
}

export const SEX_LABELS: Record<SexType, string> = {
  male_intact: '♂ オス（未去勢）',
  male_neutered: '♂ オス（去勢済）',
  female_intact: '♀ メス（未避妊）',
  female_spayed: '♀ メス（避妊済）',
}

export const AGE_GROUP_LABELS: Record<MentorAgeGroup, string> = {
  puppy: 'パピー（〜1.5歳）',
  adult: '成犬（1.5〜5歳）',
  middle: 'ミドル（6〜9歳）',
  senior: 'シニア（10歳〜）',
}

// ===== カオス度判定 =====
export function getChaosColor(total: number): ChaosColor {
  if (total >= 25) return 'red'
  if (total >= 15) return 'yellow'
  return 'blue'
}

export interface ChaosColorInfo {
  label: string
  emoji: string
  color: string
  bgColor: string
  textColor: string
}

export const CHAOS_COLOR_INFO: Record<ChaosColor, ChaosColorInfo> = {
  red: {
    label: '緊急施術が必要',
    emoji: '🔴',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
  },
  yellow: {
    label: '歪みが蓄積している',
    emoji: '🟡',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
  },
  blue: {
    label: '改善の兆しあり',
    emoji: '🔵',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
}

// ===== 称号システム =====
const MENTOR_TITLES = [
  '見習いメンター',
  '新米メンター',
  '一人前メンター',
  '熟練メンター',
  '真のメンター',
]

// chaosReduced: 合計カオス度スコアが下がった合計値
export function getMentorTitle(chaosReduced: number): string {
  const level = Math.min(Math.floor(chaosReduced / 5), MENTOR_TITLES.length - 1)
  return MENTOR_TITLES[level]
}

export function getNextTitleThreshold(chaosReduced: number): number | null {
  const level = Math.floor(chaosReduced / 5)
  if (level >= MENTOR_TITLES.length - 1) return null
  return (level + 1) * 5
}

// ===== 6つの質問データ =====
export interface DiagnosisQuestion {
  id: number
  question: string
  options: { value: number; label: string }[]
}

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: 1,
    question: '散歩の準備や帰宅時、または来客時の反応は？',
    options: [
      { value: 1, label: '激しく吠え、飛び跳ねる。来客中もいつまでも吠え止まない' },
      { value: 2, label: '喜んで吠えることもあるが、声をかければ数秒で落ち着く' },
      { value: 3, label: '尻尾を振る程度、あるいは座って静かに待てる' },
    ],
  },
  {
    id: 2,
    question: '散歩中、大きな音や他犬に遭遇した時の反応は？',
    options: [
      { value: 1, label: 'パニックになる、または攻撃的に吠えかかる。相手が去っても興奮が続く' },
      { value: 2, label: '一瞬警戒して注視するが、飼い主と目を合わせて歩き出せる' },
      { value: 3, label: '相手の出方に関わらず、気にせずスルーできる' },
    ],
  },
  {
    id: 3,
    question: '生後5ヶ月頃までに、色々な人・物音・環境を安心できる形で経験させたか？',
    options: [
      { value: 1, label: 'ほとんど経験させていない（または怖い思いをさせたままになっている）' },
      { value: 2, label: '抱っこ散歩や短時間の外出など、少しずつ経験させた' },
      { value: 3, label: '専門家の指導や計画に基づき、多様な刺激をポジティブに経験させた' },
    ],
  },
  {
    id: 4,
    question: '愛犬が他犬に吠えたり、何かに怯えて固まったりした時、あなたはどう動くか？',
    options: [
      { value: 1, label: '「ダメ！」と叫ぶか、「大丈夫だよ」となだめて抱き上げる' },
      { value: 2, label: 'どうすべきか一瞬迷い、リードを強く握りしめてしまう' },
      { value: 3, label: '無言で淡々と距離を取るか、落ち着くまで何もせず冷静に待てる' },
    ],
  },
  {
    id: 5,
    question: '家の中でのルール（寝る場所・食べ物・家具への乗降など）は家族で一貫しているか？',
    options: [
      { value: 1, label: '人によって許す基準が異なり、犬が混乱している' },
      { value: 2, label: '大体決まっているが、時々「特別に」と例外を作ってしまう' },
      { value: 3, label: '家族全員が同じ基準で、落ち着いて「Yes/No」を伝えている' },
    ],
  },
  {
    id: 6,
    question: '日々の散歩の時間と内容は？',
    options: [
      { value: 1, label: '合計30分未満。または毎日同じコースを変化なく歩くだけ' },
      { value: 2, label: '30分〜1時間程度。たまにコースを変えるなどの変化がある' },
      { value: 3, label: '1時間以上。トレーニングや遊び、匂い嗅ぎを意識的に取り入れている' },
    ],
  },
]
