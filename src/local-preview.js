// この確認欄は HTML の直接表示と localhost で表示します。公開サイトでは隠れます。
(() => {
  const site = globalThis.Hidamari;
  site.updateLinks();
  if (!site.isLocal) return;

  const panel = document.querySelector('#local-preview');
  panel.hidden = false;
  const status = document.querySelector('#preview-status');
  status.textContent = site.previewError || (site.previewToken
    ? `読み込んだ ${site.shops.length} 店舗を確認中です。編集後は JSON を選び直してください。`
    : `同梱の ${site.shopData.length} 店舗を表示中です。追加・編集した店舗の確認には、src/shops 内の JSON をすべて選んでください。`);

  const input = document.querySelector('#shop-files');
  if (!input) return;

  const errorsList = document.querySelector('#preview-errors');
  document.querySelector('#load-shop-files').addEventListener('click', () => input.click());
  document.querySelector('#reset-preview').addEventListener('click', () => {
    window.location.href = './index.html#shops';
  });

  input.addEventListener('change', async () => {
    const files = [...input.files];
    input.value = ''; // 同じファイルを編集してもう一度選べるようにします。
    if (!files.length) return;
    status.textContent = '店舗データを確認しています…';
    errorsList.replaceChildren();
    const errors = [];
    const entries = [];
    for (const file of files) {
      if (!file.name.endsWith('.json')) {
        errors.push(`${file.name}: src/shops 内の .json ファイルを選んでください。`);
        continue;
      }
      try {
        entries.push({ filename: file.name, shop: JSON.parse(await file.text()) });
      } catch {
        errors.push(`${file.name}: JSON を読み込めません。カンマ・引用符・括弧を確認してください。`);
      }
    }
    const result = site.validateShopEntries(entries);
    errors.push(...result.errors);

    if (!errors.length) {
      await Promise.all(result.shops.filter((shop) => shop.image).map((shop) => new Promise((resolve) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = () => {
          errors.push(`src/shops/${shop.id}.json.image: 「${shop.image}」が見つからないか画像として開けません。画像を追加するか image を "" にしてください。`);
          resolve();
        };
        image.src = `./${shop.image}`;
      })));
    }

    if (errors.length) {
      status.textContent = `${errors.length} 件のエラーがあります。表示中のお店は変更していません。`;
      for (const message of errors) {
        const item = document.createElement('li');
        item.textContent = message;
        errorsList.append(item);
      }
      return;
    }
    site.useLocalShops(result.shops);
    status.textContent = `検証OK：${result.shops.length} 店舗を読み込みました。編集後は JSON を選び直してください。`;
  });
})();
