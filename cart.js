(function () {
  const CART_KEY = "rocord_cart";

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }
  window.escapeHtml = window.escapeHtml || escapeHtml;

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function isInCart(id) {
    return getCart().some((m) => m.id === id);
  }

  function addToCart(model) {
    const cart = getCart();
    if (cart.some((m) => m.id === model.id)) {
      openCart();
      return;
    }
    cart.push({
      id: model.id,
      name: model.name,
      image: model.image,
      download_url: model.download_url,
      download_kind: model.download_kind,
      has_download: model.has_download,
      download_name: model.download_name,
      detail_url: model.detail_url,
    });
    saveCart(cart);
    document.querySelectorAll(`.cart-add-btn[data-model-id="${model.id}"]`).forEach((btn) => {
      btn.classList.add("in-cart");
    });
  }

  window.addToCartFromCard = function (btnElement, modelId) {
    const source = window.allModelsData || window.allModelsCache || [];
    const model = source.find((m) => m.id === modelId);
    if (!model) return;
    addToCart(model);
    btnElement.classList.add("in-cart");
  };

  function removeFromCart(id) {
    saveCart(getCart().filter((m) => m.id !== id));
    document.querySelectorAll(`.cart-add-btn[data-model-id="${id}"]`).forEach((btn) => {
      btn.classList.remove("in-cart");
    });
    renderCartModal();
  }

  function updateCartBadge() {
    const count = getCart().length;
    document.querySelectorAll(".cart-badge").forEach((el) => {
      el.textContent = String(count);
      el.style.display = count > 0 ? "inline-flex" : "none";
    });
  }

  function ensureCartModal() {
    let overlay = document.getElementById("cartModalOverlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "cartModalOverlay";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="cart-modal">
        <span class="modal-close" onclick="closeCart()">&times;</span>
        <h2 class="modal-title">장바구니</h2>
        <div class="cart-toolbar" id="cartToolbar" style="display:none;">
          <label class="cart-select-all">
            <input type="checkbox" id="cartSelectAll" onchange="window.__cartToggleAll(this.checked)">
            전체 선택
          </label>
          <button class="cart-zip-btn" id="cartZipBtn" onclick="window.__cartDownloadZip()" disabled>
            <i data-lucide="package" class="lucide-fill"></i>선택 압축 다운로드
          </button>
        </div>
        <div id="cartItemsList" class="cart-items-list"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeCart();
    });
    return overlay;
  }

  function updateZipButtonState() {
    const checked = document.querySelectorAll(".cart-item-check:checked");
    const zipBtn = document.getElementById("cartZipBtn");
    if (zipBtn) zipBtn.disabled = checked.length === 0;
    const all = document.querySelectorAll(".cart-item-check");
    const selectAll = document.getElementById("cartSelectAll");
    if (selectAll) selectAll.checked = all.length > 0 && checked.length === all.length;
  }

  window.__cartToggleAll = function (checked) {
    document.querySelectorAll(".cart-item-check").forEach((cb) => {
      cb.checked = checked;
    });
    updateZipButtonState();
  };

  window.__cartItemCheckChanged = updateZipButtonState;

  function renderCartModal() {
    const overlay = ensureCartModal();
    const list = document.getElementById("cartItemsList");
    const toolbar = document.getElementById("cartToolbar");
    const cart = getCart();

    if (cart.length === 0) {
      toolbar.style.display = "none";
      list.innerHTML = '<div class="cart-empty">장바구니가 비어 있습니다.<br>모델 카드의 <i data-lucide="shopping-cart" class="lucide-fill"></i> 버튼을 눌러 담아보세요.</div>';
    } else {
      toolbar.style.display = "flex";
      list.innerHTML = cart
        .map((m) => {
          const safeId = encodeURIComponent(m.id);
          const safeDetailUrl = m.detail_url ? encodeURI(m.detail_url) : "#";
          const available = Boolean(m.has_download || m.download_url);
          return `
        <div class="cart-item">
          <input type="checkbox" class="cart-item-check" data-id="${escapeHtml(m.id)}" ${available ? "" : "disabled"} onchange="window.__cartItemCheckChanged()">
          <img src="${escapeHtml(m.image || "/widget-icon.png")}" alt="${escapeHtml(m.name)}" class="cart-item-img">
          <div class="cart-item-info">
            <a href="${safeDetailUrl}" class="cart-item-name">${escapeHtml(m.name)}</a>
            ${!available ? '<span class="cart-item-nofile">다운로드 파일 없음</span>' : ""}
          </div>
          <div class="cart-item-actions">
            ${available ? `<button class="cart-item-download" title="다운로드" onclick="window.__cartDownloadSingle('${safeId}')"><i data-lucide="download" class="lucide-fill"></i></button>` : ""}
            <button class="cart-item-remove" onclick="removeFromCart('${safeId}')" title="삭제"><i data-lucide="x" class="lucide-fill"></i></button>
          </div>
        </div>
      `;
        })
        .join("");
      updateZipButtonState();
    }
    if (window.lucide) window.lucide.createIcons();
  }

  window.__cartDownloadSingle = async function (id) {
    const item = getCart().find((m) => m.id === id);
    if (!item) return;
    try {
      const token = window.currentUserToken || null;
      const url = await window.resolveDownloadUrl(item, token);
      if (!url) {
        alert("다운로드 파일이 없습니다.");
        return;
      }
      const a = document.createElement("a");
      a.href = url;
      if (item.download_name) a.download = item.download_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      if (err && err.message === "login_required") {
        alert("🔒 로그인이 필요한 서비스입니다.");
        if (window.openLoginModal) window.openLoginModal();
      } else {
        alert("다운로드 중 오류가 발생했습니다.");
      }
    }
  };

  window.__cartDownloadZip = async function () {
    const cart = getCart();
    const checkedIds = [...document.querySelectorAll(".cart-item-check:checked")].map((cb) => cb.dataset.id);
    const items = cart.filter((m) => checkedIds.includes(m.id) && (m.has_download || m.download_url));
    if (items.length === 0) return;

    const token = window.currentUserToken || null;
    const zipBtn = document.getElementById("cartZipBtn");
    const originalHtml = zipBtn.innerHTML;
    zipBtn.disabled = true;
    zipBtn.innerHTML = '<i data-lucide="loader" class="lucide-fill"></i>압축 중...';
    if (window.lucide) window.lucide.createIcons();

    const zip = new JSZip();
    const failed = [];
    const usedNames = new Set();

    for (const item of items) {
      try {
        const resolvedUrl = await window.resolveDownloadUrl(item, token);
        if (!resolvedUrl) throw new Error("no_url");
        const res = await fetch(resolvedUrl);
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        let filename = item.download_name || resolvedUrl.split("/").pop().split("?")[0] || `${item.name}.zip`;
        filename = decodeURIComponent(filename).replace(/[\\/:*?"<>|]/g, "_");
        let finalName = filename;
        let n = 1;
        while (usedNames.has(finalName)) {
          const dot = filename.lastIndexOf(".");
          finalName = dot > -1 ? `${filename.slice(0, dot)}(${n})${filename.slice(dot)}` : `${filename}(${n})`;
          n++;
        }
        usedNames.add(finalName);
        zip.file(finalName, blob);
      } catch (err) {
        failed.push(item.name);
      }
    }

    if (Object.keys(zip.files).length === 0) {
      alert("파일을 가져오지 못했습니다. 다운로드 링크를 직접 이용해주세요.");
      zipBtn.disabled = false;
      zipBtn.innerHTML = originalHtml;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rocord-models-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    if (failed.length > 0) {
      alert(`${failed.length}개 파일은 다운로드에 실패해서 제외됐습니다:\n${failed.join(", ")}`);
    }

    zipBtn.disabled = false;
    zipBtn.innerHTML = originalHtml;
    if (window.lucide) window.lucide.createIcons();
    updateZipButtonState();
  };

  window.openCart = function () {
    const overlay = ensureCartModal();
    renderCartModal();
    overlay.style.display = "flex";
    setTimeout(() => overlay.classList.add("show"), 10);
  };

  window.closeCart = function () {
    const overlay = document.getElementById("cartModalOverlay");
    if (!overlay) return;
    overlay.classList.remove("show");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 300);
  };

  window.removeFromCart = removeFromCart;
  window.isInCart = isInCart;

  const DL_WORKER_URL = "https://dl.corerepublix.co.kr/api/download";

  // Resolves a model to an actual downloadable URL. "repo"-kind files are
  // gated behind the auth worker (never handed out as a plain static URL);
  // "external" links (legacy site pages, oversized-file Discord CDN links)
  // were never protectable and go straight through.
  window.resolveDownloadUrl = async function (model, token) {
    if (!model) return null;
    if (model.download_kind === "external" || model.download_url) {
      return model.download_url || null;
    }
    if (!model.has_download) return null;
    if (!token) throw new Error("login_required");
    const res = await fetch(`${DL_WORKER_URL}?id=${encodeURIComponent(model.id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) throw new Error("login_required");
    if (!res.ok) throw new Error("download_failed");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  };

  updateCartBadge();
})();
