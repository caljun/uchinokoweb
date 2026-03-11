export interface Recommendation {
  id: string
  title: string
  description?: string
  url: string
  imageUrl?: string
  category: 'cafe' | 'food' | 'grooming' | 'goods' | 'service' | 'other'
  /** 対象年齢グループ: 0=パピー, 1=成犬, 2=シニア。未指定=全年齢 */
  targetAgeGroups?: number[]
  /** 対象サイズ: 0=小型, 1=中型, 2=大型。未指定=全サイズ */
  targetSizes?: number[]
}

export const recommendations: Recommendation[] = [
  {
    id: 'fida-rope-toy-92cm',
    title: 'Fida 犬用ロープおもちゃ 92cm 5ノット',
    description: '天然コットン100%の頑丈なロープおもちゃ。引っ張り遊び・デンタルケア・ストレス解消に。大型犬・中型犬向け。',
    url: 'https://www.amazon.co.jp/dp/B08XLMSY47?tag=uchinoko2026-22',
    imageUrl: 'https://m.media-amazon.com/images/I/81jg2YzJTGL._AC_SL1500_.jpg',
    category: 'goods',
    targetSizes: [1, 2],
  },
  {
    id: 'rope-toy-xxl-6knot',
    title: 'XXL ロープおもちゃ 100cm 6ノット',
    description: 'ほぼ壊れない100%コットン製ロープおもちゃ。引っ張り遊び・ストレス解消に。大型犬向け。',
    url: 'https://www.amazon.co.jp/dp/B0D53YVPPM?tag=uchinoko2026-22',
    imageUrl: 'https://m.media-amazon.com/images/I/713dD43JzML._AC_SL1500_.jpg',
    category: 'goods',
    targetSizes: [2],
  },
  {
    id: 'nutro-supremo-small-adult',
    title: 'ニュートロ シュプレモ 小型犬用 成犬用 3kg',
    description: '厳選自然素材・香料着色料無添加のドライフード。小粒で食べやすく、総合栄養食。',
    url: 'https://www.amazon.co.jp/dp/B07D6GXJQQ?tag=uchinoko2026-22',
    imageUrl: 'https://m.media-amazon.com/images/I/61+Ag5jUKYL._AC_SL1024_.jpg',
    category: 'food',
    targetAgeGroups: [1],
    targetSizes: [0],
  },
  {
    id: 'nutro-supremo-puppy',
    title: 'ニュートロ シュプレモ 子犬用 全犬種用 チキン 3kg',
    description: '厳選自然素材・香料着色料無添加。パピー・妊娠期/授乳期の母犬にも対応した総合栄養食。',
    url: 'https://amzn.to/4rmcx0f',
    imageUrl: 'https://m.media-amazon.com/images/I/61Q8AMJzYpL._AC_SL1346_.jpg',
    category: 'food',
    targetAgeGroups: [0],
  },
  {
    id: 'happydog-lamb-rice-medium-large',
    title: 'ハッピードッグ 消化器ケア ラム＆ライス 4kg',
    description: 'ドイツ産ヒューマングレード・グルテンフリー。中型・大型犬の成犬〜シニア向け消化器ケアフード。',
    url: 'https://amzn.to/46TfRc7',
    imageUrl: 'https://m.media-amazon.com/images/I/714X118cv1L._AC_SL1500_.jpg',
    category: 'food',
    targetAgeGroups: [1, 2],
    targetSizes: [1, 2],
  },
  {
    id: 'wickedpup-diaper-liner-l',
    title: 'WICKEDPUP 犬用おむつライナー 100枚 Lサイズ',
    description: '男の子のマナーベルトパッド・女の子の生理用ナプキン兼用。しっかり吸収で安心。',
    url: 'https://amzn.to/4s5BoH6',
    imageUrl: 'https://m.media-amazon.com/images/I/616wyLGcUDL._AC_SL1500_.jpg',
    category: 'goods',
    targetAgeGroups: [1, 2],
    targetSizes: [1, 2],
  },
  {
    id: 'iris-pet-carrier-small',
    title: 'アイリスオーヤマ ペットキャリー 超小型犬・猫用',
    description: '軽量コンパクトで持ち運びしやすいキャリー。病院の外出に。幅29×奥行46×高さ28.5cm。',
    url: 'https://amzn.to/40ZQzFE',
    imageUrl: 'https://m.media-amazon.com/images/I/61YRi9aFr4L._AC_SL1000_.jpg',
    category: 'goods',
    targetSizes: [0],
  },
  {
    id: 'happydog-lamb-rice-small',
    title: 'ハッピードッグ ミニ 消化器ケア ラム＆ライス 4kg',
    description: 'ドイツ産ヒューマングレード・グルテンフリー。小型犬の成犬〜シニア向け消化器ケアフード。',
    url: 'https://amzn.to/4syU7dH',
    imageUrl: 'https://m.media-amazon.com/images/I/81W7mWE04vL._AC_SL1500_.jpg',
    category: 'food',
    targetAgeGroups: [1, 2],
    targetSizes: [0],
  },
  {
    id: 'lion-petkiss-dental-gum',
    title: 'ライオン PETKISS 食後の歯みがきガム やわらか 130g×2袋',
    description: '食後に噛むだけで歯の汚れをケア。やわらかタイプで食べやすい。毎日の口腔ケアに。',
    url: 'https://amzn.to/4biRPbP',
    imageUrl: 'https://m.media-amazon.com/images/I/71Y003-DKAL._AC_SL1000_.jpg',
    category: 'goods',
  },
  {
    id: 'ip-osp-paw-shampoo',
    title: '肉球おてケアシャンプー 150ml',
    description: 'お散歩後の足洗いに。拭くだけ洗い流し不要。国産・無添加・オーガニック。舐めても安心。獣医師推奨。',
    url: 'https://amzn.to/46UOVJ3',
    imageUrl: 'https://m.media-amazon.com/images/I/71XaDywvgRL._AC_SL1500_.jpg',
    category: 'grooming',
  },
  {
    id: 'sanmori-slicker-brush',
    title: 'SanMori ヒーリングブラシ スリッカーブラシ',
    description: 'ワンタッチで抜け毛が取れる。マッサージしながら被毛ケア。長毛・短毛どちらにも対応。',
    url: 'https://amzn.to/4bH7PVp',
    imageUrl: 'https://m.media-amazon.com/images/I/61Bb8vO0EpL._AC_SL1500_.jpg',
    category: 'grooming',
  },
  {
    id: 'kamitsuki-saurus-toy-small',
    title: 'かみつきザウルス 噛むおもちゃ ティラノザウルス',
    description: '音が出るぬいぐるみおもちゃ。ストレス・運動不足解消に。小型犬向け。',
    url: 'https://amzn.to/4sYSCGf',
    imageUrl: 'https://m.media-amazon.com/images/I/61y0reTWawL._AC_SL1080_.jpg',
    category: 'goods',
    targetSizes: [0],
  },
  {
    id: 'barrier-suppli-dog-adult-senior',
    title: 'バリアサプリ ドッグ アダルト・シニア 90g',
    description: '成犬・シニア犬向けサプリメント。毎日の健康維持をサポート。',
    url: 'https://amzn.to/4s8a62O',
    imageUrl: 'https://m.media-amazon.com/images/I/51XxRPjLPrL._AC_SL1200_.jpg',
    category: 'goods',
    targetAgeGroups: [1, 2],
  },
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
