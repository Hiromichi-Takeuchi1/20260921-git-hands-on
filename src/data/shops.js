// 通常の script として読み込むため、file:// でもサーバーなしで動きます。
(() => {
  const site = globalThis.Hidamari;
  // エディタのローカルプレビューでも、同じ店舗読み込み欄を使えます。
  site.isLocal = window.location.protocol === 'file:' ||
    ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  site.shops = [...site.shopData];
  site.previewToken = '';
  site.previewError = '';

  // file:// の保存領域はブラウザごとに異なるため、確認中のデータは
  // URL の # 以降に持たせて詳細・一覧間で引き継ぎます。外部送信はしません。
  function encodePreview(shops) {
    const bytes = new TextEncoder().encode(JSON.stringify(shops));
    return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
      .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  }

  if (site.isLocal) {
    const token = new URLSearchParams(location.hash.slice(1)).get('preview');
    if (token) {
      try {
        const bytes = Uint8Array.from(atob(token.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0));
        const data = JSON.parse(new TextDecoder().decode(bytes));
        if (!Array.isArray(data)) throw new Error('店舗一覧の形式が正しくありません。');
        const result = site.validateShopEntries(data.map((shop) => ({ filename: `${shop?.id}.json`, shop })));
        if (result.errors.length) throw new Error('店舗データの項目が正しくありません。');
        site.shops = result.shops;
        site.previewToken = token;
      } catch {
        site.previewError = '確認中のデータを復元できませんでした。トップページで JSON を選び直してください。';
      }
    }
  }

  site.sortShops = () => site.shops.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  site.sortShops();

  site.setShopImage = (element, shop) => {
    element.alt = shop.image ? shop.imageAlt : `${shop.name}の共通店舗イラスト`;
    element.onerror = () => {
      element.onerror = null;
      element.src = './images/shop-placeholder.svg';
      element.alt = `${shop.name}の共通店舗イラスト`;
    };
    element.src = `./${shop.image || 'images/shop-placeholder.svg'}`;
  };

  site.linkTo = (href) => {
    if (!site.previewToken) return href;
    const url = new URL(href, location.href);
    const section = url.hash.slice(1);
    url.hash = new URLSearchParams({ preview: site.previewToken, section }).toString();
    return url.href;
  };

  site.updateLinks = () => {
    for (const link of document.querySelectorAll('a[href]')) {
      const href = link.dataset.originalHref || link.getAttribute('href');
      if (!href.startsWith('#') && !href.startsWith('./index.html') && !href.startsWith('./shop.html')) continue;
      link.dataset.originalHref = href;
      link.href = site.linkTo(href);
    }
  };

  site.useLocalShops = (shops) => {
    site.shops = shops;
    site.sortShops();
    site.previewToken = encodePreview(shops);
    const hash = new URLSearchParams({ preview: site.previewToken, section: 'shops' });
    history.replaceState(null, '', `#${hash}`);
    document.dispatchEvent(new Event('shops-updated'));
    site.updateLinks();
  };

  function scrollToSection() {
    if (!site.previewToken) return;
    const section = new URLSearchParams(location.hash.slice(1)).get('section');
    const element = section && document.getElementById(section);
    if (element) {
      element.scrollIntoView();
      if (section === 'main') {
        element.tabIndex = -1;
        element.focus({ preventScroll: true });
      }
    }
  }

  window.addEventListener('load', scrollToSection);
  window.addEventListener('hashchange', () => {
    const token = new URLSearchParams(location.hash.slice(1)).get('preview') || '';
    // 戻る・進む・初期表示へのリセットでも URL と表示を一致させます。
    if (site.isLocal && token !== site.previewToken) location.reload();
    else scrollToSection();
  });
})();
