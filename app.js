// app.js

// =========================================================================
//  ESTADO DE LA APLICACIÓN
// =========================================================================
let cart = JSON.parse(localStorage.getItem('building_cart')) || [];
let activeFilter = 'Todos';
let searchQuery = '';
let carouselIndex = 0;
let activeCatalog = [...PRODUCTS_CATALOG];
let filteredProducts = [...activeCatalog];
let itemsPerView = 1;
let autoplayTimer = null;

// =========================================================================
//  ELEMENTOS DEL DOM
// =========================================================================
const track = document.getElementById('carousel-track');
const prevBtn = document.getElementById('carousel-prev');
const nextBtn = document.getElementById('carousel-next');
const dotsContainer = document.getElementById('carousel-dots');
const searchInput = document.getElementById('search-input');
const filtersContainer = document.getElementById('filters-container');
const cartBadge = document.getElementById('cart-badge');
const cartDrawer = document.getElementById('cart-drawer');
const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalAmount = document.getElementById('cart-total-amount');
const cartDrawerFooter = document.getElementById('cart-drawer-footer');
const checkoutForm = document.getElementById('checkout-form');
const viewport = document.getElementById('carousel-viewport');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// =========================================================================
//  INICIALIZACIÓN
// =========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setupEventListeners();
  updateCartBadge();
  
  if (STORE_CONFIG.sheetApiUrl && STORE_CONFIG.sheetApiUrl.trim() !== '') {
    renderLoadingSkeletons();
    await loadCatalogFromSheet();
  } else {
    initCatalog();
  }
});

// =========================================================================
//  TEMA CLARO / OSCURO
// =========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('vecino_theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  if (isDark) {
    html.removeAttribute('data-theme');
    localStorage.setItem('vecino_theme', 'light');
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('vecino_theme', 'dark');
  }
  // Re-render Lucide icons for the toggled state
  lucide.createIcons();
}

function initCatalog() {
  validateCart();
  renderFilters();
  updateFilteredProducts();
  startAutoplay();
  lucide.createIcons();
}

function validateCart() {
  const originalLength = cart.length;
  cart = cart.filter(item => activeCatalog.some(p => p.id === item.productId));
  if (cart.length !== originalLength) {
    saveCart();
  }
  updateCartBadge();
}

function renderLoadingSkeletons() {
  track.innerHTML = '';
  // Crear 3 tarjetas de esqueleto de carga
  for (let i = 0; i < 3; i++) {
    const card = document.createElement('div');
    card.classList.add('product-card');
    card.style.pointerEvents = 'none';
    card.innerHTML = `
      <div class="card-image-wrapper skeleton" style="height: 220px; border-radius: 12px 12px 0 0; position: relative;"></div>
      <div class="skeleton" style="height: 14px; width: 40%; margin: 1rem 0 0.5rem 1rem; border-radius: 4px;"></div>
      <div class="skeleton" style="height: 20px; width: 80%; margin: 0 0 0.5rem 1rem; border-radius: 4px;"></div>
      <div class="skeleton" style="height: 40px; width: 90%; margin: 0 0 1rem 1rem; border-radius: 4px;"></div>
      <div class="skeleton" style="height: 42px; width: calc(100% - 2rem); margin: 0 1rem 1rem 1rem; border-radius: 8px;"></div>
    `;
    track.appendChild(card);
  }
}

async function loadCatalogFromSheet() {
  try {
    const fetchPromise = fetch(STORE_CONFIG.sheetApiUrl);
    // Transición suave de 800ms
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 800));
    
    const [response] = await Promise.all([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      activeCatalog = data;
      console.log('Catálogo cargado con éxito desde Google Sheets:', data);
    } else {
      throw new Error('Datos del catálogo vacíos o inválidos');
    }
  } catch (error) {
    console.warn('Error cargando Google Sheets, usando catálogo local:', error);
    showToast('Usando catálogo local (planilla no disponible)', 'info');
    activeCatalog = [...PRODUCTS_CATALOG];
  } finally {
    initCatalog();
  }
}

