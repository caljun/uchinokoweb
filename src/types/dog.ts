export interface Dog {
  id?: string
  name: string
  birthDate: Date
  ageGroup: number       // 0=パピー期, 1=成犬期, 2=シニア期
  weight: number
  gender: string         // "male" | "female"
  neutered?: boolean
  breed: string
  breedSize: number      // 0=小型, 1=中型, 2=大型

  // 社会化マップ
  x: number              // -1=悪い, 0=普通, 1=良い（物覚え）
  y: number              // -1=怖がり, 0=普通, 1=ハイテンション（テンション）
  multiDog: boolean
  toyLover: boolean
  sleepTogether: boolean
  restrictedRoom: boolean
  leadType: string       // "lead" | "harness"

  // 生活情報
  dogFood?: string
  dogFoodImageUrl?: string
  walkFrequency?: string
  activeSeason?: string  // "summer" | "winter"
  hospitalHistory: boolean
  allergy: boolean

  // 診断結果
  temperamentType: string  // "リーダータイプ"|"右腕タイプ"|"市民タイプ"|"守られタイプ"
  difficultyRank: string   // "A"|"B"|"C"
  difficultyDescription: string

  photoUrl?: string
  isPublic: boolean
  createdAt: Date
}

export interface Diary {
  id?: string
  dogId: string
  ownerId: string
  photos: string[]       // 最大3枚
  comment: string
  createdAt: Date
}

export interface HealthRecord {
  id?: string
  dogId: string
  ownerId: string
  recordDate: Date
  weight?: number
  condition?: string     // "元気"|"普通"|"ちょっと心配"|"しんどい"
  appetite?: string      // "よく食べた"|"普通"|"あまり食べなかった"
  note?: string
  createdAt: Date
}
