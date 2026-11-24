/**
 * Online Food Ordering System - Vanilla JavaScript Client
 * Handles:
 * - Async/Await Fetch API calls for Restaurants and Menu Items
 * - JavaScript validation (non-empty name, positive price, required fields)
 * - DOM manipulation (cards, tables, filters, modals, stats)
 * - Guard header passing (x-api-key)
 */

// Application State
const state = {
  apiBase: window.location.origin.includes('http') ? window.location.origin : 'http://localhost:3000',
  apiKey: localStorage.getItem('food_ordering_api_key') || 'food-quiz-secret-key-2026',
  restaurants: [],
  menuItems: [],
  selectedRestaurantId: 'all',
  selectedCategory: 'all',
  searchQuery: '',
  viewMode: 'cards', // 'cards' or 'table'
};

// Category Icons Mapping
const categoryIcons = {
  'Fast Food': 'bi-lightning-charge-fill text-danger',
  'Main Course': 'bi-egg-fried text-warning',
  'Appetizers': 'bi-cup-straw text-success',
  'Desserts': 'bi-cake2 text-info',
  'Beverages': 'bi-cup-hot text-primary',
  'Pizza & Pasta': 'bi-pie-chart text-warning',
  'General': 'bi-tag text-secondary',
};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initApiKeyDisplay();
  setupEventListeners();
  loadData();
});

/**
 * Setup and initialize API key controls
 */
function initApiKeyDisplay() {
  const display = document.getElementById('apiKeyDisplay');
  const input = document.getElementById('apiKeyInput');
  if (display) display.textContent = state.apiKey;
  if (input) input.value = state.apiKey;
}

/**
 * Configure DOM Event Listeners
 */
function setupEventListeners() {
  // Add Menu Item Form Submission
  const addForm = document.getElementById('addMenuItemForm');
  if (addForm) {
    addForm.addEventListener('submit', handleAddMenuItem);
  }

  // Add Restaurant Form Submission
  const addRestaurantForm = document.getElementById('addRestaurantForm');
  if (addRestaurantForm) {
    addRestaurantForm.addEventListener('submit', handleAddRestaurant);
  }

  // Edit Menu Item Form Submission
  const editForm = document.getElementById('editMenuItemForm');
  if (editForm) {
    editForm.addEventListener('submit', handleUpdateMenuItem);
  }

  // View Switchers (Cards vs Table)
  document.getElementById('viewCardsBtn')?.addEventListener('click', () => switchView('cards'));
  document.getElementById('viewTableBtn')?.addEventListener('click', () => switchView('table'));

  // Search Input Filter
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    renderMenuItems();
  });

  // Category Filter
  document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
    state.selectedCategory = e.target.value;
    renderMenuItems();
  });

  // Refresh Button
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    showToast('Refreshing data from database...', 'info');
    loadData();
  });

  // API Key Settings Modal
  document.getElementById('saveApiKeyBtn')?.addEventListener('click', () => {
    const newKey = document.getElementById('apiKeyInput').value.trim();
    state.apiKey = newKey;
    localStorage.setItem('food_ordering_api_key', newKey);
    initApiKeyDisplay();
    showToast(`API Key updated to: ${newKey || '(Empty - Guard should fail)'}`, 'info');
    loadMenuItems();
  });

  document.getElementById('resetApiKeyBtn')?.addEventListener('click', () => {
    state.apiKey = 'food-quiz-secret-key-2026';
    localStorage.setItem('food_ordering_api_key', state.apiKey);
    document.getElementById('apiKeyInput').value = state.apiKey;
    initApiKeyDisplay();
    showToast('API Key reset to default quiz key', 'success');
  });

  document.getElementById('invalidateApiKeyBtn')?.addEventListener('click', () => {
    state.apiKey = 'invalid-wrong-key-123';
    localStorage.setItem('food_ordering_api_key', state.apiKey);
    document.getElementById('apiKeyInput').value = state.apiKey;
    initApiKeyDisplay();
    showToast('API Key set to invalid test value (Guard test)', 'warning');
  });
}

/**
 * Load both Restaurants and Menu Items
 */
async function loadData() {
  await loadRestaurants();
  await loadMenuItems();
}

