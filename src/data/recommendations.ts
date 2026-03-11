export interface Recommendation {
  id: string
  title: string
  description?: string
  url: string
  imageUrl?: string
  category: 'cafe' | 'food' | 'grooming' | 'goods' | 'service' | 'other'
  /** 対象年齢グループ: 0=パピー, 1=成犬, 2=シニア。未指定=全年齢 */
  targetAgeGroups?: number[]
}

export const recommendations: Recommendation[] = [
  {
    id: 'mogwan-chicken-salmon',
    title: 'モグワン ドッグフード チキン＆サーモン 1.8kg',
    description: '着色料・香料不使用のナチュラルドッグフード。シニア犬の健康維持におすすめ。',
    url: 'https://amzn.to/3Pe5v0d',
    imageUrl: 'https://m.media-amazon.com/images/I/61FDATR3MeL._AC_SL1500_.jpg',
    category: 'food',
    targetAgeGroups: [2],
  },
]
