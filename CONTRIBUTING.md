# 共同開発の進め方

店舗を追加し、他の人の変更を取り込み、レビューを受けて改善するための手順です。最初に [README](README.md) の開き方とデータ形式を確認してください。参加者は Git・エディタ・ブラウザを用意します。Node.js・npm のインストールやローカルビルドは不要です。

## 使うリポジトリと置換箇所

コマンドを実行する前に、次の大文字の表記を実際の値に置き換えてください。`INSTRUCTOR_ACCOUNT` と `REPOSITORY_NAME` は講師から共有されます。

| 表記 | 意味 |
| --- | --- |
| `INSTRUCTOR_ACCOUNT` | 元リポジトリの所有者 |
| `YOUR_ACCOUNT` | 自分の GitHub アカウント |
| `REPOSITORY_NAME` | リポジトリ名 |
| `p01` | 自分に割り当てられた参加者番号など |

| remote 名 | 接続先 | 主な用途 |
| --- | --- | --- |
| `origin` | 自分の fork：`https://github.com/YOUR_ACCOUNT/REPOSITORY_NAME.git` | 自分の作業ブランチを push する |
| `upstream` | 講師の元リポジトリ：`https://github.com/INSTRUCTOR_ACCOUNT/REPOSITORY_NAME.git` | みんなの変更を fetch する |

PR は **自分の fork の作業ブランチ → 元リポジトリの `main`** に送ります。自分の fork の `main` を送り先にしないよう確認してください。

## 1. 元リポジトリを fork する

ブラウザで `https://github.com/INSTRUCTOR_ACCOUNT/REPOSITORY_NAME` を開き、右上の **Fork → Create fork** を選びます。所有者を自分のアカウントにし、リポジトリ名は同じにします。以後、参加者は自分の fork に push します。

## 2. 自分の fork を clone する

```sh
git clone https://github.com/YOUR_ACCOUNT/REPOSITORY_NAME.git
cd REPOSITORY_NAME
```

HTTPS の push では GitHub への認証が必要です。GitHub CLI や Git Credential Manager など、講師が案内する方法でサインインしてください。アカウントのパスワードは Git の HTTPS 認証には使いません。

## 3. 元リポジトリを upstream として登録する

```sh
git remote add upstream https://github.com/INSTRUCTOR_ACCOUNT/REPOSITORY_NAME.git
git remote -v
```

`origin` が自分の fork、`upstream` が元リポジトリになっていれば完了です。この登録は clone 後に一度だけ行います。

## 4. 作業前に元リポジトリの最新状態を取り込む

毎回、新しい作業を始める前に行います。

```sh
git status
git switch main
git fetch upstream
git merge --ff-only upstream/main
git push origin main
```

`git status` で未コミットの作業がないことを確認してから切り替えます。作業中の変更がある場合は、その作業ブランチでコミットしてから進めてください。`fetch` は元リポジトリの最新履歴を取得し、`merge --ff-only` は手元の `main` をその最新状態へ進めます。最後の push で自分の fork の `main` も揃えます。

`--ff-only` で停止した場合は、手元の `main` に独自のコミットがあるなど、履歴が分岐しています。`reset --hard` や force push を試さず、`git log --oneline --graph --all -15` で状態を確認し、講師と整理してください。普段の編集を作業ブランチに限定すると防げます。

## 5. 作業ブランチを作る

```sh
git switch -c add/p01-nami-cafe
```

担当 Issue があれば先に「担当します」と伝えます。1 つの PR では 1 つの目的を扱い、店舗追加と共通 CSS の変更など、独立した作業は別ブランチに分けてください。

## 6. 店舗を追加・修正する

```sh
cp templates/shop-template.json src/shops/p01-nami-cafe.json
```

