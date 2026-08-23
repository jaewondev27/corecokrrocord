(function () {
  const MODELS_JSON_URL = "https://rocordstorage.corerepublix.co.kr/models.json";
  const PAGE_SIZE = 20;
  const CATEGORY = window.MODEL_CATEGORY || null; // null = show all categories

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }
  window.escapeHtml = window.escapeHtml || escapeHtml;

  let allModelsData = [];
  let filteredModelsData = [];
  let currentPage = 1;

  window.allModelsData = allModelsData;

  function fetchModels() {
    fetch(MODELS_JSON_URL)
      .then((res) => res.json())
      .then((data) => {
        allModelsData = CATEGORY ? data.filter((m) => m.category === CATEGORY) : data;
        window.allModelsData = allModelsData;
        applyFilters();
      })
      .catch((err) => {
        console.error(err);
        const grid = document.getElementById("modelGrid");
        if (grid) grid.innerHTML = '<div style="text-align:center;width:100%">데이터를 불러오는데 실패했습니다.</div>';
      });
  }

  function applyFilters() {
    const searchInput = document.getElementById("search");
    const sortSelect = document.getElementById("sortOrder");
    const query = (searchInput?.value || "").toLowerCase();
    const sortOrder = sortSelect?.value || "newest";

    let filtered = allModelsData.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        (model.desc || "").toLowerCase().includes(query)
    );

    // allModelsData already comes newest-first from the sync bot.
    if (sortOrder === "oldest") {
      filtered = filtered.slice().reverse();
    }

    filteredModelsData = filtered;
    currentPage = 1;
    renderPage();
  }

  function renderPage() {
    const totalPages = Math.max(1, Math.ceil(filteredModelsData.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredModelsData.slice(start, start + PAGE_SIZE);
    renderModels(pageItems);
    renderPagination(totalPages);
  }

  function renderModels(models) {
    const grid = document.getElementById("modelGrid");
    if (!grid) return;
    grid.innerHTML = "";

    if (models.length === 0) {
      grid.innerHTML = '<div style="text-align:center; width:100%; grid-column: 1 / -1;">모델이 없습니다.</div>';
      return;
    }

    models.forEach((model) => {
      const card = document.createElement("div");
      card.className = "model-card";

      const safeId = encodeURIComponent(model.id);
      const safeDetailUrl = model.detail_url ? encodeURI(model.detail_url) : "";

      let detailBtnHtml = "";
      if (safeDetailUrl && safeDetailUrl.trim() !== "") {
        detailBtnHtml = `<button class="btn-detail" onclick="window.location.href='${safeDetailUrl}'">
          <i data-lucide="file-text" class="lucide-fill"></i> 상세페이지
        </button>`;
      } else {
        detailBtnHtml = `<button class="btn-detail" disabled><i data-lucide="file-text" class="lucide-fill"></i> 세부페이지가 없습니다</button>`;
      }

      const inCart = window.isInCart && window.isInCart(model.id);

      card.innerHTML = `
        <div class="model-img-wrap">
          <img src="${escapeHtml(model.image || "/widget-icon.png")}" alt="${escapeHtml(model.name)}" class="model-img">
          <button class="cart-add-btn${inCart ? " in-cart" : ""}" data-model-id="${escapeHtml(model.id)}" onclick="addToCartFromCard(this, '${safeId}')" title="장바구니에 담기">
            <i data-lucide="shopping-cart" class="lucide-fill"></i>
          </button>
        </div>
        <div class="model-info">
          <h3>${escapeHtml(model.name)}</h3>
          <p>${escapeHtml(model.desc || "")}</p>
        </div>
        ${detailBtnHtml}
        <button class="btn-download" onclick="downloadModel(this, '${safeId}')">
          <i data-lucide="download" class="lucide-fill"></i> 다운로드
        </button>
      `;
      grid.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function renderPagination(totalPages) {
    let container = document.getElementById("modelPagination");
    if (!container) {
      container = document.createElement("div");
      container.id = "modelPagination";
      container.className = "model-pagination";
      const grid = document.getElementById("modelGrid");
      grid?.insertAdjacentElement("afterend", container);
    }

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    const btn = (label, page, opts = {}) => {
      const disabled = opts.disabled ? "disabled" : "";
      const active = opts.active ? "active" : "";
      return `<button class="page-btn ${active}" ${disabled} onclick="window.__modelListGoToPage(${page})">${label}</button>`;
    };

    let html = "";
    html += btn('<i data-lucide="chevron-left" class="lucide-fill"></i>', currentPage - 1, { disabled: currentPage === 1 });

    const windowSize = 5;
    let startPage = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let endPage = Math.min(totalPages, startPage + windowSize - 1);
    startPage = Math.max(1, endPage - windowSize + 1);

    for (let p = startPage; p <= endPage; p++) {
      html += btn(String(p), p, { active: p === currentPage });
    }

    html += btn('<i data-lucide="chevron-right" class="lucide-fill"></i>', currentPage + 1, { disabled: currentPage === totalPages });

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  window.__modelListGoToPage = function (page) {
    currentPage = page;
    renderPage();
    document.getElementById("modelGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  window.fetchModels = fetchModels;
  window.applyFilters = applyFilters;
})();