// =========================================================================
//  EVENT LISTENERS
// =========================================================================
function setupEventListeners() {
  // Buscador
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    updateFilteredProducts();
  });

  // Navegación del carrusel
  prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoplay();
  });
  
  nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoplay();
  });

  // Redimensionado de pantalla con debounce
  window.addEventListener('resize', debounce(() => {
    updateItemsPerView();
    moveCarousel(false); // Ajustar sin animación brusca durante el redimensionamiento
  }, 150));

  // Eventos del Carrito (Abrir / Cerrar)
  cartToggleBtn.addEventListener('click', () => toggleCartDrawer(true));
  closeDrawerBtn.addEventListener('click', () => toggleCartDrawer(false));
  cartDrawerOverlay.addEventListener('click', () => toggleCartDrawer(false));

  // Formulario de Pago
  checkoutForm.addEventListener('submit', handleCheckout);

  // Toggle de Tema
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Soporte de Gestos Táctiles (Swipe) en el Carrusel
  let touchStartX = 0;
  let touchEndX = 0;

  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    startAutoplay();
  }, { passive: true });

  // Pausar autoplay al pasar el mouse
  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', startAutoplay);
  
  // Soporte de Arrastre con Mouse para Escritorio
  let mouseStartX = 0;
  let isDragging = false;

  viewport.addEventListener('mousedown', (e) => {
    mouseStartX = e.screenX;
    isDragging = true;
    stopAutoplay();
  });

  viewport.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    const mouseEndX = e.screenX;
    const diffX = mouseStartX - mouseEndX;
    if (diffX > 50) {
      nextSlide();
    } else if (diffX < -50) {
      prevSlide();
    }
    isDragging = false;
    startAutoplay();
  });

  viewport.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  // Botones del Modal de Confirmación
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  
  if (modalConfirmBtn && modalCancelBtn) {
    modalConfirmBtn.addEventListener('click', () => {
      // Vaciar carrito
      cart = [];
      saveCart();
      updateCartBadge();
      toggleCartDrawer(false);
      checkoutForm.reset();
      
      // Cerrar modal
      document.getElementById('checkout-modal').classList.remove('open');
      showToast('Carrito vaciado con éxito', 'success');
    });

    modalCancelBtn.addEventListener('click', () => {
      // Solo cerrar modal
      document.getElementById('checkout-modal').classList.remove('open');
      showToast('Conservaste los productos en tu carrito', 'info');
    });
  }
}

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;
  if (diff > swipeThreshold) {
    nextSlide(); // Deslizar hacia la izquierda -> Siguiente producto
  } else if (diff < -swipeThreshold) {
    prevSlide(); // Deslizar hacia la derecha -> Producto anterior
  }
}

// =========================================================================
//  LÓGICA DEL FILTRADO & BUSCADOR
// =========================================================================
function renderFilters() {
  // Obtener marcas únicas del catálogo
  const brands = ['Todos', ...new Set(activeCatalog.map(p => p.brand))];
  
  filtersContainer.innerHTML = '';
  
  brands.forEach(brand => {
    const chip = document.createElement('button');
    chip.classList.add('filter-chip');
    if (brand === activeFilter) chip.classList.add('active');
    chip.textContent = brand;
    
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = brand;
      updateFilteredProducts();
    });
    
    filtersContainer.appendChild(chip);
  });
}

function updateFilteredProducts() {
  // Aplicar filtros de marca y búsqueda por texto
  filteredProducts = activeCatalog.filter(product => {
    const matchesBrand = activeFilter === 'Todos' || product.brand === activeFilter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBrand && matchesSearch;
  });
  
  carouselIndex = 0; // Reiniciar index al filtrar
  updateItemsPerView();
  renderProducts();
  moveCarousel(false);
}

// =========================================================================
//  LÓGICA DEL CARRUSEL
// =========================================================================
function updateItemsPerView() {
  const width = window.innerWidth;
  if (width >= 900) {
    itemsPerView = 3;
  } else if (width >= 600) {
    itemsPerView = 2;
  } else {
    itemsPerView = 1;
  }
}

