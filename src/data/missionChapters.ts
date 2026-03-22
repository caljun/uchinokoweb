export type TargetMetric = 'alertLevel' | 'frustrationLevel' | 'exhaustionLevel' | 'all'

export interface Mission {
  id: string
  title: string
  description: string        // 具体策
  completed: boolean         // UI表示用（Firestoreで管理）
}

export interface Chapter {
  number: number
  title: string
  subtitle: string
  targetMetrics: TargetMetric[]
  missions: Omit<Mission, 'completed'>[]
}

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    title: '脳の冷却',
    subtitle: '睡眠の質を整える',
    targetMetrics: ['alertLevel'],
    missions: [
      {
        id: 'ch1_sleep',
        title: '16時間睡眠の確保',
        description: '玄関から離れた静かな場所にクレートを置き、布をかけて暗室環境を作る。',
      },
      {
        id: 'ch1_quiet',
        title: '就寝前の静寂タイム',
        description: '就寝1時間前はテレビ・スマホの音を最小限に。犬が落ち着けるBGMをかけてもOK。',
      },
    ],
  },
  {
    number: 2,
    title: '静寂の絆',
    subtitle: '無言の誘導をマスターする',
    targetMetrics: ['exhaustionLevel'],
    missions: [
      {
        id: 'ch2_silent_walk',
        title: '1日10分の無言散歩',
        description: '声を出さず、体幹とリードの感触だけで犬を導く。焦らず、犬が動くのを待つ。',
      },
      {
        id: 'ch2_silent_lead',
        title: '無言リードワーク練習',
        description: '家の中でリードをつけて、声なしで方向転換を練習する。1回3分でOK。',
      },
    ],
  },
  {
    number: 3,
    title: '世界の再定義',
    subtitle: '冒険散歩で脳を刺激する',
    targetMetrics: ['frustrationLevel'],
    missions: [
      {
        id: 'ch3_new_route',
        title: '毎日コースを少し変える',
        description: '縁石の上を歩かせる、公園の別入口から入るなど、小さな変化を加える。',
      },
      {
        id: 'ch3_sniff_time',
        title: '匂い嗅ぎタイムを設ける',
        description: '散歩中に3〜5分、犬が好きな場所で思う存分匂いを嗅がせる。リードを緩める。',
      },
      {
        id: 'ch3_sniff_game',
        title: 'おやつ探しゲーム',
        description: '庭や部屋に小さなおやつを隠して鼻で探させる。1セッション5分程度。',
      },
    ],
  },
  {
    number: 4,
    title: '一貫性の境界線',
    subtitle: 'ルールを家族で統一する',
    targetMetrics: ['alertLevel', 'frustrationLevel'],
    missions: [
      {
        id: 'ch4_rules_write',
        title: 'Yes/Noルールを紙に書き出す',
        description: '寝る場所・家具への乗降・食べ物のルールを文字に書いて家族全員に共有する。',
      },
      {
        id: 'ch4_rules_practice',
        title: '全員が同じ基準で対応する',
        description: '今日1日、全員がルール通りに対応できたか夜に確認する。例外を作らない。',
      },
    ],
  },
  {
    number: 5,
    title: '才能の解放',
    subtitle: '犬種の特性を活かした仕事を与える',
    targetMetrics: ['all'],
    missions: [
      {
        id: 'ch5_breed_game',
        title: '犬種別の遊び・仕事',
        description:
          'テリア系→穴掘りゲーム（砂場・段ボールを用意）\nレトリーバー系→物持ってこいゲーム\n牧羊犬系→アジリティ・ボール転がし\n小型犬→宝探し・トリックトレーニング',
      },
      {
        id: 'ch5_trick',
        title: '新しいトリックを1つ教える',
        description: '「おすわり→まて→よし」でも新ルーティンでもOK。毎日3分、同じトリックを練習する。',
      },
    ],
  },
]
