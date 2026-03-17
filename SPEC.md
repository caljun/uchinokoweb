# uchinokoweb 仕様書

## 1. 概要

**uchinokoweb** は、ペット（犬・猫）のプロフィール管理とゲーミフィケーションを組み合わせた Web アプリケーションです。  
「ウチの子」のプロフィールを作成し、毎日のミッションでポイントを貯めて週間ランキングで1位を目指すことができます。

- **技術スタック**: Next.js 16 (App Router), React 19, Firebase (Auth / Firestore / Storage / Functions), Tailwind CSS
- **デプロイ**: Vercel（本番: `uchinokoweb.vercel.app`）
- **関連サービス**: LP（uchinoko-lp.vercel.app）、管理画面（uchinoko-admin）、Tempo（uchinokotempo）

---

## 2. 認証・ユーザー

### 2.1 認証方式

- **Firebase Authentication**: メールアドレス + パスワード
- ログイン・新規登録は `/auth` で実施
- ルート `/` は未ログイン時はランディング、ログイン済みは `/profile` にリダイレクト

### 2.2 新規登録時の仕様

- お名前（displayName）、メール、パスワード（6文字以上）必須
- **招待コード（任意）**: `?ref=ABC123` で友達の招待コードを渡すと、登録時に入力可能。お互いに100pt付与（Cloud Functions で処理）
- **紹介用パラメータ**: `?for=<dogId>` で「どの子の紹介で来たか」を紐づけ可能

### 2.3 LINE ブラウザ対応

- User-Agent で LINE 内ブラウザを検出
- 登録が正しく完了しない場合があるため、Android は Chrome・iOS は Safari で開くよう案内

### 2.4 オンボーディング

- 初回ログインでペット未登録の場合、メイン画面にアクセスすると `OnboardingGuard` がオンボーディングへ誘導する
- フロー: **プロフィール写真（任意）** → **ペット種別（犬/猫）** → **犬 or 猫の1頭目登録** → **ウチの子詳細** `/uchinoko/[dogId]?welcome=1` へ遷移し、シェア促進バナーを表示
- Guard チェック: `owner?.photoUrl` なし → `/onboarding/profile`、`hasDog === false` → `/onboarding/pet-type`

### 2.5 新規登録からの流れ

| # | 画面・アクション | 説明 |
|---|------------------|------|
| 1 | **ランディング** `/` | 「はじめる（無料）」→ `/auth?mode=signup`。「ログインはこちら」→ `/auth`。ログイン済みは `/profile` へ。 |
| 2 | **新規登録** `/auth` | お名前・メール・パスワード（6文字以上）。招待コード（任意）は `?ref=XXX` で事前入力可。登録成功で Firebase Auth と `owners/{uid}` 作成（`friendId` 付与）、招待コードあれば CF でポイント付与。 |
| 3 | **リダイレクト** → `/uchinoko` | 登録直後に `/uchinoko` へ。`OnboardingGuard` が動作。 |
| 4 | **オンボーディング** → `/onboarding/profile` | 飼い主に `photoUrl` が無いため `/onboarding/profile` へ。STEP 1/3。写真を設定 or スキップ → `/onboarding/pet-type`。 |
| 5 | **ペット種別** `/onboarding/pet-type` | STEP 2/3。犬 or 猫を選択 → `/onboarding/dog` または `/onboarding/cat`。 |
| 6 | **1頭目登録** `/onboarding/dog` または `/onboarding/cat` | 名前・誕生日・体重・性別・犬種（または猫の項目）・写真などを入力。犬の場合は性格診断・生活情報も。保存で `owners/{uid}/dogs/{dogId}` 作成、`setHasDog(true)` 後に **`/uchinoko/[dogId]?welcome=1`** へ（一覧ではなく**詳細ページ**へ）。 |
| 7 | **ウチの子詳細 + ウェルカムバナー** `/uchinoko/[dogId]?welcome=1` | 登録した子の詳細ページが開く。**シェア促進バナー**が表示：「登録完了！ ○○のシェアカードを作って友達に教えよう」＋「シェアカードを作る」ボタン。タップで `ShareCardsModal` を開いてカード作成・共有。閉じる or バナーを消すと `?welcome=1` を外して通常表示へ。 |
| 8 | **以降** | ウチの子一覧・詳細・ミッション・ランキング・おすすめ・マイページなど通常利用。 |

**補足**

- `/onboarding/welcome` は実装上すぐ `/uchinoko` にリダイレクトするため、通常フローでは経由しない。
- 一覧ページ `/uchinoko?welcome=1` に直接アクセスした場合のみ、従来のウェルカムモーダル（「今日の一枚」ミッション投稿 → 投稿後はランキング説明 → ランキングを見る / ミッションをもっとやる）が表示される。通常のオンボーディング完了後は詳細ページに飛ぶため、このモーダルはメインフローでは使われない。

---

## 3. データ構造（Firestore）

### 3.1 コレクション構成