function renderProducts() {
  track.innerHTML = '';
  
  if (filteredProducts.length === 0) {
    track.innerHTML = `
      <div class="empty-products-msg" style="width: 100%; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <i data-lucide="package-search" style="width: 48px; height: 48px; margin: 0 auto 1rem auto; stroke-width: 1.5;"></i>
        <p>No se encontraron productos coincidentes.</p>
      </div>
    `;
    dotsContainer.innerHTML = '';
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    lucide.createIcons();
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement('div');
    card.classList.add('product-card');
    
    // Controles de stock y estado del botón
    const stockClass = product.inStock ? 'in-stock' : 'out-of-stock';
    const stockText = product.inStock ? 'Disponible' : 'Sin stock';
    const stockIcon = product.inStock ? 'check' : 'minus';
    const btnDisabled = product.inStock ? '' : 'disabled';
    const btnText = product.inStock ? 'Agregar al pedido' : 'Agotado';

    // Descuento badge
    let discountBadgeHtml = '';
    if (product.officialPrice && product.officialPrice > product.price) {
      const discountPct = Math.round((1 - product.price / product.officialPrice) * 100);
      discountBadgeHtml = `<span class="discount-badge">-${discountPct}%</span>`;
    }

    card.innerHTML = `
      <div class="card-image-wrapper skeleton">
        <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" onload="this.parentElement.classList.remove('skeleton')">
        <div class="badge-container">
          <span class="stock-badge ${stockClass}">
            <i data-lucide="${stockIcon}" style="width: 12px; height: 12px; stroke-width: 3;"></i>
            ${stockText}
          </span>
          <span class="weight-badge">${product.weight}</span>
        </div>
        ${discountBadgeHtml}
      </div>
      <span class="card-brand">${product.brand}</span>
      <h3 class="card-title">${product.name}</h3>
      <p class="card-description">${product.description || ''}</p>
      <div class="card-price-container">
        <div class="price-row">
          <span class="official-price-label">Precio Coto:</span>
          <span class="price-official">${STORE_CONFIG.currencySymbol}${product.officialPrice.toLocaleString('es-AR')}</span>
        </div>
        <span class="price-discount">${STORE_CONFIG.currencySymbol}${product.price.toLocaleString('es-AR')}</span>
      </div>
      <button class="add-to-cart-btn" ${btnDisabled} onclick="addToCart('${product.id}')">
        <i data-lucide="plus" style="width: 16px; height: 16px; stroke-width: 3;"></i>
        ${btnText}
      </button>
    `;
    
    track.appendChild(card);
  });

  renderDots();
  updateCarouselControls();
  lucide.createIcons();
}

function renderDots() {
  dotsContainer.innerHTML = '';
  const maxIndex = Math.max(0, filteredProducts.length - itemsPerView + 1);
  
  if (maxIndex <= 1) return; // No tiene sentido mostrar dots si todo entra en pantalla

  for (let i = 0; i < maxIndex; i++) {
    const dot = document.createElement('span');
    dot.classList.add('carousel-dot');
    if (i === carouselIndex) dot.classList.add('active');
    
    dot.addEventListener('click', () => {
      carouselIndex = i;
      moveCarousel();
      resetAutoplay();
    });
    
    dotsContainer.appendChild(dot);
  }
}

function updateCarouselControls() {
  const maxIndex = Math.max(0, filteredProducts.length - itemsPerView);
  
  if (maxIndex <= 0) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    return;
  } else {
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
  }

  // Deshabilitar flechas en extremos
  prevBtn.disabled = carouselIndex === 0;
  nextBtn.disabled = carouselIndex >= maxIndex;
  
  // Cambiar opacidad de flechas deshabilitadas
  prevBtn.style.opacity = carouselIndex === 0 ? '0.3' : '1';
  nextBtn.style.opacity = carouselIndex >= maxIndex ? '0.3' : '1';
}

function moveCarousel(animate = true) {
  if (filteredProducts.length === 0) return;
  
  const maxIndex = Math.max(0, filteredProducts.length - itemsPerView);
  if (carouselIndex > maxIndex) {
    carouselIndex = maxIndex;
  }

  const cards = track.children;
  if (cards.length === 0 || cards[0].classList.contains('empty-products-msg')) return;

  const cardWidth = cards[0].getBoundingClientRect().width;
  const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
  const offset = carouselIndex * (cardWidth + gap);

  track.style.transition = animate ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
  track.style.transform = `translateX(-${offset}px)`;

  // Actualizar dots activos
  document.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx === carouselIndex);
  });

  updateCarouselControls();
}