エディタで JSON を開き、`id` を `p01-nami-cafe` にして、すべての店舗情報を書き換えます。画像がなければ `image` を空文字にします。エディタでファイルをコピーしても構いません。共通の `src/data/shop-data.js` は編集しません。詳しい項目とカテゴリは [README の店舗追加手順](README.md#自分のお店を追加する)を参照してください。

他の人のお店を改善する場合は、担当を確認してから、その店舗の JSON を編集します。共通 CSS の修正では、店舗ごとのファイルを必要以上に触らず、影響するページを確認してください。

## 7. ローカルで表示と検証を確認する

1. clone したフォルダの `index.html` をダブルクリックして開きます。
2. トップページの「店舗データを読み込む」を押します。
3. `src/shops/` 内の JSON をすべて選びます（Windows は `Ctrl+A`、Mac は `Command+A`）。ひな形がある `templates/` は選びません。
4. エラーが表示されたら、対象ファイルの項目を直して保存し、もう一度すべて選び直します。

読み込んだ時点の店舗情報が表示されます。**JSON を編集した後は、ブラウザの再読込だけでは反映されません。保存後に JSON を選び直してください。** HTML・CSS・JavaScript は保存後の再読込で反映されます。

ブラウザで次を確認します。

- 一覧に店舗が表示され、リンク先の詳細ページの情報が正しい。
- 店名や紹介文で検索でき、カテゴリ絞り込みとも併用できる。
- 画像なしの場合は代替画像が表示される。
- スマートフォン幅（例：375px）でも横にはみ出さず読める。
- 共通コードを変更した場合、他の店舗や該当なしの案内も表示できる。

## 8. commit して自分の fork へ push する

```sh
git status
git diff
git add src/shops/p01-nami-cafe.json
git diff --cached
git commit -m "なみ喫茶の店舗情報を追加"
git push -u origin add/p01-nami-cafe
```

画像も追加した場合は、コミット前に `git add images/shops/p01-nami-cafe.svg` も実行します。`git add` には自分が意図して変更したファイルだけを指定します。`git diff --cached` でコミットする内容を読み返してください。

## 9. 元リポジトリの main に向けて PR を作る

push 後に表示される URL、または GitHub の **Compare & pull request** から PR を作ります。GitHub の比較欄を次の通りにします。

| 項目 | 設定 |
| --- | --- |
| base repository（送り先） | `INSTRUCTOR_ACCOUNT/REPOSITORY_NAME` |
| base branch | `main` |
| head repository（送り元） | `YOUR_ACCOUNT/REPOSITORY_NAME` |
| compare branch | `add/p01-nami-cafe` |

変更内容・理由・確認事項を書き、見た目を変えた場合はスクリーンショットを添えます。Issue に対応していれば `Closes #123` のように関連付けます。**Files changed** に意図しないファイルがないか確認してから **Create pull request** を押します。

**Checks** の **Validate and build** が成功することを確認します。全店舗のデータ検証とビルドは GitHub 上で実行されるので、参加者の PC に Node.js・npm は不要です。fork から初めて送る PR では、GitHub の設定により workflow 実行に講師の承認が必要になる場合があります。待機中と失敗を区別し、失敗した場合はログに示されたファイルや項目を直してください。

## 10. レビュー指摘を同じブランチで修正する

新しい PR を作らず、元の作業ブランチに修正を追加します。

```sh
git switch add/p01-nami-cafe
# エディタで修正し、手順 7 と同じ方法で JSON を読み込み直して確認する
git diff
git add src/shops/p01-nami-cafe.json
git commit -m "レビューを受けて営業時間の表記を改善"
git push origin add/p01-nami-cafe
```

同じブランチへの push は、作成済みの PR に自動で反映されます。PR のコメントに「営業時間の表記を修正しました」など修正内容を返信し、再確認を依頼します。レビューでは、気になる理由と具体的な改善案を伝えましょう。

### レビュー待ちの間に upstream が更新された場合

作業をコミットした状態で、元リポジトリの `main` を作業ブランチに取り込みます。

```sh
git switch add/p01-nami-cafe
git fetch upstream
git merge upstream/main
```

コンフリクトがなければ、手順 7 に沿って全 JSON を読み込み直し、表示と検証結果を確認してから `git push origin add/p01-nami-cafe` します。コンフリクトが発生した場合は、[演習資料の解消手順](docs/exercises.md#conflict-exercise)を参考にしてください。レビューを受けているブランチでは、履歴を書き換えず merge で取り込めます。

## 11. マージ後、最新状態を取り込んで次の作業を始める

GitHub で元リポジトリへのマージを確認してから行います。

```sh
git status
git switch main
git fetch upstream
git merge --ff-only upstream/main
git push origin main
git switch -c improve/p01-shop-description
```

次の作業は、最新の `main` から新しいブランチで始めます。マージ済みの作業ブランチに新しい変更を足し続けないでください。追加のインストール作業はありません。

元リポジトリの変更を取り込んだら、HTML を再読込し、「店舗データを読み込む」から最新の `src/shops/` 内の JSON をすべて選びます。これで自分以外の新しい店舗も一覧で確認できます。同梱の見本データは店舗追加ごとには更新されないため、この読み込みを忘れないでください。追加された店舗を確認し、次は別の参加者の店舗紹介や共通レイアウトを改善するなど、役割を交代してみましょう。