/**
 * Fetch Restaurants (GET /restaurants)
 */
async function loadRestaurants() {
  try {
    const res = await fetch(`${state.apiBase}/restaurants`);
    if (!res.ok) {
      throw new Error(`Failed to load restaurants: HTTP ${res.status}`);
    }
    const data = await res.json();
    state.restaurants = Array.isArray(data) ? data : [];

    renderRestaurantsSelects();
    renderRestaurantPills();
    renderRestaurantCards();
    updateStats();
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    showAlert(`Could not connect to PostgreSQL backend: ${err.message}. Ensure NestJS is running!`, 'danger');
  }
}

/**
 * Fetch Menu Items (GET /menu-items) with Guard Header
 */
async function loadMenuItems() {
  try {
    let url = `${state.apiBase}/menu-items`;
    if (state.selectedRestaurantId !== 'all') {
      url += `?restaurantId=${state.selectedRestaurantId}`;
    }

    // Call protected endpoint with x-api-key header
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.apiKey,
      },
    });

    if (res.status === 401) {
      const errJson = await res.json().catch(() => ({}));
      showAlert(
        `<strong>Guard Rejection (401 Unauthorized):</strong> ${errJson.message || 'Access denied by ApiKeyGuard'}. Check your API Key header.`,
        'danger',
      );
      state.menuItems = [];
      renderMenuItems();
      updateStats();
      return;
    }

    if (!res.ok) {
      throw new Error(`Failed to load menu items: HTTP ${res.status}`);
    }

    const data = await res.json();
    state.menuItems = Array.isArray(data) ? data : [];
    renderMenuItems();
    updateStats();
  } catch (err) {
    console.error('Error fetching menu items:', err);
    showAlert(`Error loading menu items: ${err.message}`, 'danger');
  }
}

/**
 * Handle Add Restaurant Submission (POST /restaurants)
 */