function nextSlide() {
  const maxIndex = Math.max(0, filteredProducts.length - itemsPerView);
  if (carouselIndex < maxIndex) {
    carouselIndex++;
    moveCarousel();
  } else {
    // Volver al principio si llega al final en reproducción automática
    carouselIndex = 0;
    moveCarousel();
  }
}

function prevSlide() {
  if (carouselIndex > 0) {
    carouselIndex--;
    moveCarousel();
  }
}

// Autoplay
function startAutoplay() {
  if (autoplayTimer) return;
  startProgressBar();
  autoplayTimer = setInterval(() => {
    nextSlide();
    startProgressBar();
  }, 5000);
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  resetProgressBar();
}

function resetAutoplay() {
  stopAutoplay();
  startAutoplay();
}

// =========================================================================
//  LÓGICA DEL CARRITO DE COMPRAS
// =========================================================================
function toggleCartDrawer(open) {
  if (open) {
    cartDrawer.classList.add('open');
    cartDrawerOverlay.classList.add('open');
    renderCart();
  } else {
    cartDrawer.classList.remove('open');
    cartDrawerOverlay.classList.remove('open');
  }
}

window.addToCart = function(productId) {
  const product = activeCatalog.find(p => p.id === productId);
  if (!product || !product.inStock) return;

  const existingItem = cart.find(item => item.productId === productId);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      productId: productId,
      quantity: 1
    });
  }

  saveCart();
  updateCartBadge();
  
  // Efecto visual en el botón del carrito
  cartToggleBtn.classList.add('bounce');
  setTimeout(() => cartToggleBtn.classList.remove('bounce'), 300);

  // Mostrar notificación Toast en lugar de abrir el carrito automáticamente
  showToast(`${product.name} agregado al pedido`, 'success');
};

