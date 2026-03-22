import type { BreedGroup, SexType, MentorAgeGroup, MentorStatus } from '@/lib/mentorDiagnosis'

export interface Dog {
  id?: string
  petType?: 'dog' | 'cat'
  name: string
  birthDate: Date
  ageGroup?: number      // 旧フィールド（後方互換）
  weight: number
  gender: string         // "male" | "female"
  neutered?: boolean
  breed: string
  mixBreed1?: string
  mixBreed2?: string
  breedSize: number      // 0=小型, 1=中型, 2=大型
  coatPattern?: string   // 猫の毛色・柄（旧フィールド）

  // メンター診断結果
  breedGroup?: BreedGroup         // "strong" | "normal" | "calm"
  sex?: SexType                   // "male_intact" | "male_neutered" | "female_intact" | "female_spayed"
  mentorAgeGroup?: MentorAgeGroup // "puppy" | "adult" | "middle" | "senior"
  powerScore?: number             // パワー値
  mentorStatus?: MentorStatus     // "overheat" | "high_energy" | "standard" | "therapy"
  diagnosisAnswers?: number[]     // 6問の回答 [1〜3] × 6

  // 旧診断フィールド（後方互換・既存ドキュメントに残っている場合がある）
  temperamentType?: string
  difficultyRank?: string
  difficultyDescription?: string

  photoUrl?: string
  isPublic: boolean
  createdAt: Date

  ownerId?: string
}

export interface DiaryCreatedBy {
  type: 'owner' | 'shop'
  id: string
  name: string
}

export interface Diary {
  id?: string
  dogId: string
  ownerId: string
  photos: string[]
  comment: string
  createdAt: Date
  createdBy?: DiaryCreatedBy
}

export interface HealthRecord {
  id?: string
  dogId: string
  ownerId: string
  recordDate: Date
  weight?: number
  condition?: string
  appetite?: string
  note?: string
  createdAt: Date
}

export interface Checkin {
  id?: string
  dogId: string
  date: Date
  alertLevel: number       // 警戒レベル 0-10
  frustrationLevel: number // 不満レベル 0-10
  exhaustionLevel: number  // 疲弊レベル 0-10
  totalChaos: number
  chaosColor: 'red' | 'yellow' | 'blue'
  createdAt: Date
}

export interface MentorProgress {
  dogId: string
  currentChapter: number          // 1-5
  mentorTitle: string             // 称号
  chaosReduced: number            // 累計削減量（称号判定用）
  totalChaosHistory: { date: string; total: number }[]  // グラフ用
  completedMissions: string[]     // missionId[]
  updatedAt: Date
}
