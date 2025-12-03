/**
 * Red Lenic - App Logic
 * 
 * Features:
 * - Data Generation (Categories, Subcategories, Products)
 * - Hash-based Routing (SPA)
 * - Persistent Cart (localStorage)
 * - Dynamic Rendering
 * - WhatsApp Integration
 */

// --- Configuration & State ---

const CONFIG = {
    currency: 'ARS',
    whatsappNumber: '5491136574678', // Replace with real number
    placeholderImg: 'https://placehold.co/300x300/e2e8f0/1e40af?text=Producto'
};

const state = {
    products: [],
    categories: [],
    cart: [],
    currentRoute: { page: 'home', params: null }
};

// --- Data Generation ---

function generateData() {
    const categories = [
        {
            id: 'tecnologia',
            name: 'Tecnología',
            icon: 'fa-mobile-screen',
            subcategories: [
                { name: 'Celulares', id: 'celulares' },
                { name: 'Auriculares', id: 'auriculares' },
                { name: 'Parlantes', id: 'parlantes' },
                { name: 'Soportes', id: 'soportes' },
                { name: 'Cámaras y Seguridad', id: 'camaras-seguridad' },
                { name: 'Smart TVs', id: 'smart-tvs' }
            ]
        },
        {
            id: 'hogar',
            name: 'Hogar',
            icon: 'fa-house',
            subcategories: [
                { name: 'Blanquería', id: 'blanqueria' },
                { name: 'Bazar', id: 'bazar' },
                {
                    name: 'Electrodomésticos',
                    id: 'electrodomesticos',
                    subcategories: [
                        { name: 'Cocina', id: 'cocina' },
                        { name: 'Termotanques', id: 'termotanques' },
                        { name: 'Microondas', id: 'microondas' },
                        { name: 'Lavarropas', id: 'lavarropas' }
                    ]
                }
            ]
        },
        {
            id: 'personal',
            name: 'Personal',
            icon: 'fa-user',
            subcategories: [
                { name: 'Accesorios', id: 'accesorios' },
                { name: 'Indumentaria', id: 'indumentaria' },
                { name: 'Juguetes', id: 'juguetes' },
                { name: 'Belleza', id: 'belleza' }
            ]
        }
    ];

    const products = [];
    let prodId = 1;

    // Helper to generate products for a leaf category
    const createProducts = (catId, subId, subName, count = 10) => {
        for (let i = 1; i <= count; i++) {
            products.push({
                id: prodId++,
                categoryId: catId,
                subcategoryId: subId, // Used for filtering
                subcategoryName: subName, // Display name
                name: `${subName} ${String.fromCharCode(65 + i)}-${Math.floor(Math.random() * 1000)}`,
                description: `Increíble ${subName.toLowerCase()} con tecnología de punta, bajo consumo y diseño elegante. Ideal para vos.`,
                price: Math.floor(Math.random() * 500000) + 50000,
                image: CONFIG.placeholderImg,
                featured: i <= 2
            });
        }
    };

    categories.forEach(cat => {
        cat.subcategories.forEach(sub => {
            if (sub.subcategories) {
                // It's a nested category (e.g. Electrodomésticos)
                sub.subcategories.forEach(nestedSub => {
                    createProducts(cat.id, nestedSub.id, nestedSub.name);
                });
            } else {
                // It's a direct subcategory
                createProducts(cat.id, sub.id, sub.name);
            }
        });
    });

    state.categories = categories;
    state.products = products;
    console.log(`Generated ${products.length} products.`);
}

// --- Cart Logic ---

function initCart() {
    const savedCart = localStorage.getItem('redlenic_cart');
    if (savedCart) {
        state.cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = state.cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartUI();

    // Feedback animation
    const btn = document.querySelector(`button[data-id="${productId}"]`);
    if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Agregado';
        btn.classList.add('bg-green-600', 'text-white');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('bg-green-600', 'text-white');
        }, 1500);
    }
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = state.cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function saveCart() {
    localStorage.setItem('redlenic_cart', JSON.stringify(state.cart));
}

