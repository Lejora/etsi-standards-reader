# ETSI Standards Reader

ETSI 規格書 PDF をローカル管理領域へ取り込み、原本表示と読みやすいリーディング表示を切り替えて調査する Electron アプリのプロトタイプです。

## 現在の実装範囲

- PDF 選択とアプリ管理領域への原本コピー
- SHA-256 による重複判定
- 登録済み PDF のローカルライブラリ表示
- PDF.js による原本ページレンダリング
- PDF 内蔵目次の読み取りと条項ページ移動
- ページテキストを用いたリーディング表示
- Tailwind CSS による三ペインのモダンなドキュメントワークスペース UI
- Paper / Sepia / Night テーマ切替
- 全ページ本文抽出後の簡易全文検索
- 図表・数式を原本ページで確認するフォールバック導線

## 起動

```powershell
npm.cmd install
npm.cmd run dev
```

画面右上の `PDF を登録` から、検証用ファイル
`C:\Users\shF\Downloads\ts_102223v180200p.pdf` を選択します。

登録された PDF は Electron のユーザーデータ配下にある `library/originals/` へコピーされます。アプリ画面右下に使用中の管理領域パスが表示されます。

## ビルド確認

```powershell
npm.cmd run build
```

## 次の技術検証

- 表または図の PDF 座標領域をスナップショット化してリーディングモードへ挿入
- 検索ヒットと原本 PDF テキスト座標のハイライト同期
- ページ単位ではなく条項単位での本文再構成
- 永続検索インデックスおよび注釈保存の導入

仕様は [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) を参照してください。
