(function () {
  const CART_KEY = "rocord_cart";

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
        <div id="cartItemsList" class="cart-items-list"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeCart();
    });
    return overlay;
  }

  function renderCartModal() {
    const overlay = ensureCartModal();
    const list = document.getElementById("cartItemsList");
    const cart = getCart();
    if (cart.length === 0) {
      list.innerHTML = '<div class="cart-empty">장바구니가 비어 있습니다.<br>모델 카드의 <i data-lucide="bookmark" class="lucide-fill"></i> 버튼을 눌러 담아보세요.</div>';
    } else {
      list.innerHTML = cart
        .map(
          (m) => `
        <div class="cart-item">
          <img src="${m.image || "/widget-icon.png"}" alt="${m.name}" class="cart-item-img">
          <div class="cart-item-info">
            <a href="${m.detail_url}" class="cart-item-name">${m.name}</a>
          </div>
          <div class="cart-item-actions">
            ${m.download_url ? `<a href="${m.download_url}" class="cart-item-download" title="다운로드"><i data-lucide="download" class="lucide-fill"></i></a>` : ""}
            <button class="cart-item-remove" onclick="removeFromCart('${m.id}')" title="삭제"><i data-lucide="x" class="lucide-fill"></i></button>
          </div>
        </div>
      `
        )
        .join("");
    }
    if (window.lucide) window.lucide.createIcons();
  }

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

  updateCartBadge();
})();
