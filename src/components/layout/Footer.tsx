import Link from 'next/link'
import { PawPrint } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="hidden lg:block bg-white border-t border-gray-200 mt-auto">
      <div className="px-10 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-4 gap-10">

          {/* ブランド */}
          <div className="col-span-1">
            <Link href="/home" className="flex items-center gap-1.5 mb-3">
              <PawPrint size={16} className="text-orange-500" />
              <span className="text-sm font-bold text-gray-900 tracking-tight">ウチの子</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              わんちゃんと飼い主をつなぐ。<br />
              性格診断・店舗予約・商品購入まで。
            </p>
          </div>

          {/* サービス */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">サービス</p>
            <ul className="space-y-2">
              <li><Link href="/home" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">ホーム</Link></li>
              <li><Link href="/search" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">お店を探す</Link></li>
              <li><Link href="/uchinoko" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">うちの子</Link></li>
              <li><Link href="/reservations" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">予約</Link></li>
              <li><Link href="/cart" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">カート</Link></li>
            </ul>
          </div>

          {/* マイページ */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">マイページ</p>
            <ul className="space-y-2">
              <li><Link href="/profile" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">プロフィール</Link></li>
              <li><Link href="/profile/favorites" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">お気に入り</Link></li>
              <li><Link href="/profile/orders" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">注文履歴</Link></li>
            </ul>
          </div>

          {/* 会社・法的 */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">サポート</p>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">利用規約</Link></li>
              <li><Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">プライバシーポリシー</Link></li>
              <li><Link href="/legal" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">特定商取引法</Link></li>
              <li><Link href="/contact" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">お問い合わせ</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} uchinoko Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
