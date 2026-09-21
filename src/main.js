(() => {
  const { categories, news, setShopImage } = globalThis.Hidamari;

  const searchInput = document.querySelector("#shop-search");
  const filters = document.querySelector("#category-filters");
  const shopList = document.querySelector("#shop-list");
  const template = document.querySelector("#shop-card-template");
  let selectedCategory = "all";

  // 全角・半角や英字の大文字・小文字を同じように検索します。
  function normalize(text) {
    return text.normalize("NFKC").toLocaleLowerCase("ja").trim();
  }

  function renderShops() {
    const shops = globalThis.Hidamari.shops;
    const words = normalize(searchInput.value).split(/\s+/).filter(Boolean);
    const visibleShops = shops.filter((shop) => {
      const matchesCategory =
        selectedCategory === "all" || shop.category === selectedCategory;
      const searchableText = normalize(
        `${shop.name} ${shop.tagline} ${shop.description}`,
      );
      return (
        matchesCategory && words.every((word) => searchableText.includes(word))
      );
    });

    shopList.replaceChildren();
    for (const shop of visibleShops) {
      const card = template.content.cloneNode(true);
      card.querySelector("a").href =
        globalThis.Hidamari.linkTo(`./shop.html?id=${encodeURIComponent(shop.id)}`);
      setShopImage(card.querySelector("img"), shop);
      card.querySelector(".category-label").textContent =
        categories.find((item) => item.id === shop.category)?.label ||
        shop.category;
      card.querySelector(".card-address").textContent = shop.address.replace(
        "ひだまり商店街 ",
        "",
      );
      card.querySelector("h3").textContent = shop.name;
      card.querySelector(".card-tagline").textContent = shop.tagline;
      card.querySelector(".card-description").textContent = shop.description;
      shopList.append(card);
    }

    document.querySelector("#result-count").textContent =
      `${shops.length}店舗中 ${visibleShops.length}店舗`;
    document.querySelector("#no-results").hidden = visibleShops.length > 0;
    for (const button of filters.querySelectorAll("button")) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.category === selectedCategory),
      );
    }
  }

  for (const category of [{ id: "all", label: "すべてのお店" }, ...categories]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.dataset.category = category.id;
    button.textContent = category.label;
    button.addEventListener("click", () => {
      selectedCategory = category.id;
      renderShops();
    });
    filters.append(button);
  }

  searchInput.addEventListener("input", renderShops);
  document
    .querySelector("#search-form")
    .addEventListener("submit", (event) => event.preventDefault());
  document.querySelector("#reset-search").addEventListener("click", () => {
    searchInput.value = "";
    selectedCategory = "all";
    renderShops();
    searchInput.focus();
  });

  // details/summary を使うと、マウスでもキーボードでもお知らせを開けます。
  const newsList = document.querySelector("#news-list");
  for (const item of [...news].sort((a, b) => b.date.localeCompare(a.date))) {
    const detail = document.createElement("details");
    detail.className = "news-item";
    const summary = document.createElement("summary");
    const metadata = document.createElement("span");
    metadata.className = "news-meta";
    const date = document.createElement("time");
    date.dateTime = item.date;
    date.textContent = item.date.replaceAll("-", ".");
    const category = document.createElement("span");
    category.className = "news-category";
    category.textContent = item.category;
    metadata.append(date, category);
    const title = document.createElement("span");
    title.className = "news-title";
    title.textContent = item.title;
    const body = document.createElement("p");
    body.textContent = item.body;
    summary.append(metadata, title);
    detail.append(summary, body);
    newsList.append(detail);
  }

  renderShops();

  document.addEventListener("shops-updated", renderShops);
})();
