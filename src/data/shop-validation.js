(() => {
const { categories } = globalThis.Hidamari;

// ファイル名と id は、小文字の英数字をハイフンでつないだ名前にします。
const shopIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const requiredTextFields = [
  'id', 'name', 'category', 'tagline', 'description', 'hours', 'closed', 'address',
];

// Node.js とブラウザーのどちらでも使える、データの形だけの検証です。
// 画像ファイルの存在確認と店舗間の id 重複確認は検証スクリプトで行います。
function validateShop(shop, { filename } = {}) {
  const errors = [];
  const addError = (field, message) => errors.push({ field, message });

  if (!shop || typeof shop !== 'object' || Array.isArray(shop)) {
    addError('$', '店舗データを JSON オブジェクト { ... } にしてください。');
    return errors;
  }

  for (const field of requiredTextFields) {
    if (typeof shop[field] !== 'string' || shop[field].trim() === '') {
      addError(field, '空でない文字列を入力してください。');
    }
  }

  if (typeof shop.id === 'string' && shop.id.trim() !== '') {
    if (!shopIdPattern.test(shop.id)) {
      addError('id', '小文字の英数字とハイフンを使ってください（例: sora-coffee）。');
    }
    if (filename && filename !== `${shop.id}.json`) {
      addError('id', `ファイル名「${filename}」と一致させてください。id が「${shop.id}」なら「${shop.id}.json」にします。`);
    }
  }

  if (typeof shop.category === 'string' && shop.category.trim() !== '' &&
      !categories.some((category) => category.id === shop.category)) {
    addError('category', `次のいずれかを指定してください: ${categories.map((category) => category.id).join(', ')}。`);
  }

  if (!Array.isArray(shop.products) || shop.products.length === 0) {
    addError('products', 'おすすめ商品・サービスを1件以上、配列 [ ... ] に入力してください。');
  } else {
    shop.products.forEach((product, index) => {
      const prefix = `products[${index}]`;
      if (!product || typeof product !== 'object' || Array.isArray(product)) {
        addError(prefix, '商品をオブジェクト { "name": ..., "description": ..., "price": ... } にしてください。');
        return;
      }
      for (const field of ['name', 'description']) {
        if (typeof product[field] !== 'string' || product[field].trim() === '') {
          addError(`${prefix}.${field}`, '空でない文字列を入力してください。');
        }
      }
      if (!Number.isSafeInteger(product.price) || product.price < 0) {
        addError(`${prefix}.price`, '0以上の整数を、円記号やカンマや引用符なしで入力してください（例: 500）。');
      }
    });
  }

  if (shop.image !== undefined && typeof shop.image !== 'string') {
    addError('image', '画像を使わない場合は ""、使う場合は "images/shops/店舗ID.svg" のような文字列にしてください。');
  } else if (shop.image) {
    const imageParts = shop.image.split('/');
    const hasSafeParts = imageParts.every((part) => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(part));
    const isLocalImage = shop.image.startsWith('images/') && hasSafeParts &&
      /\.(svg|png|jpe?g|webp|avif|gif)$/i.test(shop.image);
    if (!isLocalImage) {
      addError('image', 'images/ 内の画像を「images/shops/店舗ID.svg」の形式で指定してください。外部 URL、先頭の /、..、空白は使えません。');
    }
    if (typeof shop.imageAlt !== 'string' || shop.imageAlt.trim() === '') {
      addError('imageAlt', '画像の内容を伝える短い説明を入力してください。');
    }
  }

  return errors;
}

// ブラウザで選んだ JSON と、CI が読んだ JSON に同じルールを適用します。
function validateShopEntries(entries) {
  const errors = [];
  const seenIds = new Map();
  if (!Array.isArray(entries) || entries.length === 0) {
    return { errors: ['src/shops: 店舗の JSON ファイルを1件以上選んでください。'], shops: [] };
  }
  for (const { filename, shop } of entries) {
    const path = `src/shops/${filename}`;
    for (const error of validateShop(shop, { filename })) {
      errors.push(`${path}.${error.field}: ${error.message}`);
    }
    if (shop && typeof shop.id === 'string') {
      if (seenIds.has(shop.id)) {
        errors.push(`${path}.id: 「${shop.id}」が ${seenIds.get(shop.id)} と重複しています。id とファイル名を一意にしてください。`);
      } else {
        seenIds.set(shop.id, path);
      }
    }
  }
  return { errors, shops: errors.length ? [] : entries.map((entry) => entry.shop) };
}

globalThis.Hidamari.validateShop = validateShop;
globalThis.Hidamari.shopIdPattern = shopIdPattern;
globalThis.Hidamari.validateShopEntries = validateShopEntries;
})();