function saveCart() {
  localStorage.setItem('building_cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.textContent = totalCount;
  
  if (totalCount > 0) {
    cartBadge.style.display = 'flex';
  } else {
    cartBadge.style.display = 'none';
  }
}

window.updateQuantity = function(productId, change) {
  const item = cart.find(item => item.productId === productId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(item => item.productId !== productId);
  }

  saveCart();
  updateCartBadge();
  renderCart();
}

window.removeFromCart = function(productId) {
  cart = cart.filter(item => item.productId !== productId);
  saveCart();
  updateCartBadge();
  renderCart();
}

function renderCart() {
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart-msg">
        <i data-lucide="package-open" class="empty-cart-icon"></i>
        <p>Tu carrito está vacío.</p>
      </div>
    `;
    cartDrawerFooter.style.display = 'none';
    lucide.createIcons();
    return;
  }

  cartDrawerFooter.style.display = 'flex';
  let total = 0;
  let officialTotal = 0;

  cart.forEach(item => {
    const product = activeCatalog.find(p => p.id === item.productId);
    if (!product) return;

    const subtotal = product.price * item.quantity;
    total += subtotal;
    officialTotal += product.officialPrice * item.quantity;

    const cartItem = document.createElement('div');
    cartItem.classList.add('cart-item');
    
    cartItem.innerHTML = `
      <div class="cart-item-img-wrapper skeleton" style="width: 60px; height: 60px; border-radius: 8px; overflow: hidden; flex-shrink: 0; position: relative; border: 1px solid var(--border-color);">
        <img src="${product.image}" alt="${product.name}" class="cart-item-img" style="width: 100%; height: 100%; object-fit: cover; border: none;" onload="this.parentElement.classList.remove('skeleton')">
      </div>
      <div class="cart-item-details">
        <span class="cart-item-brand">${product.brand}</span>
        <h4 class="cart-item-name">${product.name}</h4>
        <div class="cart-item-prices">
          <span class="cart-item-price-official">${STORE_CONFIG.currencySymbol}${product.officialPrice.toLocaleString('es-AR')}</span>
          <span class="cart-item-price-discount">${STORE_CONFIG.currencySymbol}${product.price.toLocaleString('es-AR')}</span>
        </div>
        <div class="cart-item-qty-controls">
          <button class="qty-btn minus" onclick="updateQuantity('${product.id}', -1)" aria-label="Disminuir cantidad">
            <i data-lucide="minus" style="width: 12px; height: 12px; stroke-width: 3;"></i>
          </button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn plus" onclick="updateQuantity('${product.id}', 1)" aria-label="Aumentar cantidad">
            <i data-lucide="plus" style="width: 12px; height: 12px; stroke-width: 3;"></i>
          </button>
        </div>
      </div>
      <button class="remove-item-btn" onclick="removeFromCart('${product.id}')" aria-label="Eliminar producto">
        <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
      </button>
    `;
    
    cartItemsContainer.appendChild(cartItem);
  });

  cartTotalAmount.textContent = `${STORE_CONFIG.currencySymbol}${total.toLocaleString('es-AR')}`;

  // Mostrar ahorro total vs Coto
  const savings = officialTotal - total;
  const savingsRow = document.getElementById('cart-savings-row');
  const savingsAmount = document.getElementById('cart-savings-amount');
  
  if (savings > 0 && savingsRow && savingsAmount) {
    savingsAmount.textContent = `${STORE_CONFIG.currencySymbol}${savings.toLocaleString('es-AR')}`;
    savingsRow.style.display = 'flex';
  } else if (savingsRow) {
    savingsRow.style.display = 'none';
  }

  lucide.createIcons();
}

// Agregar estilo CSS para animación de rebote del botón
const style = document.createElement('style');
style.textContent = `
  .cart-toggle-btn.bounce {
    animation: buttonBounce 0.3s ease-out;
  }
  @keyframes buttonBounce {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

// =========================================================================
//  ENVÍO DEL PEDIDO A WHATSAPP
// =========================================================================
function handleCheckout(e) {
  e.preventDefault();
  
  if (cart.length === 0) return;

  const name = document.getElementById('checkout-name').value.trim();
  const location = document.getElementById('checkout-location').value.trim();
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  const notes = document.getElementById('checkout-notes').value.trim();

  if (!name || !location) {
    showToast('Completá tu nombre y piso/depto para enviar', 'error');
    return;
  }

  // Generar cuerpo del mensaje
  let message = `Hola! Te hago un pedido desde la web del vecino:\n\n`;
  message += `--- DETALLE DEL PEDIDO ---\n`;

  let total = 0;
  cart.forEach(item => {
    const product = activeCatalog.find(p => p.id === item.productId);
    if (!product) return;

    const subtotal = product.price * item.quantity;
    total += subtotal;

    const priceFormatted = `${STORE_CONFIG.currencySymbol}${product.price.toLocaleString('es-AR')}`;
    const subtotalFormatted = `${STORE_CONFIG.currencySymbol}${subtotal.toLocaleString('es-AR')}`;
    
    message += `[x${item.quantity}] ${product.name} ${product.weight} - ${priceFormatted} c/u - Subtotal: ${subtotalFormatted}\n`;
  });

  message += `\nTOTAL: ${STORE_CONFIG.currencySymbol}${total.toLocaleString('es-AR')}\n`;
  message += `Metodo de pago: ${paymentMethod}\n\n`;
  
  message += `--- DATOS DE ENTREGA ---\n`;
  message += `Nombre: ${name}\n`;
  message += `Piso / Dpto: ${location}\n`;
  
  if (notes) {
    message += `Nota: ${notes}\n`;
  }
  
  message += `\n(Pedido enviado desde la web del vecino amigo)`;

  // Codificar URL para WhatsApp
  const whatsappUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;

  // Abrir enlace en pestaña nueva sin vaciar el carrito aún
  window.open(whatsappUrl, '_blank');

  // Mostrar modal de confirmación
  showCheckoutConfirmation();
}

// =========================================================================
//  FUNCIONES AUXILIARES Y NUEVAS MEJORAS
// =========================================================================
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();

  // Animación de salida y remoción
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

function showCheckoutConfirmation() {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.classList.add('open');
  }
}

function startProgressBar() {
  const progressBar = document.getElementById('carousel-progress-bar');
  if (!progressBar) return;
  
  progressBar.style.transition = 'none';
  progressBar.style.width = '0%';
  
  // Forzar reflow
  progressBar.offsetHeight;
  
  progressBar.style.transition = 'width 5000ms linear';
  progressBar.style.width = '100%';
}

function resetProgressBar() {
  const progressBar = document.getElementById('carousel-progress-bar');
  if (!progressBar) return;
  progressBar.style.transition = 'none';
  progressBar.style.width = '0%';
}
