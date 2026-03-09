export interface Dog {
  id?: string
  name: string
  birthDate: Date
  ageGroup: number       // 0=パピー期, 1=成犬期, 2=シニア期
  weight: number
  gender: string         // "male" | "female"
  neutered?: boolean
  breed: string
  mixBreed1?: string     // ミックス時の1つ目の犬種
  mixBreed2?: string     // ミックス時の2つ目の犬種
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

export interface DiaryCreatedBy {
  type: 'owner' | 'shop'
  id: string             // shopId or ownerId
  name: string           // 店舗名 or 飼い主名
}

export interface Diary {
  id?: string
  dogId: string
  ownerId: string
  photos: string[]       // 最大3枚
  comment: string
  createdAt: Date
  createdBy?: DiaryCreatedBy  // 未設定の場合は飼い主の投稿とみなす
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
