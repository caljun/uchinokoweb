// DiagnosisHelper の TypeScript 移植版（iOSコード準拠）

// ===== 犬種リスト =====
const SMALL_BREEDS = [
  'トイプードル', 'チワワ', 'ポメラニアン', 'マルチーズ', 'シーズー',
  'パピヨン', 'ミニチュアダックスフンド', 'ミニチュアシュナウザー',
  'ヨークシャーテリア', 'ペキニーズ', 'パグ', 'ボストンテリア',
  'キャバリアキングチャールズスパニエル', 'ジャックラッセルテリア',
  'シェットランドシープドッグ（ミニ）', 'ビションフリーゼ', 'マルプー',
  'ポメプー', 'チワプー', 'ダップル', 'ミックス（小型）',
]

const MEDIUM_BREEDS = [
  '柴犬', 'コーギー', 'フレンチブルドッグ', 'ビーグル',
  'ボーダーコリー', 'シェルティ', 'コッカースパニエル',
  'バセットハウンド', 'ウェルシュテリア', 'スタンダードプードル',
  'サモエド', 'ハスキー（ミニ）', 'アメリカンコッカースパニエル',
  'シバイヌ', 'ケアーンテリア', 'ウエストハイランドホワイトテリア',
  'ミックス（中型）',
]

const LARGE_BREEDS = [
  'ゴールデンレトリバー', 'ラブラドールレトリバー', 'シベリアンハスキー',
  '秋田犬', 'バーニーズマウンテンドッグ', 'ジャーマンシェパード',
  'ドーベルマン', 'グレートデン', 'アラスカンマラミュート',
  'ロットワイラー', 'ボクサー', 'ワイマラナー', 'ブルドッグ',
  'ダルメシアン', 'アフガンハウンド', 'グレーハウンド',
  'アイリッシュセッター', 'セントバーナード', 'ニューファンドランド',
  'ミックス（大型）',
]

// ===== 年齢区分計算（犬種サイズ依存） =====
// 0 = パピー期, 1 = 成犬期, 2 = シニア期
export function calculateAgeGroup(birthDate: Date, breedSize: number): number {
  const now = new Date()
  const birthYear = birthDate.getFullYear()
  const birthMonth = birthDate.getMonth()
  const birthDay = birthDate.getDate()
  const hasBirthdayPassed =
    now.getMonth() > birthMonth ||
    (now.getMonth() === birthMonth && now.getDate() >= birthDay)
  const age = now.getFullYear() - birthYear - (hasBirthdayPassed ? 0 : 1)

  if (age < 1) return 0 // パピー期

  const seniorAge = breedSize === 0 ? 10 : breedSize === 2 ? 5 : 7

  if (age < seniorAge) return 1 // 成犬期
  return 2                       // シニア期
}

// ===== 犬種サイズ判定 =====
// 0 = 小型, 1 = 中型, 2 = 大型
export function getBreedSize(breed: string): number {
  if (breed === 'わからない') return 1
  if (SMALL_BREEDS.includes(breed)) return 0
  if (MEDIUM_BREEDS.includes(breed)) return 1
  if (LARGE_BREEDS.includes(breed)) return 2
  return 0
}

// ===== 性格タイプ判定 =====
// x: 物覚え (-1=悪い, 0=普通, 1=良い)
// y: テンション (-1=怖がり, 0=普通, 1=ハイテンション)
// 戻り値: "リーダータイプ" | "右腕タイプ" | "市民タイプ" | "守られタイプ"
export function calculateTemperamentType(x: number, y: number): string {
  if (y > 0) return '市民タイプ'

  if (y === 0) {
    if (x >= 1) return 'リーダータイプ'
    if (x === 0) return '右腕タイプ'
    return '市民タイプ'
  }

  // y < 0 (怖がり)
  if (x >= 1) return '市民タイプ'
  return '守られタイプ'
}

export function getTemperamentDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'リーダータイプ': '知恵があり勇敢なまとめ役。仕事を与えて達成感を感じさせましょう。',
    '右腕タイプ': '活発で楽観的。運動と刺激をしっかり与えましょう。',
    '市民タイプ': '遊びで序列を確認します。適度な遊び相手が大切です。',
    '守られタイプ': '特定の人に甘え上手。社会化を意識してトレーニングしましょう。',
  }
  return descriptions[type] ?? ''
}

// ===== しつけ難易度ランク =====
export function calculateDifficultyRank(params: {
  multiDog: boolean
  toyLover: boolean
  sleepTogether: boolean
  restrictedRoom: boolean
  leadType: string
}): string {
  let score = 0
  if (!params.multiDog) score++
  if (!params.toyLover) score++
  if (params.sleepTogether) score++
  if (!params.restrictedRoom) score++
  if (params.leadType === 'harness') score++

  if (score === 0) return 'A'
  if (score <= 2) return 'B'
  return 'C'
}

export function getDifficultyDescription(rank: string, ageGroup: number, breedSize: number): string {
  const ageStr = ['パピー期', '成犬期', 'シニア期'][ageGroup] ?? '成犬期'
  const sizeStr = ['小型犬', '中型犬', '大型犬'][breedSize] ?? '中型犬'
  const rankDesc: Record<string, string> = {
    A: '運動不足やタスク不足で問題行動が出ることも。トレーニングで有意義な時間を作りましょう。',
    B: '活発で運動不足で問題行動が出ることも。飲み込みが早く改善しやすいです。',
    C: '社会性が低下すると吠えやすい傾向に。専門家の指示のもと段階的にトレーニングを。',
  }
  return `${ageStr}の${sizeStr}。${rankDesc[rank] ?? ''}`
}

// ===== 犬種一覧 =====
export const ALL_BREEDS = [
  'わからない',
  ...SMALL_BREEDS,
  ...MEDIUM_BREEDS,
  ...LARGE_BREEDS,
]

// ===== X軸・Y軸の選択肢 =====
export const X_OPTIONS = [
  { value: -1, label: '物覚えが悪い' },
  { value: 0, label: '普通' },
  { value: 1, label: '物覚えが良い' },
]

export const Y_OPTIONS = [
  { value: -1, label: '怖がり・控えめ' },
  { value: 0, label: '普通' },
  { value: 1, label: 'ハイテンション' },
]

export const WALK_FREQUENCY_OPTIONS = [
  '毎日1回', '毎日2回以上', '週4〜6回', '週2〜3回', '週1回以下',
]

export const DOG_FOOD_OPTIONS = [
  'ロイヤルカナン', 'ヒルズ', 'ピュリナ', 'アカナ', 'オリジン',
  'ニュートロ', 'サイエンスダイエット', 'その他',
]

// 犬種別詳細情報の型
export interface BreedInfo {
  origin: string
  purpose: string
  pros: string
  cons: string
  chip: string
}