function getCartTotal() {
    return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function updateCartUI() {
    // Update Badge
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    badge.textContent = count;
    badge.classList.toggle('scale-100', count > 0);
    badge.classList.toggle('scale-0', count === 0);

    // Update Drawer List
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const whatsappBtn = document.getElementById('whatsapp-btn');

    if (state.cart.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-400">
                <i class="fa-solid fa-cart-shopping text-4xl mb-2"></i>
                <p>Tu carrito está vacío</p>
            </div>`;
        totalEl.textContent = formatPrice(0);
        whatsappBtn.disabled = true;
        return;
    }

    whatsappBtn.disabled = false;
    totalEl.textContent = formatPrice(getCartTotal());

    container.innerHTML = state.cart.map(item => `
        <div class="flex gap-4 mb-4 bg-gray-50 p-3 rounded-lg">
            <img src="${item.image}" class="w-16 h-16 object-cover rounded-md mix-blend-multiply">
            <div class="flex-1">
                <h4 class="font-bold text-sm line-clamp-1">${item.name}</h4>
                <p class="text-[var(--logo-primary)] font-bold text-sm">${formatPrice(item.price)}</p>
                <div class="flex items-center gap-3 mt-2">
                    <button onclick="updateQuantity(${item.id}, -1)" class="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs"><i class="fa-solid fa-minus"></i></button>
                    <span class="text-sm font-medium w-4 text-center">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)" class="w-6 h-6 rounded-full bg-[var(--logo-primary)] text-white hover:bg-[var(--logo-dark)] flex items-center justify-center text-xs"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
            <button onclick="removeFromCart(${item.id})" class="text-gray-400 hover:text-red-500 self-start"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

function sendWhatsApp() {
    if (state.cart.length === 0) return;

    let message = "*Hola Red Lenic! Quiero realizar el siguiente pedido:*\n\n";
    state.cart.forEach(item => {
        message += `• ${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}\n`;
    });
    message += `\n*Total: ${formatPrice(getCartTotal())}*`;

    const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// --- Routing & Rendering ---

function handleHashChange() {
    const hash = window.location.hash.slice(1) || 'home'; // Remove #
    const parts = hash.split('/');

    state.currentRoute = {
        page: parts[0],
        params: parts.slice(1)
    };

    render();
}

function render() {
    const container = document.getElementById('app-container');
    const hero = document.getElementById('hero-section');
    const breadcrumbs = document.getElementById('breadcrumbs');

    // Reset view
    container.innerHTML = '';
    window.scrollTo(0, 0);

    // Show/Hide Hero
    if (state.currentRoute.page === 'home') {
        hero.classList.remove('hidden');
        renderHome(container);
        breadcrumbs.innerHTML = '';
    } else {
        hero.classList.add('hidden');

        if (state.currentRoute.page === 'catalogo') {
            renderCatalog(container);
            breadcrumbs.innerHTML = '<a href="#" class="hover:underline">Inicio</a> <i class="fa-solid fa-chevron-right text-xs"></i> <span>Catálogo</span>';
        } else if (state.currentRoute.page === 'categoria') {
            const catId = state.currentRoute.params[0];
            const subId = state.currentRoute.params[1];
            const nestedSubId = state.currentRoute.params[2];

            renderCategory(container, catId, subId, nestedSubId);

            // Breadcrumbs Logic
            const category = state.categories.find(c => c.id === catId);
            if (category) {
                let crumb = `<a href="#" class="hover:underline">Inicio</a> <i class="fa-solid fa-chevron-right text-xs"></i> <a href="#catalogo" class="hover:underline">Catálogo</a> <i class="fa-solid fa-chevron-right text-xs"></i> <a href="#categoria/${catId}" class="hover:underline">${category.name}</a>`;

                if (subId) {
                    const sub = category.subcategories.find(s => s.id === subId);
                    if (sub) {
                        crumb += ` <i class="fa-solid fa-chevron-right text-xs"></i> <a href="#categoria/${catId}/${subId}" class="hover:underline">${sub.name}</a>`;

                        if (nestedSubId && sub.subcategories) {
                            const nested = sub.subcategories.find(n => n.id === nestedSubId);
                            if (nested) {
                                crumb += ` <i class="fa-solid fa-chevron-right text-xs"></i> <span>${nested.name}</span>`;
                            }
                        }
                    }
                }
                breadcrumbs.innerHTML = crumb;
            }
        }
    }
}

function renderHome(container) {
    // Featured Categories
    const section = document.createElement('div');
    section.className = 'mb-12';
    section.innerHTML = `
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Nuestras Categorías</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            ${state.categories.map(cat => `
                <a href="#categoria/${cat.id}" class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 group border border-gray-100">
                    <div class="w-16 h-16 rounded-full bg-blue-50 text-[var(--logo-primary)] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        <i class="fa-solid ${cat.icon}"></i>
                    </div>
                    <span class="font-semibold text-gray-700 group-hover:text-[var(--logo-primary)]">${cat.name}</span>
                </a>
            `).join('')}
        </div>
    `;
    container.appendChild(section);

    // Featured Products
    const featured = state.products.filter(p => p.featured).slice(0, 8);
    const prodSection = document.createElement('div');
    prodSection.innerHTML = `
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Destacados</h2>
        <div class="mobile-tight-grid">
            ${featured.map(p => createProductCard(p)).join('')}
        </div>
    `;
    container.appendChild(prodSection);
}

function renderCatalog(container) {
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">Catálogo Completo</h2>
        <div class="grid gap-8">
            ${state.categories.map(cat => `
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid ${cat.icon} text-[var(--logo-accent)]"></i> ${cat.name}
                        </h3>
                        <a href="#categoria/${cat.id}" class="text-sm text-[var(--logo-primary)] font-semibold hover:underline">Ver todo</a>
                    </div>
                    <div class="mobile-tight-grid">
                        ${state.products.filter(p => p.categoryId === cat.id).slice(0, 3).map(p => createProductCard(p)).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderCategory(container, catId, subId, nestedSubId) {
    const category = state.categories.find(c => c.id === catId);
    if (!category) {
        container.innerHTML = '<p class="text-center text-gray-500 py-12">Categoría no encontrada.</p>';
        return;
    }

    // Determine what chips to show
    let chips = [];
    let currentSub = null;
    let products = [];

    if (!subId) {
        // Level 1: Show subcategories of the main category
        chips = category.subcategories;
        products = state.products.filter(p => p.categoryId === catId);
    } else {
        currentSub = category.subcategories.find(s => s.id === subId);
        if (currentSub) {
            if (currentSub.subcategories && !nestedSubId) {
                // Level 2: "Electrodomésticos" selected, show its children
                chips = currentSub.subcategories;
                // Filter products that belong to any of these children
                const childIds = currentSub.subcategories.map(c => c.id);
                products = state.products.filter(p => p.categoryId === catId && childIds.includes(p.subcategoryId));
            } else if (currentSub.subcategories && nestedSubId) {
                // Level 3: "Electrodomésticos" > "Cocina" selected
                // Show siblings of the nested subcategory to allow easy switching
                chips = currentSub.subcategories;
                products = state.products.filter(p => p.categoryId === catId && p.subcategoryId === nestedSubId);
            } else {
                // Level 2: Normal subcategory (e.g. "Celulares") selected
                // Show siblings
                chips = category.subcategories;
                products = state.products.filter(p => p.categoryId === catId && p.subcategoryId === subId);
            }
        }
    }

    // Generate Chips HTML
    const generateChipUrl = (item) => {
        if (!subId) return `#categoria/${catId}/${item.id}`; // Go to Level 2
        if (currentSub && currentSub.subcategories && !nestedSubId) return `#categoria/${catId}/${subId}/${item.id}`; // Go to Level 3
        if (currentSub && currentSub.subcategories && nestedSubId) return `#categoria/${catId}/${subId}/${item.id}`; // Switch Level 3
        return `#categoria/${catId}/${item.id}`; // Switch Level 2
    };

    const isSelected = (item) => {
        if (!subId) return false;
        if (nestedSubId) return item.id === nestedSubId;
        return item.id === subId;
    };

    const filterHtml = `
        <div class="flex flex-wrap gap-2 mb-8">
            ${subId && !nestedSubId && !currentSub.subcategories ? `
                <a href="#categoria/${catId}" class="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-white text-gray-600 hover:bg-gray-100 border">
                    <i class="fa-solid fa-arrow-left"></i> Volver
                </a>
            ` : ''}
            
            ${nestedSubId ? `
                 <a href="#categoria/${catId}/${subId}" class="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-white text-gray-600 hover:bg-gray-100 border">
                    <i class="fa-solid fa-arrow-left"></i> Volver
                </a>
            ` : ''}

            ${chips.map(item => `
                <a href="${generateChipUrl(item)}" class="px-4 py-2 rounded-full text-sm font-medium transition-colors ${isSelected(item) ? 'bg-[var(--logo-primary)] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'}">
                    ${item.name}
                </a>
            `).join('')}
        </div>
    `;

    container.innerHTML = `
        <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-lg bg-blue-100 text-[var(--logo-primary)] flex items-center justify-center text-2xl">
                <i class="fa-solid ${category.icon}"></i>
            </div>
            <h2 class="text-3xl font-bold text-gray-800">${category.name} ${currentSub ? `> ${currentSub.name}` : ''} ${nestedSubId ? `> ${chips.find(c => c.id === nestedSubId)?.name}` : ''}</h2>
        </div>
        ${filterHtml}
        <div class="mobile-tight-grid animate-fade-in">
            ${products.map(p => createProductCard(p)).join('')}
        </div>
        ${products.length === 0 ? '<p class="text-gray-500">No hay productos en esta sección.</p>' : ''}
    `;
}

function createProductCard(product) {
    return `
        <div class="product-card group">
            <div class="relative pt-[100%] overflow-hidden bg-gray-100">
                <img src="${product.image}" alt="${product.name}" class="absolute top-0 left-0 w-full h-full object-contain p-4 mix-blend-multiply group-hover:scale-105 transition-transform duration-300">
                <button onclick="openProductModal(${product.id})" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow text-gray-600 hover:text-[var(--logo-primary)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </div>
            <div class="p-3 flex flex-col flex-1">
                <h3 class="font-semibold text-gray-800 line-clamp-2 mb-1" title="${product.name}">${product.name}</h3>
                <p class="text-xs text-gray-500 mb-2 line-clamp-1">${product.subcategoryName}</p>
                <div class="mt-auto flex items-center justify-between gap-2">
                    <span class="price text-[var(--logo-primary)]">${formatPrice(product.price)}</span>
                    <button onclick="addToCart(${product.id})" data-id="${product.id}" class="bg-gray-100 hover:bg-[var(--logo-primary)] hover:text-white text-[var(--logo-primary)] rounded-lg transition-colors flex items-center justify-center">
                        <i class="fa-solid fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// --- Utilities ---

function formatPrice(price) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

function openProductModal(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modal-img').src = product.image;
    document.getElementById('modal-category').textContent = `${state.categories.find(c => c.id === product.categoryId).name} > ${product.subcategoryName}`;
    document.getElementById('modal-title').textContent = product.name;
    document.getElementById('modal-price').textContent = formatPrice(product.price);
    document.getElementById('modal-desc').textContent = product.description;

    const btn = document.getElementById('modal-add-btn');
    btn.onclick = () => {
        addToCart(product.id);
        toggleModal(false);
    };

    toggleModal(true);
}

function toggleModal(show) {
    const modal = document.getElementById('product-modal');
    if (show) {
        modal.classList.remove('pointer-events-none', 'opacity-0');
        document.body.classList.add('modal-open');
    } else {
        modal.classList.add('pointer-events-none', 'opacity-0');
        document.body.classList.remove('modal-open');
    }
}

function toggleCart(show) {
    const drawer = document.getElementById('cart-drawer');
    if (show) {
        drawer.classList.remove('pointer-events-none', 'opacity-0');
        document.body.classList.add('cart-open');
    } else {
        drawer.classList.add('pointer-events-none', 'opacity-0');
        document.body.classList.remove('cart-open');
    }
}

function toggleMenu(show) {
    const menu = document.getElementById('mobile-menu');
    if (show) {
        menu.classList.remove('pointer-events-none', 'opacity-0');
        document.body.classList.add('menu-open');
    } else {
        menu.classList.add('pointer-events-none', 'opacity-0');
        document.body.classList.remove('menu-open');
    }
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    generateData();
    initCart();

    // Event Listeners
    window.addEventListener('hashchange', handleHashChange);

    document.getElementById('cart-btn').addEventListener('click', () => toggleCart(true));
    document.getElementById('close-cart').addEventListener('click', () => toggleCart(false));
    document.getElementById('whatsapp-btn').addEventListener('click', sendWhatsApp);
    document.getElementById('floating-whatsapp').addEventListener('click', () => {
        const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent("Hola Red Lenic! Tengo una consulta.")}`;
        window.open(url, '_blank');
    });

    document.getElementById('menu-btn').addEventListener('click', () => toggleMenu(true));
    document.getElementById('close-menu').addEventListener('click', () => toggleMenu(false));

    document.getElementById('close-modal').addEventListener('click', () => toggleModal(false));

    // Close overlays on click outside
    document.getElementById('cart-drawer').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) toggleCart(false);
    });
    document.getElementById('mobile-menu').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) toggleMenu(false);
    });
    document.getElementById('product-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) toggleModal(false);
    });

    // Render Mobile Menu Categories
    const menuContent = document.getElementById('mobile-menu-content');
    menuContent.innerHTML = `
        <a href="#" class="block py-3 px-4 text-gray-700 hover:bg-gray-50 border-b font-medium" onclick="toggleMenu(false)">Inicio</a>
        <a href="#catalogo" class="block py-3 px-4 text-gray-700 hover:bg-gray-50 border-b font-medium" onclick="toggleMenu(false)">Catálogo Completo</a>
        <div class="pt-2">
            <span class="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Categorías</span>
            ${state.categories.map(cat => `
                <a href="#categoria/${cat.id}" class="block py-3 px-4 text-gray-600 hover:text-[var(--logo-primary)] hover:bg-gray-50 flex items-center gap-3" onclick="toggleMenu(false)">
                    <i class="fa-solid ${cat.icon} w-5 text-center"></i> ${cat.name}
                </a>
            `).join('')}
        </div>
    `;

    // Initial Render
    handleHashChange();
});
