# Gist Pages

Gist のファイルを Pages にする  
やってることは Service Worker で Gist のファイルを取得してレスポンスとして返却  

## URL のフォーマット

このリポジトリの Pages に下記の形式でアクセスする  
`{root}` が origin + リポジトリごとのプレフィックス  

- `{root}/{gist_id}/{filename}`
- `{root}/{gist_id}/{version}/{filename}`

## 例

- https://0rim0.github.io/gist-pages/91406bca2563746fbb46540338d7ad12/page.html
- https://0rim0.github.io/gist-pages/91406bca2563746fbb46540338d7ad12/8ce7667cd5acb9c6d1f2585d667b5dae0fa184fe/page.html

初回アクセスの場合は Service Worker をインストールして準備できたら自動でリロードするので単純に上のような URL を開くだけで良い  

## コントロールページ

`gist-pages` の後に階層がなければ、コントロールページを表示  
https://0rim0.github.io/gist-pages/  

input に URL を入れて開くボタンを押すと Gist ID やバージョン、ファイル名を認識して開く  
入力するのは `91406bca2563746fbb46540338d7ad12/page.html` みたいなものでもいいし、 Gist の画面の Raw ボタンで開く `https://gist.githubusercontent.com/0RIM0/91406bca2563746fbb46540338d7ad12/raw/8ce7667cd5acb9c6d1f2585d667b5dae0fa184fe/page.html` でもいい  

## 制限

この仕組みだと、すべての Gist ファイルが `https://0rim0.github.io/` のオリジン上にあるように扱われて、 JS を実行すると localStorage なども共有される  
安全のためにデフォルトは `0rim0` ユーザーの Gist のみ許可してる  

Service Worker のクエリパラメーターで `unrestricted=true` を付けると制限なくすべての Gist を開けるようになる  
自分の Gist をこの機能で Pages 表示したい場合はこれを付ければ良い  