| パス | 説明 |
|------|------|
| `owners/{uid}` | 飼い主プロフィール（1ユーザー1ドキュメント） |
| `owners/{uid}/dogs/{dogId}` | ペット（犬 or 猫） |
| `owners/{uid}/dogs/{dogId}/diaries` | 日記（ミッション投稿・手動投稿） |
| `owners/{uid}/dogs/{dogId}/completedMissions` | 日次ミッション達成（`{date}_{missionId}` など） |
| `owners/{uid}/dogs/{dogId}/healthRecords` | 健康記録 |
| `owners/{uid}/friends/{friendUid}` | フレンド（相互登録） |
| `friendRequests` | フレンド申請（fromUid, toUid, status 等） |
| `recommendations` | おすすめ商品（管理画面で管理、order, isActive, tapCount 等） |
| `referralCodes/{code}` | 招待コード → ownerUid のマッピング |

### 3.2 飼い主（owners）

- `email`, `displayName`, `name`, `nameKana`, `photoUrl`, `address`, `phone`, `postalCode`, `prefecture`, `city`, `street`, `building`
- ゲーム: `totalPoints`, `weeklyPoints`, `weeklyPointsWeekStr`, `primaryDogName`
- 招待: `friendId`（6文字のユニークコード）, `pendingPoints`
- その他: `lastOpenedAt`, `fcmToken`（プッシュ用）

### 3.3 ペット（dogs）

- **種別**: `petType`: `'dog' | 'cat'`（未設定は犬扱い）
- **基本**: `name`, `birthDate`, `ageGroup`（0: パピー/子猫, 1: 成犬/成猫, 2: シニア）, `weight`, `gender`, `neutered`, `breed`, `mixBreed1`, `mixBreed2`, `breedSize`（0: 小型, 1: 中型, 2: 大型）, `coatPattern`（猫）
- **性格診断（犬）**: `x`, `y`（社会化マップ）, `multiDog`, `toyLover`, `sleepTogether`, `restrictedRoom`, `leadType`
- **生活**: `dogFood`, `walkFrequency`, `activeSeason`, `hospitalHistory`, `allergy`
- **診断結果**: `temperamentType`, `difficultyRank`, `difficultyDescription`
- **表示**: `photoUrl`, `photos[]`, `isPublic`, `createdAt`
- **ゲーム**: `ownerId`, `totalPoints`, `weeklyPoints`, `weeklyPointsWeekStr`

### 3.4 日記（diaries）

- `dogId`, `ownerId`, `photos`（最大3枚）, `comment`, `createdAt`
- `createdBy`: 飼い主投稿 or 店舗投稿（type, id, name）

### 3.5 健康記録（healthRecords）

- `dogId`, `ownerId`, `recordDate`, `weight`, `condition`, `appetite`, `note`, `createdAt`

---

## 4. 画面・ルート一覧

### 4.1 認証・ランディング

| パス | 説明 |
|------|------|
| `/` | 未ログイン: ランディング（はじめる/ログイン）。ログイン済み: `/profile` へ |
| `/auth` | ログイン・新規登録。`?mode=signup`, `?ref=`, `?for=` 対応 |

### 4.2 オンボーディング

（Guard による誘導順）

| パス | 説明 |
|------|------|
| `/onboarding/profile` | STEP 1/3。飼い主プロフィール写真（任意）。次へ or スキップ → pet-type |
| `/onboarding/pet-type` | STEP 2/3。犬 or 猫選択 → dog または cat |
| `/onboarding/dog` | 犬の1頭目登録（名前・誕生日・体重・性別・犬種等＋写真）。保存後 → `/uchinoko/[dogId]?welcome=1` |
| `/onboarding/cat` | 猫の1頭目登録。保存後 → `/uchinoko/[dogId]?welcome=1` |
| `/onboarding/welcome` | 未使用時は `/uchinoko` にリダイレクト。通常フローでは経由しない |

### 4.3 メイン（(main) レイアウト）

- **ヘッダー** + **フッター**（PC） + **下タブナビ**（モバイル: マイページ / ミッション / ランキング / おすすめ）

