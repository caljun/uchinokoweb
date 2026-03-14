'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">プライバシーポリシー</h1>
        </div>
        <p className="text-sm text-gray-400 mb-10">最終更新日：2026年3月15日</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <p>ウチの子（以下「当社」）は、アプリ「ウチの子」（以下「本サービス」）における個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-3">収集する情報</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">1. アカウント情報</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>メールアドレス</li>
                  <li>パスワード（暗号化して保存）</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2. 飼い主情報（任意項目を含む）</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>氏名、ふりがな</li>
                  <li>性別、生年月日</li>
                  <li>電話番号</li>
                  <li>住所（郵便番号、都道府県、市区町村、番地、建物名）</li>
                  <li>プロフィール写真</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">3. ペット情報</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>基本情報：名前、生年月日、体重、性別、去勢・避妊の有無、犬種・猫種</li>
                  <li>行動特性：性格診断に関する回答（多頭飼いの有無、おもちゃ好き、一緒に寝るか等）</li>
                  <li>診断結果：性格タイプ、しつけ難易度</li>
                  <li>写真</li>
                  <li>日記（写真・コメント）</li>
                  <li>健康記録</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">4. 利用状況データ</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>ミッション参加記録・写真</li>
                  <li>獲得ポイント・週間ポイント（ランキング用）</li>
                  <li>招待コード（友達紹介機能）</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-3">利用目的</h2>
            <p className="mb-2">収集した情報は以下の目的で利用します。</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>アカウントの作成・認証</li>
              <li>ペットの診断結果の算出</li>
              <li>ポイント・ランキングの管理</li>
              <li>ミッション機能の提供</li>
              <li>おすすめコンテンツの表示</li>
              <li>お問い合わせへの対応</li>
              <li>サービスの改善</li>
            </ol>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-3">ペット情報の公開について</h2>
            <p className="text-gray-600">登録したペット情報（名前、写真、診断結果等）は、認証済みユーザーが閲覧できる公開プロフィールページに表示されます。シェアカード機能を使って外部に共有した場合も同様です。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-3">第三者への提供</h2>
            <p className="mb-2">以下の場合を除き、収集した情報を第三者に提供することはありません。</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li><span className="font-semibold text-gray-800">法令に基づく場合</span>：法的要請があった場合</li>
            </ol>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-3">利用する外部サービス</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 border border-gray-200">サービス</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 border border-gray-200">提供元</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700 border border-gray-200">用途</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr>
                    <td className="px-3 py-2 border border-gray-200">Firebase Authentication</td>
                    <td className="px-3 py-2 border border-gray-200">Google</td>
                    <td className="px-3 py-2 border border-gray-200">ユーザー認証</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-3 py-2 border border-gray-200">Cloud Firestore</td>
                    <td className="px-3 py-2 border border-gray-200">Google</td>
                    <td className="px-3 py-2 border border-gray-200">データベース</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200">Cloud Storage</td>
                    <td className="px-3 py-2 border border-gray-200">Google</td>
                    <td className="px-3 py-2 border border-gray-200">写真の保存</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-3 py-2 border border-gray-200">Cloud Functions</td>
                    <td className="px-3 py-2 border border-gray-200">Google</td>
                    <td className="px-3 py-2 border border-gray-200">ポイント付与・招待処理</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 space-y-1 text-gray-600">
              <p>各サービスのプライバシーポリシー：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Google：<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">https://policies.google.com/privacy</a></li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">データの保存場所</h2>
            <p className="text-gray-600">データはGoogle Cloud（Firebase）のサーバーに保存されます。サーバーは日本国外に所在する場合があります。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">データの保持期間</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>アカウント削除により、関連するデータは削除されます</li>
              <li>法令で保存が義務付けられている情報は、必要な期間保持します</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">ユーザーの権利</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li><span className="font-semibold text-gray-800">アクセス・訂正</span>：アプリ内でご自身のデータを確認・編集できます</li>
              <li><span className="font-semibold text-gray-800">削除</span>：アカウント削除によりデータを削除できます</li>
            </ol>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">お子様の利用</h2>
            <p className="text-gray-600">本サービスは16歳未満の方を対象としていません。16歳未満の方が利用する場合は、保護者の同意が必要です。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">プライバシーポリシーの変更</h2>
            <p className="text-gray-600">本ポリシーは予告なく変更される場合があります。重要な変更がある場合は、アプリ内でお知らせします。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">お問い合わせ</h2>
            <div className="text-gray-600 space-y-1">
              <p>事業者名：ウチの子</p>
              <p>メールアドレス：<a href="mailto:calderonjunya0602@gmail.com" className="text-orange-500 hover:underline">calderonjunya0602@gmail.com</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
