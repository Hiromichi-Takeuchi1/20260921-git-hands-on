(() => {
  const { shops, setShopImage, categories } = globalThis.Hidamari;

  const id = new URLSearchParams(window.location.search).get("id");
  const shop = shops.find((item) => item.id === id);

  if (!shop) {
    document.querySelector("#not-found").hidden = false;
    document.querySelector("#breadcrumb-name").textContent =
      "お店が見つかりません";
    document.title = "お店が見つかりません｜ひだまり商店街";
  } else {
    document.querySelector("#shop-detail").hidden = false;
    document.title = `${shop.name}｜ひだまり商店街`;
    document.querySelector('meta[name="description"]').content = shop.description;
    document.querySelector("#breadcrumb-name").textContent = shop.name;
    document.querySelector("#detail-category").textContent =
      categories.find((item) => item.id === shop.category)?.label ||
      shop.category;
    for (const field of [
      "name",
      "tagline",
      "description",
      "hours",
      "closed",
      "address",
    ]) {
      document.querySelector(`#detail-${field}`).textContent = shop[field];
    }
    document.querySelector("#detail-location").textContent = shop.address;
    setShopImage(document.querySelector("#detail-image"), shop);

    const prices = new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    });
    for (const product of shop.products) {
      const item = document.createElement("li");
      const heading = document.createElement("div");
      heading.className = "product-heading";
      const name = document.createElement("h3");
      name.textContent = product.name;
      const price = document.createElement("span");
      price.className = "product-price";
      price.textContent = prices.format(product.price);
      const description = document.createElement("p");
      description.textContent = product.description;
      heading.append(name, price);
      item.append(heading, description);
      document.querySelector("#products-list").append(item);
    }
  }

})();