| パス | 説明 |
|------|------|
| `/uchinoko` | ウチの子一覧。ペット追加・各子の詳細への入口。 |
| `/uchinoko/new` | 犬の新規登録（基本情報＋性格診断＋生活情報→診断結果） |
| `/uchinoko/new-cat` | 猫の新規登録 |
| `/uchinoko/[dogId]` | ウチの子詳細（タブ: 詳細 / ギャラリー）。編集・削除・シェアカード・招待・日記一覧。`?welcome=1` でシェア促進バナーを表示 |
| `/uchinoko/[dogId]/edit` | 犬の編集 |
| `/uchinoko/[dogId]/diary/new` | 日記（写真＋コメント）新規投稿 |
| `/uchinoko/[dogId]/diary/[diaryId]` | 日記詳細・削除 |
| `/uchinoko/[dogId]/health/new` | 健康記録の追加 |
| `/missions` | 日次ミッション（今日の一枚・お散歩ショット等）＋週1回の「今週のベストショット」。写真投稿でポイント付与 |
| `/ranking` | 週間ランキング（全体 / フレンド）。collectionGroup で `dogs` の `weeklyPoints` を集計 |
| `/home` | ウチの子おすすめ。recommendations を犬/猫・年齢・サイズでフィルタ・ソートして表示。アフィリエイトリンク |
| `/profile` | マイページ。登録ペット一覧・プロフィール編集・フレンド・お気に入り・設定へのリンク |
| `/profile/edit` | 飼い主プロフィール編集 |
| `/profile/owner` | オーナー（飼い主）情報 |
| `/profile/friends` | フレンド一覧・申請・検索（friendId で検索）・承認・削除 |
| `/profile/favorites` | お気に入り |
| `/profile/settings` | 設定（プロフィール編集・ログアウト・アカウント削除） |
| `/dogs/[ownerId]/[dogId]` | **他ユーザーの子**の公開ページ。フレンド申請・日記閲覧。`isPublic` で公開制御 |
| `/notifications` | 通知一覧（現状は「通知はまだありません」のプレースホルダ） |
| `/terms` | 利用規約 |
| `/privacy` | プライバシーポリシー |

---

## 5. 主要機能仕様

### 5.1 ミッション

- **日次ミッション（犬）**: 今日の一枚(10pt), お散歩ショット(10pt), お座りショット(10pt)
- **日次ミッション（猫）**: 今日の一枚(10pt), お昼寝ショット(10pt), 遊び中ショット(10pt)
- **週間ミッション**: 今週のベストショット(30pt)、週1回まで
- 達成すると `completedMissions` に記録し、犬の `weeklyPoints` / オーナーの `weeklyPoints` を加算（トランザクション）
- タイムゾーン: JST（`getTodayStr`, `getCurrentWeekStr` で日付・週を計算）

### 5.2 ランキング

- **週間ポイント**でランキング（`collectionGroup(db, 'dogs')` で `weeklyPoints` 降順、上限50件）
- タブ: 全体 / フレンド（自分のフレンドの犬のみ）
- 各カードから `/dogs/[ownerId]/[dogId]` へリンク

### 5.3 おすすめ（ホーム）

- Firestore の `recommendations` を `order` で取得
- `targetPetType`（dog/cat）, `targetAgeGroups`, `targetSizes` でフィルタ・スコア付けして表示
- カテゴリ: ドッグカフェ, ドッグフード, トリミング, グッズ, サービス, キャットフード, 猫グッズ等
- タップで `tapCount` を increment（分析用）

### 5.4 フレンド

- **friendId**: 各オーナーに6文字のユニークコードを付与（検索用）
- フレンド申請: `friendRequests` に `fromUid`, `toUid`, `status` で作成。承認で `owners/{uid}/friends/{friendUid}` を双方向に作成
- 他ユーザーの子は `/dogs/[ownerId]/[dogId]` で閲覧（公開設定時）

### 5.5 共有・招待

- **ウチの子カード共有**: `ShareCardsModal` でプロフィールカード画像を生成（html2canvas + QRコード）。LP URL（uchinoko-lp.vercel.app）の QR 付き
- **招待**: 飼い主の `friendId` と `dogId` を使い ` /auth?ref=XXX&for=dogId` を共有。Web Share API またはクリップボード

### 5.6 プッシュ通知

- FCM トークンを `owners/{uid}.fcmToken` に保存（`lib/fcm.ts`）
- `firebase-messaging-sw.js` でサービスワーカー設定。本番は Firebase プロジェクト `uchinoko-53c2f`

### 5.7 ストレージ

- 写真: `owners/{uid}/dogs/{dogId}/...` または `owners/{uid}/dogs/{dogId}/missionPhotos/...` などで Firebase Storage にアップロード
- CORS: `storage-cors.json` で localhost / web.app / firebaseapp.com を許可

---

## 6. UI・UX メモ

- モバイル: 下タブナビ（マイページ・ミッション・ランキング・おすすめ）。`pb-28` でタブ高さ分の余白。
- PC: フッターでサービス・マイページ・サポートリンクを表示。
- 未ログインで要ログイン画面にアクセスした場合、`AuthModal` でログイン促し（`AuthModalContext`）。
- テーマカラー: オレンジ（`orange-400`, `orange-500` 等）。背景は `gray-50`。

---

## 7. 環境変数（例）

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

---

## 8. 外部連携

- **Cloud Functions**: `us-central1`。招待ポイント付与・ランキング集計等は functions 側で実装されている想定
- **LP**: 共有カードの QR 先は `https://uchinoko-lp.vercel.app/`

---

以上が uchinokoweb の仕様のまとめです。実装の細部（バリデーション・エラーハンドリング・PWA キャッシュ名 `uchinoko-v1` 等）はソースコードを参照してください。
