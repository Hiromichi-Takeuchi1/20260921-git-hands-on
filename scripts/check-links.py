#!/usr/bin/env python3
"""公開する HTML のリンク・画像・重複 ID を確認する（Python 標準ライブラリのみ）。"""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys


ROOT = Path(__file__).resolve().parent.parent


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = set()
        self.links = []
        self.errors = []

    def error(self, line, message):
        self.errors.append(f"{self.path.relative_to(ROOT)}:{line}: {message}")

    def handle_starttag(self, tag, attributes):
        line = self.getpos()[0]
        for name, value in attributes:
            if name == "id" and value:
                if value in self.ids:
                    self.error(line, f'id="{value}" が重複しています。一意な ID に変更してください。')
                self.ids.add(value)
            if name in ("href", "src") and value is not None:
                self.links.append((line, name, value))

    def handle_startendtag(self, tag, attributes):
        self.handle_starttag(tag, attributes)


def main():
    paths = sorted(ROOT.glob("*.html")) + sorted((ROOT / "shops").glob("*.html"))
    if not (ROOT / "index.html").is_file():
        print("index.html: トップページがありません。ファイル名を確認してください。", file=sys.stderr)
        return 1

    pages = {}

    def read_page(path):
        if path not in pages:
            page = Page(path)
            pages[path] = page
            try:
                page.feed(path.read_text(encoding="utf-8"))
                page.close()
            except (OSError, UnicodeError) as error:
                page.error(1, f"HTML を UTF-8 で読み込めません: {error}")
        return pages[path]

    for path in paths:
        read_page(path)

    for path in paths:
        page = pages[path]
        for line, attribute, value in page.links:
            try:
                url = urlsplit(value)
            except ValueError:
                page.error(line, f'{attribute}="{value}" の URL を確認してください。')
                continue
            if url.scheme or url.netloc:
                continue
            if not value and attribute == "src":
                page.error(line, 'src が空です。画像やスクリプトのパスを指定してください。')
                continue
            if url.path.startswith("/"):
                page.error(line, f'{attribute}="{value}" を相対パスにしてください（GitHub Pages 対応）。')
                continue

            target = (path.parent / unquote(url.path)).resolve() if url.path else path
            if not target.is_relative_to(ROOT):
                page.error(line, f'{attribute}="{value}" がサイトの外を指しています。パスを修正してください。')
                continue
            if target.is_dir():
                target = target / "index.html"
            if not target.is_file():
                page.error(line, f'{attribute}="{value}" のファイルがありません。パスとファイル名を確認してください。')
                continue
            if url.fragment and target.suffix.lower() == ".html":
                fragment = unquote(url.fragment)
                if fragment not in read_page(target).ids:
                    page.error(line, f'{attribute}="{value}" の移動先 ID "{fragment}" がありません。href または id を修正してください。')

    errors = [error for page in pages.values() for error in page.errors]
    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"\n{len(errors)} 件のエラーがあります。", file=sys.stderr)
        return 1
    print(f"OK: {len(paths)} ページのリンク・画像・HTML ID を確認しました。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