async function handleAddRestaurant(e) {
  e.preventDefault();
  const form = e.target;

  const nameInput = document.getElementById('restaurantName');
  const addressInput = document.getElementById('restaurantAddress');
  const cuisineInput = document.getElementById('restaurantCuisine');
  const phoneInput = document.getElementById('restaurantPhone');

  // Validation
  let isValid = true;
  if (!nameInput.value.trim()) {
    nameInput.classList.add('is-invalid');
    isValid = false;
  } else {
    nameInput.classList.remove('is-invalid');
  }

  if (!addressInput.value.trim()) {
    addressInput.classList.add('is-invalid');
    isValid = false;
  } else {
    addressInput.classList.remove('is-invalid');
  }

  if (!isValid) return;

  const payload = {
    name: nameInput.value.trim(),
    address: addressInput.value.trim(),
    cuisine: cuisineInput.value.trim() || undefined,
    phone: phoneInput.value.trim() || undefined,
  };

  try {
    const saveBtn = document.getElementById('saveRestaurantBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

    const res = await fetch(`${state.apiBase}/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create restaurant');
    }

    const created = await res.json();
    showToast(`Restaurant "${created.name}" created successfully!`, 'success');

    // Close modal & reset form
    form.reset();
    const modalEl = document.getElementById('addRestaurantModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    // Reload data
    await loadRestaurants();
  } catch (err) {
    console.error('Add Restaurant error:', err);
    showAlert(`Error adding restaurant: ${err.message}`, 'danger');
  } finally {
    const saveBtn = document.getElementById('saveRestaurantBtn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Save Restaurant';
    }
  }
}

/**
 * Handle Add Menu Item Submission (POST /menu-items) with Validation
 */
async function handleAddMenuItem(e) {
  e.preventDefault();

  const restaurantSelect = document.getElementById('itemRestaurant');
  const nameInput = document.getElementById('itemName');
  const priceInput = document.getElementById('itemPrice');
  const categorySelect = document.getElementById('itemCategory');
  const availableInput = document.getElementById('itemAvailable');
  const descriptionInput = document.getElementById('itemDescription');

  // Client-Side Validation
  let isValid = true;

  // 1. Restaurant selection validation
  const restaurantId = parseInt(restaurantSelect.value, 10);
  if (!restaurantId || isNaN(restaurantId)) {
    restaurantSelect.classList.add('is-invalid');
    isValid = false;
  } else {
    restaurantSelect.classList.remove('is-invalid');
    restaurantSelect.classList.add('is-valid');
  }

  // 2. Name validation: must not be empty
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.classList.add('is-invalid');
    isValid = false;
  } else {
    nameInput.classList.remove('is-invalid');
    nameInput.classList.add('is-valid');
  }

  // 3. Price validation: must be a positive number
  const price = parseFloat(priceInput.value);
  if (isNaN(price) || price <= 0) {
    priceInput.classList.add('is-invalid');
    isValid = false;
  } else {
    priceInput.classList.remove('is-invalid');
    priceInput.classList.add('is-valid');
  }

  // 4. Category validation
  const category = categorySelect.value;
  if (!category) {
    categorySelect.classList.add('is-invalid');
    isValid = false;
  } else {
    categorySelect.classList.remove('is-invalid');
    categorySelect.classList.add('is-valid');
  }

  if (!isValid) {
    showToast('Please fix the highlighted validation errors', 'warning');
    return;
  }

  const payload = {
    name,
    price,
    category,
    restaurantId,
    isAvailable: availableInput.checked,
    description: descriptionInput.value.trim() || undefined,
  };

  try {
    const saveBtn = document.getElementById('saveItemBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Adding to PostgreSQL...';

    const res = await fetch(`${state.apiBase}/menu-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.apiKey, // Guard authentication
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error('401 Unauthorized: Guard rejected request. Please check API Key.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      throw new Error(msg || 'Failed to create menu item');
    }

    const created = await res.json();
    showToast(`Added "${created.name}" for $${Number(created.price).toFixed(2)}!`, 'success');

    // Reset Form and clear validation marks
    e.target.reset();
    availableInput.checked = true;
    [restaurantSelect, nameInput, priceInput, categorySelect].forEach((el) => {
      el.classList.remove('is-valid', 'is-invalid');
    });

    // Reload list and restaurant counts
    await loadData();
  } catch (err) {
    console.error('Create MenuItem Error:', err);
    showAlert(`Error adding menu item: ${err.message}`, 'danger');
  } finally {
    const saveBtn = document.getElementById('saveItemBtn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-plus-circle-fill"></i> Add Menu Item to Database';
    }
  }
}

/**
 * Handle Update Menu Item (PATCH /menu-items/:id)
 */
async function handleUpdateMenuItem(e) {
  e.preventDefault();

  const id = parseInt(document.getElementById('editItemId').value, 10);
  const restaurantId = parseInt(document.getElementById('editItemRestaurant').value, 10);
  const name = document.getElementById('editItemName').value.trim();
  const price = parseFloat(document.getElementById('editItemPrice').value);
  const category = document.getElementById('editItemCategory').value;
  const isAvailable = document.getElementById('editItemAvailable').checked;
  const description = document.getElementById('editItemDescription').value.trim();

  // Validation
  if (!name || isNaN(price) || price <= 0 || !restaurantId) {
    showToast('Please provide valid name, positive price, and restaurant.', 'warning');
    return;
  }

  const payload = {
    name,
    price,
    category,
    restaurantId,
    isAvailable,
    description: description || undefined,
  };

  try {
    const updateBtn = document.getElementById('updateItemBtn');
    updateBtn.disabled = true;
    updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Updating...';

    const res = await fetch(`${state.apiBase}/menu-items/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update menu item');
    }

    showToast(`Menu item #${id} updated successfully!`, 'success');

    // Close Modal
    const modalEl = document.getElementById('editMenuItemModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    await loadData();
  } catch (err) {
    console.error('Update MenuItem Error:', err);
    showAlert(`Error updating item: ${err.message}`, 'danger');
  } finally {
    const updateBtn = document.getElementById('updateItemBtn');
    if (updateBtn) {
      updateBtn.disabled = false;
      updateBtn.innerHTML = '<i class="bi bi-save me-1"></i> Update Menu Item';
    }
  }
}

/**
 * Delete Menu Item (DELETE /menu-items/:id)
 */
async function deleteMenuItem(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}" (ID #${id}) from the database?`)) {
    return;
  }

  try {
    const res = await fetch(`${state.apiBase}/menu-items/${id}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': state.apiKey,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete menu item');
    }

    showToast(`Item "${name}" deleted successfully!`, 'success');
    await loadData();
  } catch (err) {
    console.error('Delete MenuItem Error:', err);
    showAlert(`Error deleting item: ${err.message}`, 'danger');
  }
}

/**
 * Open Edit Modal for a given item
 */
function openEditModal(item) {
  document.getElementById('editItemId').value = item.id;
  document.getElementById('editItemName').value = item.name;
  document.getElementById('editItemPrice').value = item.price;
  document.getElementById('editItemCategory').value = item.category || 'General';
  document.getElementById('editItemAvailable').checked = !!item.isAvailable;
  document.getElementById('editItemDescription').value = item.description || '';

  // Populate edit restaurant select
  const editRestaurantSelect = document.getElementById('editItemRestaurant');
  editRestaurantSelect.innerHTML = state.restaurants
    .map((r) => `<option value="${r.id}" ${r.id === item.restaurantId ? 'selected' : ''}>${escapeHtml(r.name)}</option>`)
    .join('');

  const modal = new bootstrap.Modal(document.getElementById('editMenuItemModal'));
  modal.show();
}

/**
 * Switch View Mode: 'cards' or 'table'
 */
function switchView(mode) {
  state.viewMode = mode;
  const cardsContainer = document.getElementById('cardsViewContainer');
  const tableContainer = document.getElementById('tableViewContainer');
  const cardsBtn = document.getElementById('viewCardsBtn');
  const tableBtn = document.getElementById('viewTableBtn');

  if (mode === 'cards') {
    cardsContainer?.classList.remove('d-none');
    tableContainer?.classList.add('d-none');
    cardsBtn?.classList.add('active');
    tableBtn?.classList.remove('active');
  } else {
    cardsContainer?.classList.add('d-none');
    tableContainer?.classList.remove('d-none');
    cardsBtn?.classList.remove('active');
    tableBtn?.classList.add('active');
  }
  renderMenuItems();
}

/**
 * Filter items using category, restaurant, and search text
 */
function getFilteredItems() {
  return state.menuItems.filter((item) => {
    // Restaurant filter
    if (state.selectedRestaurantId !== 'all') {
      const targetId = parseInt(state.selectedRestaurantId, 10);
      if (item.restaurantId !== targetId) return false;
    }

    // Category filter
    if (state.selectedCategory !== 'all') {
      if (item.category !== state.selectedCategory) return false;
    }

    // Search query filter
    if (state.searchQuery) {
      const matchName = item.name.toLowerCase().includes(state.searchQuery);
      const matchDesc = (item.description || '').toLowerCase().includes(state.searchQuery);
      const matchRest = (item.restaurant?.name || '').toLowerCase().includes(state.searchQuery);
      if (!matchName && !matchDesc && !matchRest) return false;
    }

    return true;
  });
}

/**
 * Render Menu Items (DOM manipulation)
 */
function renderMenuItems() {
  const filtered = getFilteredItems();
  const emptyState = document.getElementById('emptyState');
  const cardsContainer = document.getElementById('cardsViewContainer');
  const tableBody = document.getElementById('tableBody');

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('d-none');
    if (cardsContainer) cardsContainer.innerHTML = '';
    if (tableBody) tableBody.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.classList.add('d-none');

  // Render Cards
  if (cardsContainer) {
    cardsContainer.innerHTML = filtered.map((item) => {
      const iconClass = categoryIcons[item.category] || categoryIcons['General'];
      const statusBadge = item.isAvailable
        ? '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle me-1"></i>Available</span>'
        : '<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="bi bi-x-circle me-1"></i>Unavailable</span>';

      const restName = item.restaurant?.name || `Restaurant #${item.restaurantId}`;

      return `
        <div class="col-md-6 col-xl-4">
          <div class="card h-100 menu-card bg-white shadow-sm">
            <div class="card-body p-3 d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge bg-light text-dark border d-flex align-items-center gap-1">
                  <i class="bi ${iconClass}"></i> ${escapeHtml(item.category || 'General')}
                </span>
                ${statusBadge}
              </div>

              <h6 class="card-title fw-bold text-dark mb-1 fs-5">${escapeHtml(item.name)}</h6>
              <div class="text-muted small mb-2 d-flex align-items-center gap-1">
                <i class="bi bi-shop text-primary"></i> ${escapeHtml(restName)}
              </div>

              <p class="card-text text-secondary small flex-grow-1 mb-3">
                ${escapeHtml(item.description || 'No description provided.')}
              </p>

              <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                <div class="price-tag text-primary">
                  $${Number(item.price).toFixed(2)}
                </div>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary edit-btn" data-id="${item.id}" title="Edit Item">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-danger delete-btn" data-id="${item.id}" data-name="${escapeHtml(item.name)}" title="Delete Item">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners to dynamically created edit/delete buttons
    cardsContainer.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const item = state.menuItems.find((i) => i.id === id);
        if (item) openEditModal(item);
      });
    });

    cardsContainer.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const name = btn.getAttribute('data-name');
        deleteMenuItem(id, name);
      });
    });
  }

  // Render Table
  if (tableBody) {
    tableBody.innerHTML = filtered.map((item) => {
      const statusBadge = item.isAvailable
        ? '<span class="badge bg-success">Available</span>'
        : '<span class="badge bg-danger">Unavailable</span>';

      const restName = item.restaurant?.name || `Restaurant #${item.restaurantId}`;

      return `
        <tr>
          <td><span class="badge bg-light text-dark border">#${item.id}</span></td>
          <td>
            <div class="fw-bold">${escapeHtml(item.name)}</div>
            <div class="small text-muted text-truncate" style="max-width: 280px;">${escapeHtml(item.description || '')}</div>
          </td>
          <td><i class="bi bi-shop text-primary me-1"></i>${escapeHtml(restName)}</td>
          <td><span class="badge bg-light text-secondary border">${escapeHtml(item.category || 'General')}</span></td>
          <td class="fw-bold text-primary">$${Number(item.price).toFixed(2)}</td>
          <td>${statusBadge}</td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary table-edit-btn" data-id="${item.id}" title="Edit Item">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-outline-danger table-delete-btn" data-id="${item.id}" data-name="${escapeHtml(item.name)}" title="Delete Item">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('.table-edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const item = state.menuItems.find((i) => i.id === id);
        if (item) openEditModal(item);
      });
    });

    tableBody.querySelectorAll('.table-delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const name = btn.getAttribute('data-name');
        deleteMenuItem(id, name);
      });
    });
  }
}

/**
 * Populate Restaurant <select> elements in forms
 */
function renderRestaurantsSelects() {
  const addSelect = document.getElementById('itemRestaurant');
  if (!addSelect) return;

  if (state.restaurants.length === 0) {
    addSelect.innerHTML = '<option value="" disabled selected>No restaurants found. Please add a restaurant first.</option>';
    return;
  }

  const optionsHtml = '<option value="" disabled selected>-- Choose a Restaurant --</option>' +
    state.restaurants
      .map((r) => `<option value="${r.id}">${escapeHtml(r.name)} (${escapeHtml(r.address)})</option>`)
      .join('');

  addSelect.innerHTML = optionsHtml;
}

/**
 * Render Restaurant Filter Pills
 */
function renderRestaurantPills() {
  const container = document.getElementById('restaurantFilterPills');
  if (!container) return;

  const totalItemsCount = state.menuItems.length;
  document.getElementById('totalItemsBadge').textContent = totalItemsCount;

  const pillsHtml = `
    <button class="btn btn-sm ${state.selectedRestaurantId === 'all' ? 'btn-dark active' : 'btn-outline-dark'} filter-pill" data-restaurant-id="all">
      All Restaurants (${totalItemsCount})
    </button>
    ${state.restaurants.map((r) => {
      const count = (r.menuItems && r.menuItems.length) || state.menuItems.filter((i) => i.restaurantId === r.id).length;
      const isActive = String(state.selectedRestaurantId) === String(r.id);
      return `
        <button class="btn btn-sm ${isActive ? 'btn-dark active' : 'btn-outline-dark'} filter-pill" data-restaurant-id="${r.id}">
          <i class="bi bi-shop me-1"></i> ${escapeHtml(r.name)} (${count})
        </button>
      `;
    }).join('')}
  `;

  container.innerHTML = pillsHtml;

  // Add click handlers to pills
  container.querySelectorAll('.filter-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rId = btn.getAttribute('data-restaurant-id');
      state.selectedRestaurantId = rId;
      renderRestaurantPills();
      loadMenuItems();
    });
  });
}

/**
 * Render Restaurant Cards in Restaurant Management section
 */
function renderRestaurantCards() {
  const container = document.getElementById('restaurantsListContainer');
  if (!container) return;

  if (state.restaurants.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4 text-muted">
        <i class="bi bi-shop fs-3 d-block mb-1"></i>
        <span>No restaurants registered yet. Click "Add Restaurant" to create one.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = state.restaurants.map((r) => {
    const itemCount = (r.menuItems && r.menuItems.length) || state.menuItems.filter((i) => i.restaurantId === r.id).length;
    const isSelected = String(state.selectedRestaurantId) === String(r.id);

    return `
      <div class="col-md-6">
        <div class="p-3 restaurant-badge-card ${isSelected ? 'active-restaurant' : ''}" data-restaurant-id="${r.id}">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <h6 class="fw-bold mb-0 text-dark text-truncate">${escapeHtml(r.name)}</h6>
            <span class="badge bg-primary rounded-pill">${itemCount} items</span>
          </div>
          <div class="small text-muted text-truncate mb-1">
            <i class="bi bi-geo-alt me-1 text-danger"></i>${escapeHtml(r.address)}
          </div>
          <div class="d-flex justify-content-between align-items-center small text-secondary">
            <span><i class="bi bi-tag me-1"></i>${escapeHtml(r.cuisine || 'Various')}</span>
            <span><i class="bi bi-telephone me-1"></i>${escapeHtml(r.phone || 'N/A')}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Click card to filter
  container.querySelectorAll('.restaurant-badge-card').forEach((card) => {
    card.addEventListener('click', () => {
      const rId = card.getAttribute('data-restaurant-id');
      state.selectedRestaurantId = state.selectedRestaurantId === rId ? 'all' : rId;
      renderRestaurantPills();
      renderRestaurantCards();
      loadMenuItems();
    });
  });
}

/**
 * Update Header Counters
 */
function updateStats() {
  const restCount = document.getElementById('statRestaurantsCount');
  const menuCount = document.getElementById('statMenuItemsCount');
  if (restCount) restCount.textContent = state.restaurants.length;
  if (menuCount) menuCount.textContent = state.menuItems.length;

  const catalogSubtitle = document.getElementById('catalogSubtitle');
  if (catalogSubtitle) {
    if (state.selectedRestaurantId === 'all') {
      catalogSubtitle.textContent = `Showing all items across ${state.restaurants.length} restaurants`;
    } else {
      const r = state.restaurants.find((x) => String(x.id) === String(state.selectedRestaurantId));
      catalogSubtitle.textContent = `Filtered by restaurant: ${r ? r.name : state.selectedRestaurantId}`;
    }
  }
}

/**
 * Display Alert Messages in Top Container
 */
function showAlert(message, type = 'info') {
  const container = document.getElementById('alertContainer');
  if (!container) return;

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  container.innerHTML = '';
  container.appendChild(alertDiv);

  // Auto-dismiss after 6 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 200);
    }
  }, 6000);
}

/**
 * Display Floating Toast Notification
 */
function showToast(message, type = 'info') {
  const toastEl = document.getElementById('liveToast');
  const msgEl = document.getElementById('toastMessage');
  if (!toastEl || !msgEl) return;

  const bgClasses = {
    success: 'bg-success',
    danger: 'bg-danger',
    warning: 'bg-warning text-dark',
    info: 'bg-primary',
  };

  toastEl.className = `toast align-items-center border-0 ${bgClasses[type] || 'bg-primary'} text-white`;
  msgEl.innerHTML = `<i class="bi bi-info-circle-fill me-1"></i> ${message}`;

  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
}

/**
 * Sanitize HTML text to prevent XSS
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
