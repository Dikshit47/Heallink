/**
 * HEAL LINK - Main Application Script
 * Orchestrates navigation, AI Care Twin, transparent pricing, emergency swarm, QR passport, and dashboards.
 */

// Global App State
const state = {
  currentView: 'home',
  currentRole: 'patient',
  equipmentList: [],
  compareList: [],
  selectedEquipment: null,
  activeBooking: null,
  activeTrackingRef: 'HL-BK-9403',
  categories: ['All', 'Respiratory', 'Beds', 'Mobility', 'Monitoring', 'Home ICU', 'Accessories'],
  currentCategory: 'All',
  searchQuery: '',
  sortBy: 'trust_desc',
  activeBundleKey: 'post_surgery_bundle'
};

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  loadEquipment();
  setupEventListeners();
  loadFamilyDashboard();
  loadReturnReusePipeline();
  loadVendorDashboard();
  loadAdminDashboard();
});

// ---------------- Navigation & View Controller ----------------
function initNavigation() {
  document.querySelectorAll('[data-view-target]').forEach(elem => {
    elem.addEventListener('click', (e) => {
      e.preventDefault();
      const target = elem.getAttribute('data-view-target');
      switchView(target);
    });
  });

  document.querySelectorAll('[data-role-btn]').forEach(elem => {
    elem.addEventListener('click', () => {
      const role = elem.getAttribute('data-role-btn');
      switchRole(role);
    });
  });
}

function switchView(viewName) {
  state.currentView = viewName;
  
  // Hide all views
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.add('hidden');
  });

  // Show target view
  const targetSec = document.getElementById(`view-${viewName}`);
  if (targetSec) {
    targetSec.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update navigation tabs active style
  document.querySelectorAll('.nav-tab').forEach(tab => {
    if (tab.getAttribute('data-view-target') === viewName) {
      tab.classList.add('text-teal-600', 'border-b-2', 'border-teal-600', 'font-semibold');
      tab.classList.remove('text-slate-600');
    } else {
      tab.classList.remove('text-teal-600', 'border-b-2', 'border-teal-600', 'font-semibold');
      tab.classList.add('text-slate-600');
    }
  });

  // View specific refreshes
  if (viewName === 'marketplace') {
    loadEquipment(state.currentCategory, state.searchQuery, state.sortBy);
  } else if (viewName === 'compare') {
    renderCompareView();
  } else if (viewName === 'family') {
    loadFamilyDashboard();
  } else if (viewName === 'vendor-dash') {
    loadVendorDashboard();
  } else if (viewName === 'admin-dash') {
    loadAdminDashboard();
  } else if (viewName === 'return-reuse') {
    loadReturnReusePipeline();
  } else if (viewName === 'emergency') {
    runEmergencySwarm();
  } else if (viewName === 'rent-buy') {
    runRentVsBuy();
  }
}

function switchRole(roleName) {
  state.currentRole = roleName;
  
  // Update header indicator
  const roleDisplay = document.getElementById('current-role-badge');
  if (roleDisplay) {
    if (roleName === 'patient') {
      roleDisplay.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Patient & Family Mode';
      roleDisplay.className = 'inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200';
      switchView('home');
    } else if (roleName === 'vendor') {
      roleDisplay.innerHTML = '<span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Vendor Partner Mode';
      roleDisplay.className = 'inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200';
      switchView('vendor-dash');
    } else if (roleName === 'admin') {
      roleDisplay.innerHTML = '<span class="w-2 h-2 rounded-full bg-purple-500 mr-2"></span> Platform Admin Mode';
      roleDisplay.className = 'inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200';
      switchView('admin-dash');
    }
  }

  showToast('Role Switched', `Active view updated to ${roleName.toUpperCase()}`, 'info');
}

// ---------------- Presentation Demo Scenarios ----------------
function triggerDemoScenario(scenarioId) {
  if (scenarioId === 1) {
    // Post-Surgery Hip Recovery
    switchView('ai-care');
    const input = document.getElementById('care-input');
    if (input) {
      input.value = "My father had hip surgery and needs home recovery for 45 days.";
    }
    showToast('Demo Scenario Loaded', 'Processing Post-Surgery Hip Recovery (45 Days)...', 'info');
    setTimeout(() => {
      submitCareQuery("My father had hip surgery and needs home recovery for 45 days.");
    }, 400);
  } else if (scenarioId === 2) {
    // Elderly Home Care
    switchView('ai-care');
    const input = document.getElementById('care-input');
    if (input) {
      input.value = "My elderly mother has severe arthritis and limited mobility, needs fall prevention.";
    }
    showToast('Demo Scenario Loaded', 'Processing Elderly Home Care Plan...', 'info');
    setTimeout(() => {
      submitCareQuery("My elderly mother has severe arthritis and limited mobility, needs fall prevention.");
    }, 400);
  } else if (scenarioId === 3) {
    // Emergency Oxygen Equipment
    switchView('emergency');
    showToast('Emergency Swarm Activated', 'Locating closest verified oxygen concentrators...', 'warning');
    const eqSelect = document.getElementById('emergency-eq-select');
    if (eqSelect) eqSelect.value = "Oxygen Concentrator";
    runEmergencySwarm();
  } else if (scenarioId === 4) {
    // Long-Term Respiratory Bundle
    switchView('ai-bundle');
    loadBundle('respiratory_bundle');
    showToast('Demo Scenario Loaded', 'Displaying Respiratory Recovery Care Bundle', 'info');
  }
}

// ---------------- Equipment Catalogue & Filters ----------------
async function loadEquipment(category = 'All', search = '', sortBy = 'trust_desc') {
  try {
    state.currentCategory = category;
    state.searchQuery = search;
    state.sortBy = sortBy;

    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);
    if (sortBy) params.append('sort_by', sortBy);

    const res = await fetch(`/api/equipment?${params.toString()}`);
    const json = await res.json();
    
    if (json.status === 'success') {
      state.equipmentList = json.data;
      renderEquipmentGrid(json.data);
      renderCategoryPills();
    }
  } catch (err) {
    console.error('Error fetching equipment:', err);
  }
}

function renderCategoryPills() {
  const container = document.getElementById('category-pills-container');
  if (!container) return;

  container.innerHTML = state.categories.map(cat => {
    const isActive = cat.toLowerCase() === state.currentCategory.toLowerCase();
    const activeClasses = 'bg-teal-600 text-white font-medium shadow-sm';
    const inactiveClasses = 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200';
    return `
      <button onclick="filterByCategory('${cat}')" 
              class="px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap ${isActive ? activeClasses : inactiveClasses}">
        ${cat}
      </button>
    `;
  }).join('');
}

function filterByCategory(cat) {
  loadEquipment(cat, state.searchQuery, state.sortBy);
}

function renderEquipmentGrid(items) {
  const container = document.getElementById('equipment-grid');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-2xl">🔍</div>
        <h3 class="text-lg font-semibold text-slate-700">No medical equipment matches your search</h3>
        <p class="text-sm mt-1">Try resetting the category filter or searching for another term.</p>
        <button onclick="loadEquipment('All', '', 'trust_desc')" class="mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const isCompared = state.compareList.includes(item.id);
    return `
      <div class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col card-hover">
        <div class="relative h-48 bg-slate-100 overflow-hidden group">
          <img src="${item.image_url}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80'">
          <div class="absolute top-3 left-3">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5"></span> ${item.category}
            </span>
          </div>
          <div class="absolute top-3 right-3">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold badge-trust shadow-sm">
              ★ ${item.trust_score}/100 Trust
            </span>
          </div>
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Verified: ${item.vendor_name}</span>
              <span class="font-medium text-teal-700">ETA ${item.vendor_eta_mins}m • ${item.vendor_distance_km}km</span>
            </div>
            <h3 class="font-bold text-slate-900 text-base leading-snug line-clamp-1 hover:text-teal-700 cursor-pointer" onclick="openEquipmentModal('${item.id}')">${item.name}</h3>
            <p class="text-xs text-slate-600 mt-1 line-clamp-2">${item.short_desc}</p>
          </div>

          <!-- Transparent Pricing Display -->
          <div class="mt-4 pt-3 border-t border-slate-100">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Transparent Rental Rates</div>
            <div class="grid grid-cols-3 gap-1.5 text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div class="p-1">
                <div class="text-[10px] text-slate-500 font-medium">Daily</div>
                <div class="text-xs font-bold text-slate-800">₹${item.daily_price.toLocaleString()}</div>
              </div>
              <div class="p-1 border-x border-slate-200/80">
                <div class="text-[10px] text-slate-500 font-medium">Weekly</div>
                <div class="text-xs font-bold text-slate-800">₹${item.weekly_price.toLocaleString()}</div>
              </div>
              <div class="p-1">
                <div class="text-[10px] text-teal-600 font-medium">Monthly</div>
                <div class="text-xs font-bold text-teal-700">₹${item.monthly_price.toLocaleString()}</div>
              </div>
            </div>

            <div class="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
              <span>Security Deposit: <strong class="text-slate-700">₹${item.security_deposit.toLocaleString()}</strong></span>
              <span class="text-emerald-600 font-medium">100% Refundable</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-4 pt-2 flex items-center space-x-2">
            <button onclick="openEquipmentModal('${item.id}')" class="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all text-center">
              View Details & Book
            </button>
            <button onclick="toggleCompare('${item.id}')" title="Compare" class="p-2 rounded-xl border ${isCompared ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} text-xs transition-all">
              ${isCompared ? '✓ Added' : 'Compare'}
            </button>
            <button onclick="openQrPassportModal('${item.id}')" title="QR Health Passport" class="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition-all text-xs">
              <span class="font-mono font-bold">QR</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---------------- Equipment Details & Transparent Pricing Calculator ----------------
async function openEquipmentModal(equipmentId) {
  try {
    const res = await fetch(`/api/equipment/${equipmentId}`);
    const json = await res.json();
    if (json.status !== 'success') return;

    const { equipment, pricing_breakdown, trust_breakdown, health_passport } = json;
    state.selectedEquipment = equipment;

    const modal = document.getElementById('equipment-detail-modal');
    const content = document.getElementById('equipment-modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
        <!-- Left: Image & Trust Score -->
        <div class="md:col-span-5 flex flex-col space-y-4">
          <div class="relative h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            <img src="${equipment.image_url}" alt="${equipment.name}" class="w-full h-full object-cover">
            <div class="absolute top-3 left-3 bg-white/95 px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
              ID: ${equipment.id}
            </div>
            <div class="absolute top-3 right-3 badge-trust px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              ★ Trust Score: ${trust_breakdown.overall_score}/100
            </div>
          </div>

          <!-- Trust Score Breakdown -->
          <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">Verified Trust Score Breakdown</h4>
              <span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">Demo Verified</span>
            </div>
            <div class="space-y-2 text-xs">
              <div>
                <div class="flex justify-between text-[11px] mb-0.5 text-slate-600">
                  <span>Sanitization & Disinfection</span>
                  <span class="font-bold text-emerald-600">${trust_breakdown.sanitization}%</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${trust_breakdown.sanitization}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-[11px] mb-0.5 text-slate-600">
                  <span>14-Point Functional Test</span>
                  <span class="font-bold text-emerald-600">${trust_breakdown.functional_test}%</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-teal-500 h-1.5 rounded-full" style="width: ${trust_breakdown.functional_test}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-[11px] mb-0.5 text-slate-600">
                  <span>Preventive Maintenance</span>
                  <span class="font-bold text-slate-700">${trust_breakdown.maintenance}%</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-blue-500 h-1.5 rounded-full" style="width: ${trust_breakdown.maintenance}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-[11px] mb-0.5 text-slate-600">
                  <span>Medical Certification</span>
                  <span class="font-bold text-emerald-600">${trust_breakdown.certification}%</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-teal-600 h-1.5 rounded-full" style="width: ${trust_breakdown.certification}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-[11px] mb-0.5 text-slate-600">
                  <span>Vendor Reliability Score</span>
                  <span class="font-bold text-slate-700">${trust_breakdown.vendor_reliability}%</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${trust_breakdown.vendor_reliability}%"></div>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <button onclick="openQrPassportModal('${equipment.id}')" class="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center">
                <span>View Full QR Health Passport →</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Details, Pricing Calculator & Booking -->
        <div class="md:col-span-7 flex flex-col justify-between">
          <div>
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-xs font-bold text-teal-600 tracking-wider uppercase">${equipment.category}</span>
              <span class="text-slate-300">•</span>
              <span class="text-xs text-slate-500">${equipment.vendor_name} (${equipment.vendor_distance_km} km)</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900">${equipment.name}</h2>
            <p class="text-xs text-slate-600 mt-2 leading-relaxed">${equipment.full_desc}</p>
            
            <!-- Transparent Pricing Engine -->
            <div class="mt-5 p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Transparent Rental Calculator</span>
                <span class="text-[11px] font-semibold text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded-full">No Hidden Charges</span>
              </div>

              <!-- Rental Plan Selector -->
              <div class="grid grid-cols-3 gap-2 mb-4">
                <button type="button" onclick="selectPricingDuration('daily')" id="btn-calc-daily" class="calc-plan-btn p-2.5 rounded-xl border text-center transition-all bg-white border-slate-200 hover:border-teal-400">
                  <div class="text-[11px] text-slate-500">Daily</div>
                  <div class="text-sm font-bold text-slate-800">₹${equipment.daily_price.toLocaleString()}</div>
                  <div class="text-[10px] text-slate-400">per day</div>
                </button>
                <button type="button" onclick="selectPricingDuration('weekly')" id="btn-calc-weekly" class="calc-plan-btn p-2.5 rounded-xl border text-center transition-all bg-white border-slate-200 hover:border-teal-400">
                  <div class="text-[11px] text-slate-500">Weekly</div>
                  <div class="text-sm font-bold text-slate-800">₹${equipment.weekly_price.toLocaleString()}</div>
                  <div class="text-[10px] text-slate-400">7 days package</div>
                </button>
                <button type="button" onclick="selectPricingDuration('monthly')" id="btn-calc-monthly" class="calc-plan-btn p-2.5 rounded-xl border text-center transition-all bg-teal-600 text-white border-teal-600 shadow-sm font-semibold">
                  <div class="text-[11px] text-teal-100">Monthly (Best Value)</div>
                  <div class="text-sm font-bold text-white">₹${equipment.monthly_price.toLocaleString()}</div>
                  <div class="text-[10px] text-teal-100">30 days package</div>
                </button>
              </div>

              <!-- Line by Line Pricing Breakdown -->
              <div class="bg-white rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs">
                <div class="flex justify-between text-slate-600">
                  <span id="calc-rental-label">Base Equipment Rental (Monthly):</span>
                  <span class="font-bold text-slate-800" id="calc-rental-cost">₹${equipment.monthly_price.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Home Delivery & Safe Transport:</span>
                  <span class="font-bold text-slate-800">₹${equipment.delivery_fee.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Biomedical Technician Installation & Patient Demo:</span>
                  <span class="font-bold text-slate-800" id="calc-installation-cost">₹${equipment.installation_fee.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Return Pickup & Sanitization Transit:</span>
                  <span class="font-bold text-slate-800">₹${equipment.pickup_fee.toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                  <span class="flex items-center text-teal-700 font-semibold">
                    Refundable Security Deposit:
                    <span class="ml-1 text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">100% Refundable</span>
                  </span>
                  <span class="font-bold text-teal-700">₹${equipment.security_deposit.toLocaleString()}</span>
                </div>

                <div class="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                  <span class="font-bold text-slate-900">TOTAL PAYABLE TODAY:</span>
                  <span class="text-base font-extrabold text-teal-700" id="calc-total-payable">
                    ₹${(equipment.monthly_price + equipment.delivery_fee + equipment.installation_fee + equipment.pickup_fee + equipment.security_deposit).toLocaleString()}
                  </span>
                </div>
              </div>

              <div class="mt-2 text-[11px] text-slate-500 text-center">
                * Zero hidden fees. The ₹${equipment.security_deposit.toLocaleString()} deposit is refunded back to your bank account immediately upon return inspection.
              </div>
            </div>
          </div>

          <!-- Bottom CTA -->
          <div class="mt-5 pt-4 border-t border-slate-200 flex items-center space-x-3">
            <button type="button" onclick="closeEquipmentModal()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold">
              Back to Catalog
            </button>
            <button type="button" onclick="initiateBooking('${equipment.id}')" class="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm text-center">
              Proceed to Instant Booking →
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } catch (err) {
    console.error('Error opening equipment modal:', err);
  }
}

function selectPricingDuration(plan) {
  if (!state.selectedEquipment) return;
  const eq = state.selectedEquipment;

  document.querySelectorAll('.calc-plan-btn').forEach(btn => {
    btn.className = 'calc-plan-btn p-2.5 rounded-xl border text-center transition-all bg-white border-slate-200 hover:border-teal-400';
  });

  const activeBtn = document.getElementById(`btn-calc-${plan}`);
  if (activeBtn) {
    activeBtn.className = 'calc-plan-btn p-2.5 rounded-xl border text-center transition-all bg-teal-600 text-white border-teal-600 shadow-sm font-semibold';
  }

  let rentalCost = eq.monthly_price;
  let label = "Base Equipment Rental (Monthly):";
  if (plan === 'daily') {
    rentalCost = eq.daily_price;
    label = "Base Equipment Rental (1 Day):";
  } else if (plan === 'weekly') {
    rentalCost = eq.weekly_price;
    label = "Base Equipment Rental (7 Days):";
  }

  const delivery = eq.delivery_fee;
  const installation = eq.installation_fee;
  const pickup = eq.pickup_fee;
  const deposit = eq.security_deposit;
  const total = rentalCost + delivery + installation + pickup + deposit;

  document.getElementById('calc-rental-label').innerText = label;
  document.getElementById('calc-rental-cost').innerText = `₹${rentalCost.toLocaleString()}`;
  document.getElementById('calc-total-payable').innerText = `₹${total.toLocaleString()}`;
}

function closeEquipmentModal() {
  const modal = document.getElementById('equipment-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// ---------------- QR Equipment Health Passport Modal ----------------
async function openQrPassportModal(equipmentId) {
  try {
    const res = await fetch(`/api/equipment/${equipmentId}`);
    const json = await res.json();
    if (json.status !== 'success') return;

    const { equipment, health_passport, trust_breakdown } = json;

    const modal = document.getElementById('qr-passport-modal');
    const content = document.getElementById('qr-passport-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold font-mono">
              QR
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900">QR Equipment Health Passport</h3>
              <p class="text-xs text-slate-500">Real-time digital audit & sterilization credentials</p>
            </div>
          </div>
          <button onclick="closeQrPassportModal()" class="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          <div class="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
            <div class="p-3 bg-white rounded-xl shadow-sm border border-slate-200 mb-3">
              <svg class="w-36 h-36" viewBox="0 0 100 100" fill="currentColor">
                <rect x="5" y="5" width="30" height="30" rx="4" fill="#0F172A"/>
                <rect x="10" y="10" width="20" height="20" fill="white"/>
                <rect x="15" y="15" width="10" height="10" fill="#0D9488"/>

                <rect x="65" y="5" width="30" height="30" rx="4" fill="#0F172A"/>
                <rect x="70" y="10" width="20" height="20" fill="white"/>
                <rect x="75" y="15" width="10" height="10" fill="#0D9488"/>

                <rect x="5" y="65" width="30" height="30" rx="4" fill="#0F172A"/>
                <rect x="10" y="70" width="20" height="20" fill="white"/>
                <rect x="15" y="75" width="10" height="10" fill="#0D9488"/>

                <rect x="42" y="10" width="6" height="6" fill="#0F172A"/>
                <rect x="52" y="16" width="6" height="6" fill="#0F172A"/>
                <rect x="42" y="24" width="6" height="6" fill="#0D9488"/>
                <rect x="12" y="42" width="6" height="6" fill="#0F172A"/>
                <rect x="22" y="48" width="6" height="6" fill="#0D9488"/>
                <rect x="32" y="42" width="6" height="6" fill="#0F172A"/>
                <rect x="42" y="42" width="6" height="6" fill="#0F172A"/>
                <rect x="52" y="48" width="6" height="6" fill="#0F172A"/>
                <rect x="62" y="42" width="6" height="6" fill="#0D9488"/>
                <rect x="72" y="48" width="6" height="6" fill="#0F172A"/>
                <rect x="82" y="42" width="6" height="6" fill="#0F172A"/>
                <rect x="42" y="62" width="6" height="6" fill="#0D9488"/>
                <rect x="52" y="72" width="6" height="6" fill="#0F172A"/>
                <rect x="62" y="62" width="6" height="6" fill="#0F172A"/>
                <rect x="72" y="72" width="6" height="6" fill="#0D9488"/>
                <rect x="82" y="82" width="6" height="6" fill="#0F172A"/>
                <rect x="48" y="82" width="6" height="6" fill="#0F172A"/>
              </svg>
            </div>
            <span class="text-xs font-mono font-bold text-slate-800">${health_passport.equipment_id}</span>
            <span class="text-[10px] text-slate-400 mt-0.5">SN: ${health_passport.serial_number}</span>
            <div class="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span> Certified Ready for Rental
            </div>
          </div>

          <div class="md:col-span-8 space-y-3">
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-white rounded-xl border border-slate-200/80">
                <div class="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Equipment Name</div>
                <div class="font-bold text-slate-800 mt-0.5">${health_passport.name}</div>
              </div>
              <div class="p-3 bg-white rounded-xl border border-slate-200/80">
                <div class="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Condition Grade</div>
                <div class="font-bold text-emerald-700 mt-0.5">${health_passport.condition_grade}</div>
              </div>
              <div class="p-3 bg-white rounded-xl border border-slate-200/80">
                <div class="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Last Sanitization</div>
                <div class="font-bold text-slate-800 mt-0.5">${health_passport.last_sanitized}</div>
                <div class="text-[10px] text-emerald-600 font-medium">Hospital-Grade Disinfected</div>
              </div>
              <div class="p-3 bg-white rounded-xl border border-slate-200/80">
                <div class="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">14-Point Functional Test</div>
                <div class="font-bold text-slate-800 mt-0.5">${health_passport.last_functional_test}</div>
                <div class="text-[10px] text-teal-600 font-medium">Calibrated & Certified</div>
              </div>
              <div class="p-3 bg-white rounded-xl border border-slate-200/80">
                <div class="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Last Maintenance Audit</div>
                <div class="font-bold text-slate-800 mt-0.5">${health_passport.last_maintenance}</div>
                <div class="text-[10px] text-slate-500">Preventive Maintenance Logged</div>
              </div>
              <div class="p-3 bg-white rounded-xl border border-slate-200/80">
                <div class="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Prior Rental History</div>
                <div class="font-bold text-slate-800 mt-0.5">${health_passport.rental_history_count} Safe Patient Cycles</div>
                <div class="text-[10px] text-slate-500">Zero Safety Incident Record</div>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
              <span class="font-semibold">Compliance Certification:</span> ${health_passport.certification_status}
            </div>

            <div class="text-[11px] text-slate-400 italic">
              * ${health_passport.disclaimer}
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button onclick="closeQrPassportModal()" class="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all">
            Close Passport
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } catch (err) {
    console.error('Error opening QR Passport:', err);
  }
}

function closeQrPassportModal() {
  const modal = document.getElementById('qr-passport-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// ---------------- AI Care Assistant & Voice Interaction ----------------
function setupEventListeners() {
  const careForm = document.getElementById('care-form');
  if (careForm) {
    careForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('care-input');
      if (input && input.value.trim()) {
        submitCareQuery(input.value.trim());
      }
    });
  }

  const voiceBtn = document.getElementById('voice-mic-btn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', simulateVoiceInput);
  }
}

async function submitCareQuery(userPrompt) {
  const container = document.getElementById('care-twin-results');
  if (!container) return;

  container.innerHTML = `
    <div class="py-12 text-center text-slate-500">
      <div class="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-3"></div>
      <p class="font-semibold text-slate-700">AI Care Twin analyzing clinical situation & care timeline...</p>
      <p class="text-xs text-slate-400 mt-1">Extracting duration, functional mobility risks, and optimal bundle configuration.</p>
    </div>
  `;

  try {
    const res = await fetch('/api/ai/care-twin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userPrompt })
    });
    const json = await res.json();

    if (json.status === 'success') {
      renderCareTwinOutput(json.journey, json.bundle);
    }
  } catch (err) {
    console.error('Error in AI Care Twin:', err);
    container.innerHTML = `
      <div class="p-6 bg-red-50 text-red-700 rounded-xl text-center">
        Failed to generate care journey. Please try again.
      </div>
    `;
  }
}

function simulateVoiceInput() {
  const micBtn = document.getElementById('voice-mic-btn');
  const input = document.getElementById('care-input');
  
  if (micBtn) {
    micBtn.classList.add('animate-pulse', 'bg-red-500', 'text-white');
  }

  showToast('Voice Assistant Listening...', 'Speak now or simulated query will populate', 'info');

  setTimeout(() => {
    if (input) {
      input.value = "My father had hip surgery and needs home recovery for 45 days.";
    }
    if (micBtn) {
      micBtn.classList.remove('animate-pulse', 'bg-red-500', 'text-white');
    }
    showToast('Voice Transcribed', '"My father had hip surgery and needs home recovery for 45 days."', 'success');
    submitCareQuery(input.value);
  }, 1600);
}

function renderCareTwinOutput(journey, bundle) {
  const container = document.getElementById('care-twin-results');
  if (!container) return;

  const phasesHtml = journey.phases.map((p, idx) => `
    <div class="relative pl-6 pb-6 border-l-2 ${idx === journey.phases.length - 1 ? 'border-transparent' : 'border-teal-200'}">
      <div class="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
        ${idx + 1}
      </div>
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <h4 class="text-sm font-bold text-slate-900">${p.phase}</h4>
        <p class="text-xs text-slate-600 mt-0.5">${p.focus}</p>

        <div class="mt-3 pt-3 border-t border-slate-100">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Recommended Equipment in this phase:</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${p.equipment.map(eq => `
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div class="text-xs font-bold text-slate-800 hover:text-teal-700 cursor-pointer" onclick="openEquipmentModal('${eq.id}')">${eq.name}</div>
                  <div class="text-[11px] text-slate-500 mt-1">${eq.reason}</div>
                </div>
                <div class="mt-2 text-right">
                  <button onclick="openEquipmentModal('${eq.id}')" class="text-[10px] font-semibold text-teal-700 hover:underline">View Pricing & Specs →</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="mt-3 pt-2 text-[11px] text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
          <span class="font-bold text-amber-800">Care Reminders:</span>
          <ul class="list-disc list-inside mt-1 space-y-0.5 text-slate-700">
            ${p.care_actions.map(act => `<li>${act}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-sm mb-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30">
            ${journey.patient_type}
          </span>
          <h3 class="text-xl font-bold mt-2 text-white">${journey.condition_title}</h3>
          <p class="text-xs text-slate-300 mt-1">Generated care recovery timeline based on your recovery parameters.</p>
        </div>
        <div class="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
          <div class="text-xs text-slate-300">Estimated Duration</div>
          <div class="text-lg font-extrabold text-teal-300">${journey.estimated_duration_days} Days</div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-white/10 flex items-start space-x-2 text-[11px] text-teal-100">
        <span class="font-bold">⚠️ Medical Notice:</span>
        <span>${journey.disclaimer}</span>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="text-base font-bold text-slate-900 mb-4 flex items-center">
        <span class="w-2 h-2 rounded-full bg-teal-600 mr-2"></span> Step-by-Step Care Journey Timeline
      </h3>
      <div class="space-y-2">
        ${phasesHtml}
      </div>
    </div>

    <div class="bg-white p-6 rounded-3xl border-2 border-teal-500 shadow-md">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span class="text-xs font-bold text-teal-700 uppercase tracking-wider">USP 2 • AI Equipment Bundle Generator</span>
          <h3 class="text-lg font-bold text-slate-900 mt-0.5">${bundle.title}</h3>
          <p class="text-xs text-slate-500">${bundle.tagline}</p>
        </div>
        <div class="flex items-center space-x-2">
          <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Save ₹${bundle.savings_monthly.toLocaleString()} (${bundle.savings_pct}% OFF)
          </span>
        </div>
      </div>

      <div class="mt-4 space-y-2.5">
        ${bundle.items.map(item => `
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <h5 class="text-xs font-bold text-slate-900 hover:text-teal-700 cursor-pointer" onclick="openEquipmentModal('${item.id}')">${item.name}</h5>
                <span class="text-[10px] text-slate-400 font-mono">ID: ${item.id}</span>
              </div>
              <p class="text-[11px] text-slate-600 mt-1"><strong class="text-teal-700 font-semibold">Why Recommended?</strong> ${item.why}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-xs font-bold text-slate-800">₹${item.monthly_price.toLocaleString()}/mo</div>
              <div class="text-[10px] text-slate-400">Individual: ₹${item.daily_price}/day</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="mt-6 p-4 rounded-2xl bg-teal-50 border border-teal-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="text-xs text-slate-500 line-through">Individual Total: ₹${bundle.individual_total_monthly.toLocaleString()}/month</div>
          <div class="text-xl font-black text-teal-800">Bundle Price: ₹${bundle.bundle_price_monthly.toLocaleString()}<span class="text-xs font-medium text-slate-600"> /month</span></div>
          <div class="text-[11px] text-emerald-700 font-bold mt-0.5">Includes Free Expert Installation + 24/7 Biomedical Support</div>
        </div>
        <div class="flex items-center space-x-3">
          <button onclick="initiateBooking('${bundle.items[0].id}')" class="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm">
            Book Complete Bundle Now →
          </button>
        </div>
      </div>
    </div>
  `;
}

// ---------------- AI Bundle View Controller ----------------
async function loadBundle(bundleKey = 'post_surgery_bundle') {
  state.activeBundleKey = bundleKey;
  try {
    const res = await fetch(`/api/ai/bundle/${bundleKey}`);
    const json = await res.json();
    if (json.status === 'success') {
      renderBundlePage(json.bundle);
    }
  } catch (err) {
    console.error('Error loading bundle:', err);
  }
}

function renderBundlePage(bundle) {
  const container = document.getElementById('bundle-display-area');
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span class="text-xs font-bold text-teal-700 uppercase tracking-wider">Care Recovery Suite</span>
          <h3 class="text-xl font-bold text-slate-900 mt-1">${bundle.title}</h3>
          <p class="text-xs text-slate-500">${bundle.tagline}</p>
        </div>
        <div class="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Save ₹${bundle.savings_monthly.toLocaleString()} (${bundle.savings_pct}% OFF)
        </div>
      </div>

      <div class="mt-6 space-y-3">
        ${bundle.items.map(item => `
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full bg-teal-500"></span>
                <h4 class="text-sm font-bold text-slate-900 hover:text-teal-700 cursor-pointer" onclick="openEquipmentModal('${item.id}')">${item.name}</h4>
              </div>
              <p class="text-xs text-slate-600 mt-1.5 pl-4">
                <strong class="text-teal-800 font-semibold">Clinical Rationale:</strong> ${item.why}
              </p>
            </div>
            <div class="text-right flex-shrink-0 pl-4 border-l border-slate-200">
              <div class="text-sm font-bold text-slate-800">₹${item.monthly_price.toLocaleString()}/mo</div>
              <div class="text-xs text-slate-400">or ₹${item.daily_price}/day</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="mt-6 p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="text-xs text-slate-400 line-through">Individual Total: ₹${bundle.individual_total_monthly.toLocaleString()}/month</div>
          <div class="text-2xl font-black text-teal-300">₹${bundle.bundle_price_monthly.toLocaleString()} <span class="text-xs font-normal text-slate-300">/month</span></div>
          <div class="text-xs text-emerald-400 font-semibold">Estimated Monthly Savings: ₹${bundle.savings_monthly.toLocaleString()}</div>
        </div>
        <button onclick="initiateBooking('${bundle.items[0].id}')" class="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-md">
          Rent This AI Bundle →
        </button>
      </div>
    </div>
  `;
}

// ---------------- Multi-Product Comparison Matrix ----------------
function toggleCompare(equipmentId) {
  const idx = state.compareList.indexOf(equipmentId);
  if (idx > -1) {
    state.compareList.splice(idx, 1);
    showToast('Removed from Comparison', `Item removed. Total: ${state.compareList.length}`, 'info');
  } else {
    if (state.compareList.length >= 4) {
      showToast('Limit Reached', 'You can compare up to 4 items simultaneously.', 'warning');
      return;
    }
    state.compareList.push(equipmentId);
    showToast('Added to Comparison', `Item added. Total: ${state.compareList.length}`, 'success');
  }

  const pill = document.getElementById('compare-count-badge');
  if (pill) {
    pill.innerText = state.compareList.length;
    pill.style.display = state.compareList.length > 0 ? 'inline-flex' : 'none';
  }

  if (state.currentView === 'marketplace') {
    renderEquipmentGrid(state.equipmentList);
  }
}

async function renderCompareView() {
  const container = document.getElementById('compare-table-container');
  if (!container) return;

  if (state.compareList.length < 2) {
    state.compareList = ['HL-BED-2048', 'HL-BED-2049', 'HL-OXY-1024'];
  }

  const items = [];
  for (const id of state.compareList) {
    const res = await fetch(`/api/equipment/${id}`);
    const json = await res.json();
    if (json.status === 'success') items.push(json.equipment);
  }

  let bestValueId = items[0]?.id;
  let highestTrustId = items[0]?.id;
  let fastestId = items[0]?.id;

  let minPrice = Infinity;
  let maxTrust = -1;
  let minEta = Infinity;

  items.forEach(it => {
    if (it.monthly_price < minPrice) { minPrice = it.monthly_price; bestValueId = it.id; }
    if (it.trust_score > maxTrust) { maxTrust = it.trust_score; highestTrustId = it.id; }
    if (it.vendor_eta_mins < minEta) { minEta = it.vendor_eta_mins; fastestId = it.id; }
  });

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Feature / Metric</th>
            ${items.map(it => `
              <th class="p-4 text-center min-w-[220px]">
                <div class="text-xs text-teal-600 font-bold uppercase tracking-wider">${it.category}</div>
                <div class="font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">${it.name}</div>
                <div class="mt-2 flex flex-wrap justify-center gap-1">
                  ${it.id === bestValueId ? '<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800">BEST VALUE</span>' : ''}
                  ${it.id === highestTrustId ? '<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">HIGHEST TRUST</span>' : ''}
                  ${it.id === fastestId ? '<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">FASTEST ETA</span>' : ''}
                </div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-xs text-slate-700">
          <tr>
            <td class="p-4 font-bold text-slate-900 bg-slate-50/50">Daily Rental</td>
            ${items.map(it => `<td class="p-4 text-center font-bold text-slate-800">₹${it.daily_price.toLocaleString()}</td>`).join('')}
          </tr>
          <tr>
            <td class="p-4 font-bold text-slate-900 bg-slate-50/50">Weekly Rental</td>
            ${items.map(it => `<td class="p-4 text-center font-bold text-slate-800">₹${it.weekly_price.toLocaleString()}</td>`).join('')}
          </tr>
          <tr>
            <td class="p-4 font-bold text-slate-900 bg-slate-50/50">Monthly Rental</td>
            ${items.map(it => `<td class="p-4 text-center font-black text-teal-700 text-sm">₹${it.monthly_price.toLocaleString()}</td>`).join('')}
          </tr>
          <tr>
            <td class="p-4 font-bold text-slate-900 bg-slate-50/50">Equipment Trust Score</td>
            ${items.map(it => `
              <td class="p-4 text-center font-bold text-emerald-700">
                <span class="inline-block px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                  ★ ${it.trust_score}/100
                </span>
              </td>
            `).join('')}
          </tr>
          <tr>
            <td class="p-4 font-bold text-slate-900 bg-slate-50/50">Sanitization Status</td>
            ${items.map(it => `<td class="p-4 text-center text-slate-600">${it.last_sanitized} (${it.sanitization_score}%)</td>`).join('')}
          </tr>
          <tr>
            <td class="p-4 font-bold text-slate-900 bg-slate-50/50">Functional Test</td>
            ${items.map(it => `<td class="p-4 text-center text-slate-600">${it.last_functional_test}</td>`).join('')}
          </tr>
          <tr>
            <td class="p-4 font-bold text-slate-900 bg-slate-50/50">Vendor & Distance</td>
            ${items.map(it => `<td class="p-4 text-center text-slate-600">${it.vendor_name} (${it.vendor_distance_km} km)</td>`).join('')}
          </tr>
          <tr>
            <td class="p-4 font-bold text-slate-900 bg-slate-50/50">Delivery ETA</td>
            ${items.map(it => `<td class="p-4 text-center font-bold text-slate-800">${it.vendor_eta_mins} Minutes</td>`).join('')}
          </tr>
          <tr>
            <td class="p-4 font-bold text-slate-900 bg-slate-50/50">Security Deposit</td>
            ${items.map(it => `<td class="p-4 text-center text-slate-600">₹${it.security_deposit.toLocaleString()} (Refundable)</td>`).join('')}
          </tr>
          <tr class="bg-slate-50">
            <td class="p-4 font-bold text-slate-900">Direct Actions</td>
            ${items.map(it => `
              <td class="p-4 text-center">
                <button onclick="openEquipmentModal('${it.id}')" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm">
                  Rent This Now
                </button>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ---------------- Emergency Equipment Swarm ----------------
async function runEmergencySwarm() {
  const container = document.getElementById('emergency-swarm-results');
  if (!container) return;

  const eqType = document.getElementById('emergency-eq-select')?.value || 'Oxygen Concentrator';
  const location = document.getElementById('emergency-loc-input')?.value || 'Metro Central Zone';

  container.innerHTML = `
    <div class="py-8 text-center text-red-600">
      <div class="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-2"></div>
      <p class="text-xs font-bold uppercase tracking-wider">Swarm Engine Pinging Verified Vendors within 10 km...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/emergency/swarm?equipment_type=${encodeURIComponent(eqType)}&location=${encodeURIComponent(location)}`);
    const json = await res.json();

    if (json.status === 'success') {
      renderSwarmResults(json.swarm_vendors, json.disclaimer);
    }
  } catch (err) {
    console.error('Error running emergency swarm:', err);
  }
}

function renderSwarmResults(vendors, disclaimer) {
  const container = document.getElementById('emergency-swarm-results');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-3">
      ${vendors.map((v, idx) => `
        <div class="p-4 rounded-2xl border ${v.is_recommended_fastest ? 'bg-red-50/70 border-red-300 ring-2 ring-red-400/30' : 'bg-white border-slate-200'} flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start space-x-3">
            <div class="w-12 h-12 rounded-xl ${v.is_recommended_fastest ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'} flex items-center justify-center font-bold text-lg flex-shrink-0">
              ${v.eta_mins}m
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold text-slate-900">${v.vendor_name}</span>
                <span class="text-xs text-slate-400">• ${v.distance_km} km away</span>
                ${v.is_recommended_fastest ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white animate-pulse">RECOMMENDED FASTEST</span>' : ''}
              </div>
              <div class="text-xs text-slate-700 font-semibold mt-0.5">${v.equipment_name}</div>
              <div class="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                <span>Trust Score: <strong class="text-emerald-700">★ ${v.trust_score}/100</strong></span>
                <span>Vendor Rating: <strong>${v.vendor_rating}/5.0</strong></span>
                <span>Stock: <span class="text-emerald-600 font-medium">Verified Ready</span></span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between md:justify-end space-x-4 pt-2 md:pt-0 border-t md:border-t-0 border-red-100">
            <div class="text-right">
              <div class="text-base font-extrabold text-slate-900">₹${v.daily_price}/day</div>
              <div class="text-[10px] text-slate-500">Immediate Express Dispatch</div>
            </div>
            <button onclick="bookEmergencyVendor('${v.vendor_id}', '${v.vendor_name}', '${v.equipment_name}', ${v.eta_mins}, ${v.daily_price})" class="px-5 py-2.5 rounded-xl ${v.is_recommended_fastest ? 'bg-red-600 hover:bg-red-700 text-white font-bold' : 'bg-slate-900 hover:bg-slate-800 text-white font-semibold'} text-xs transition-all shadow-sm">
              Book Emergency Delivery
            </button>
          </div>
        </div>
      `).join('')}

      <div class="p-3 bg-red-100/50 border border-red-200 rounded-xl text-[11px] text-red-900 mt-4">
        <strong>Disclaimer:</strong> ${disclaimer}
      </div>
    </div>
  `;
}

async function bookEmergencyVendor(vendorId, vendorName, equipmentName, etaMins, dailyPrice) {
  try {
    const res = await fetch('/api/emergency/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipment_type: equipmentName,
        patient_name: "Emergency Priority Patient",
        patient_phone: "+91 98765 00000",
        location: "Metro Central Zone",
        urgency: "High Priority Emergency",
        vendor_id: vendorId,
        vendor_name: vendorName,
        eta_mins: etaMins,
        daily_price: dailyPrice
      })
    });
    const json = await res.json();
    if (json.status === 'success') {
      showToast('Emergency Swarm Dispatched!', json.message, 'error');
      openOrderTrackingModal(json.request_ref);
    }
  } catch (err) {
    console.error('Error booking emergency:', err);
  }
}

// ---------------- Rent vs Buy vs Rent-to-Own Calculator ----------------
async function runRentVsBuy() {
  const container = document.getElementById('rent-buy-results');
  if (!container) return;

  const durationDays = parseInt(document.getElementById('rent-buy-slider')?.value || '45');
  const durationDisplay = document.getElementById('rent-buy-duration-val');
  if (durationDisplay) durationDisplay.innerText = `${durationDays} Days`;

  const eqId = document.getElementById('rent-buy-eq-select')?.value || 'HL-BED-2048';

  try {
    const res = await fetch('/api/ai/rent-vs-buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipment_id: eqId, duration_days: durationDays })
    });
    const json = await res.json();
    if (json.status === 'success') {
      renderRentVsBuyOutput(json.calculation);
    }
  } catch (err) {
    console.error('Error in Rent vs Buy:', err);
  }
}

function renderRentVsBuyOutput(calc) {
  const container = document.getElementById('rent-buy-results');
  if (!container) return;

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="p-5 rounded-2xl border ${calc.best_option === 'RENT' ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-md' : 'bg-white border-slate-200'}">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-600">OPTION 1: RENT</span>
          ${calc.best_option === 'RENT' ? '<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-600 text-white">BEST ESTIMATED OPTION</span>' : ''}
        </div>
        <div class="text-2xl font-black text-slate-900">${calc.rent.label}</div>
        <div class="text-xs text-slate-500 mt-1">Total out of pocket for ${calc.duration_days} days</div>
        <div class="mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-600 space-y-1">
          <div>• Base Rental: ₹${calc.rent.rental_subtotal.toLocaleString()}</div>
          <div>• Delivery + Pickup: ₹${calc.rent.logistics_fee.toLocaleString()}</div>
          <div>• Free maintenance & return anytime</div>
        </div>
      </div>

      <div class="p-5 rounded-2xl border ${calc.best_option === 'BUY' ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-md' : 'bg-white border-slate-200'}">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-600">OPTION 2: BUY</span>
          ${calc.best_option === 'BUY' ? '<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-600 text-white">BEST ESTIMATED OPTION</span>' : ''}
        </div>
        <div class="text-2xl font-black text-slate-900">₹${calc.buy.retail_purchase_price.toLocaleString()}</div>
        <div class="text-xs text-slate-500 mt-1">Net Cost: ₹${calc.buy.net_out_of_pocket.toLocaleString()} (after est. resale)</div>
        <div class="mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-600 space-y-1">
          <div>• 100% equipment ownership</div>
          <div>• Buyer handles post-use disposal/resale</div>
          <div>• High initial capital requirement</div>
        </div>
      </div>

      <div class="p-5 rounded-2xl border ${calc.best_option === 'RENT-TO-OWN' ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-md' : 'bg-white border-slate-200'}">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-600">OPTION 3: RENT-TO-OWN</span>
          ${calc.best_option === 'RENT-TO-OWN' ? '<span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-600 text-white">BEST ESTIMATED OPTION</span>' : ''}
        </div>
        <div class="text-2xl font-black text-slate-900">${calc.rent_to_own.label}</div>
        <div class="text-xs text-slate-500 mt-1">Flexible buyout with rent credits</div>
        <div class="mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-600 space-y-1">
          <div>• 70% rental fee credited to buyout</div>
          <div>• Keep or return after recovery</div>
          <div>• Zero depreciation risk if returned early</div>
        </div>
      </div>
    </div>

    <div class="p-5 rounded-2xl bg-teal-50 border border-teal-200">
      <div class="flex items-center space-x-2 text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">
        <span>AI Financial Analysis & Verdict</span>
      </div>
      <p class="text-sm font-semibold text-slate-800 leading-relaxed">${calc.explanation}</p>
      <div class="mt-3 text-[11px] text-slate-500 italic">* ${calc.disclaimer}</div>
    </div>
  `;
}

// ---------------- Booking & Transparent Checkout ----------------
function initiateBooking(equipmentId) {
  closeEquipmentModal();
  const eq = state.equipmentList.find(e => e.id === equipmentId) || state.selectedEquipment;
  if (!eq) return;

  const modal = document.getElementById('booking-modal');
  const content = document.getElementById('booking-modal-content');
  if (!modal || !content) return;

  content.innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <span class="text-xs font-bold text-teal-600 uppercase tracking-wider">Transparent Checkout</span>
          <h3 class="text-lg font-bold text-slate-900">Rent: ${eq.name}</h3>
        </div>
        <button onclick="closeBookingModal()" class="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
      </div>

      <form id="booking-form" onsubmit="submitBookingForm(event, '${eq.id}')" class="mt-4 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Patient / Recipient Name</label>
            <input type="text" id="bk-patient-name" required value="Rajesh Kumar" class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Contact Mobile Number</label>
            <input type="tel" id="bk-patient-phone" required value="+91 98201 12345" class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Delivery Address & Landmark</label>
          <textarea id="bk-patient-address" required rows="2" class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">Flat 402, Sunrise Heights, 12th Cross, Metro Central</textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Rental Plan</label>
            <select id="bk-rental-type" onchange="recalcBookingSummary('${eq.id}')" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none">
              <option value="monthly" selected>Monthly (30 Days)</option>
              <option value="weekly">Weekly (7 Days)</option>
              <option value="daily">Daily (Custom)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Duration (Days)</label>
            <input type="number" id="bk-duration-days" min="1" max="180" value="30" onchange="recalcBookingSummary('${eq.id}')" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Delivery Slot</label>
            <select id="bk-delivery-slot" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none">
              <option>Express Today (Within 2 Hours)</option>
              <option>Morning (09:00 - 12:00)</option>
              <option>Evening (04:00 - 07:00)</option>
            </select>
          </div>
        </div>

        <div class="flex items-center space-x-6 py-2 border-y border-slate-100 text-xs">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" id="bk-install-toggle" checked onchange="recalcBookingSummary('${eq.id}')" class="rounded text-teal-600 focus:ring-teal-500">
            <span class="text-slate-700 font-medium">Biomedical Technician Setup & Demo (₹${eq.installation_fee})</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" id="bk-pickup-toggle" checked onchange="recalcBookingSummary('${eq.id}')" class="rounded text-teal-600 focus:ring-teal-500">
            <span class="text-slate-700 font-medium">Pre-booked Return Pickup (₹${eq.pickup_fee})</span>
          </label>
        </div>

        <div id="booking-cost-summary" class="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs space-y-1.5">
        </div>

        <div class="pt-3 flex items-center justify-end space-x-3">
          <button type="button" onclick="closeBookingModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" class="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all">
            Confirm & Reserve Equipment →
          </button>
        </div>
      </form>
    </div>
  `;

  recalcBookingSummary(eq.id);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function recalcBookingSummary(equipmentId) {
  const eq = state.equipmentList.find(e => e.id === equipmentId) || state.selectedEquipment;
  if (!eq) return;

  const plan = document.getElementById('bk-rental-type')?.value || 'monthly';
  const days = parseInt(document.getElementById('bk-duration-days')?.value || '30');
  const installReq = document.getElementById('bk-install-toggle')?.checked ?? true;
  const pickupReq = document.getElementById('bk-pickup-toggle')?.checked ?? true;

  let rentalCost = eq.monthly_price;
  if (plan === 'daily') rentalCost = eq.daily_price * days;
  else if (plan === 'weekly') rentalCost = eq.weekly_price * Math.ceil(days / 7);
  else rentalCost = eq.monthly_price * Math.ceil(days / 30);

  const delivery = eq.delivery_fee;
  const install = installReq ? eq.installation_fee : 0;
  const pickup = pickupReq ? eq.pickup_fee : 0;
  const deposit = eq.security_deposit;
  const total = rentalCost + delivery + install + pickup + deposit;

  const container = document.getElementById('booking-cost-summary');
  if (container) {
    container.innerHTML = `
      <div class="flex justify-between text-slate-600">
        <span>Equipment Rental (${days} Days):</span>
        <span class="font-bold text-slate-800">₹${rentalCost.toLocaleString()}</span>
      </div>
      <div class="flex justify-between text-slate-600">
        <span>Sanitized Delivery:</span>
        <span class="font-bold text-slate-800">₹${delivery.toLocaleString()}</span>
      </div>
      <div class="flex justify-between text-slate-600">
        <span>Technician Installation & Demo:</span>
        <span class="font-bold text-slate-800">₹${install.toLocaleString()}</span>
      </div>
      <div class="flex justify-between text-slate-600">
        <span>Return Pickup Logistics:</span>
        <span class="font-bold text-slate-800">₹${pickup.toLocaleString()}</span>
      </div>
      <div class="flex justify-between text-emerald-800 font-semibold pt-1 border-t border-teal-200">
        <span>100% Refundable Security Deposit:</span>
        <span class="font-bold">₹${deposit.toLocaleString()}</span>
      </div>
      <div class="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-teal-200">
        <span>TOTAL PAYABLE TODAY:</span>
        <span class="text-base font-extrabold text-teal-800">₹${total.toLocaleString()}</span>
      </div>
    `;
  }
}

async function submitBookingForm(e, equipmentId) {
  e.preventDefault();
  const patientName = document.getElementById('bk-patient-name').value;
  const patientPhone = document.getElementById('bk-patient-phone').value;
  const patientAddress = document.getElementById('bk-patient-address').value;
  const rentalType = document.getElementById('bk-rental-type').value;
  const durationDays = parseInt(document.getElementById('bk-duration-days').value);
  const deliverySlot = document.getElementById('bk-delivery-slot').value;
  const installReq = document.getElementById('bk-install-toggle').checked;
  const pickupReq = document.getElementById('bk-pickup-toggle').checked;

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_address: patientAddress,
        equipment_id: equipmentId,
        rental_type: rentalType,
        duration_days: durationDays,
        start_date: new Date().toISOString().split('T')[0],
        delivery_slot: deliverySlot,
        installation_required: installReq,
        pickup_required: pickupReq
      })
    });
    const json = await res.json();
    if (json.status === 'success') {
      closeBookingModal();
      showToast('Booking Confirmed!', `Booking Ref: ${json.booking_ref}. Launching live order tracking...`, 'success');
      state.activeTrackingRef = json.booking_ref;
      openOrderTrackingModal(json.booking_ref);
      loadFamilyDashboard();
    }
  } catch (err) {
    console.error('Error submitting booking:', err);
  }
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// ---------------- Order Tracking Timeline ----------------
async function openOrderTrackingModal(bookingRef = 'HL-BK-9403') {
  try {
    const res = await fetch(`/api/orders/${bookingRef}`);
    const json = await res.json();
    if (json.status !== 'success') return;

    const { order, stages, current_stage } = json;

    const modal = document.getElementById('tracking-modal');
    const content = document.getElementById('tracking-modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <span class="text-xs font-bold text-teal-600 uppercase tracking-wider">Live Equipment Dispatch Timeline</span>
            <h3 class="text-base font-bold text-slate-900">Order Ref: ${order.booking_ref}</h3>
            <p class="text-xs text-slate-500">${order.equipment_name} • ${order.patient_name}</p>
          </div>
          <button onclick="closeTrackingModal()" class="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div class="mt-6 space-y-4">
          ${stages.map(st => {
            const isDone = st.stage < current_stage;
            const isCurrent = st.stage === current_stage;
            return `
              <div class="flex items-start space-x-3">
                <div class="flex flex-col items-center">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? 'bg-emerald-600 text-white' : (isCurrent ? 'bg-teal-600 text-white ring-4 ring-teal-100 animate-pulse' : 'bg-slate-100 text-slate-400')}">
                    ${isDone ? '✓' : st.stage}
                  </div>
                  ${st.stage < stages.length ? `<div class="w-0.5 h-8 ${isDone ? 'bg-emerald-500' : 'bg-slate-200'}"></div>` : ''}
                </div>
                <div class="flex-1 pt-0.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold ${isCurrent ? 'text-teal-700' : (isDone ? 'text-slate-900' : 'text-slate-400')}">${st.title}</span>
                    ${isCurrent ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">CURRENT STATUS</span>' : ''}
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5">${st.desc}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <div class="text-[11px] text-slate-400 italic">
            Demo Tool: Advance stage to simulate live logistics progression
          </div>
          <div class="flex space-x-2">
            <button onclick="advanceTrackingStage('${order.booking_ref}')" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
              Advance Tracking Stage →
            </button>
            <button onclick="closeTrackingModal()" class="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } catch (err) {
    console.error('Error loading tracking modal:', err);
  }
}

async function advanceTrackingStage(bookingRef) {
  try {
    const res = await fetch(`/api/orders/${bookingRef}/advance-stage`, { method: 'POST' });
    const json = await res.json();
    if (json.status === 'success') {
      showToast('Stage Advanced', `Order is now at: ${json.stage_title}`, 'success');
      openOrderTrackingModal(bookingRef);
    }
  } catch (err) {
    console.error('Error advancing stage:', err);
  }
}

function closeTrackingModal() {
  const modal = document.getElementById('tracking-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// ---------------- Family Care Dashboard ----------------
async function loadFamilyDashboard() {
  const container = document.getElementById('family-dashboard-content');
  if (!container) return;

  try {
    const res = await fetch('/api/family');
    const json = await res.json();
    if (json.status !== 'success') return;

    const { patient, caregivers, active_rentals, care_schedule } = json;

    container.innerHTML = `
      <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-4">
          <div class="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-extrabold text-xl">
            👴
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-lg font-bold text-slate-900">${patient.name}</h3>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">${patient.relation}</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">Condition: <strong class="text-slate-700">${patient.condition}</strong> (Age ${patient.age})</div>
          </div>
        </div>

        <div class="flex items-center space-x-3 text-xs">
          ${caregivers.map(cg => `
            <div class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <span class="text-slate-400 font-medium">${cg.relation}:</span>
              <span class="font-bold text-slate-800 ml-1">${cg.name}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="mb-6">
        <h4 class="text-sm font-bold text-slate-900 mb-3 flex items-center">
          <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Active Medical Equipment Rentals (${active_rentals.length})
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${active_rentals.map(r => `
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-mono font-bold text-teal-700">${r.booking_ref}</span>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <span class="live-pulse mr-1"></span> Active in Room
                  </span>
                </div>
                <h5 class="text-sm font-bold text-slate-900">${r.equipment_name}</h5>
                <div class="text-xs text-slate-500 mt-1">Delivery: ${r.patient_address}</div>
                
                <div class="mt-4 p-3 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
                  <div>
                    <div class="text-[10px] uppercase font-bold text-teal-800">Rental Remaining</div>
                    <div class="text-lg font-black text-teal-900">${r.days_remaining} Days Remaining</div>
                    <div class="text-[10px] text-slate-500">Scheduled Expiry: ${r.expiry_date}</div>
                  </div>
                  <button onclick="openOrderTrackingModal('${r.booking_ref}')" class="px-3 py-1.5 bg-white border border-teal-200 text-teal-700 font-bold text-xs rounded-lg hover:bg-teal-100 transition-all">
                    Track / Status
                  </button>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button onclick="extendRental('${r.booking_ref}')" class="text-xs font-bold text-teal-700 hover:text-teal-800">
                  + Extend Rental Duration
                </button>
                <button onclick="scheduleReturn('${r.booking_ref}', '${r.equipment_name}')" class="text-xs font-semibold text-rose-600 hover:text-rose-700">
                  Schedule Free Pickup & Return
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <h4 class="text-sm font-bold text-slate-900 mb-3 flex items-center">
          <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Home Healthcare & Service Schedule
        </h4>
        <div class="divide-y divide-slate-100 text-xs">
          ${care_schedule.map(sc => `
            <div class="py-3 flex items-center justify-between">
              <div>
                <div class="font-bold text-slate-900">${sc.service}</div>
                <div class="text-slate-500 mt-0.5">${sc.provider} • <span class="text-teal-700 font-semibold">${sc.type}</span></div>
              </div>
              <div class="text-right">
                <div class="font-bold text-slate-800">${sc.date}</div>
                <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">${sc.badge}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error loading family dashboard:', err);
  }
}

function extendRental(bookingRef) {
  showToast('Rental Extended', `Added 15 additional recovery days to ${bookingRef}`, 'success');
  loadFamilyDashboard();
}

function scheduleReturn(bookingRef, eqName) {
  showToast('Return Scheduled', `HealLink technician dispatched for pickup & sanitization of ${eqName}`, 'info');
  switchView('return-reuse');
}

// ---------------- Return & Reuse Sanitization Pipeline ----------------
async function loadReturnReusePipeline() {
  const container = document.getElementById('return-reuse-content');
  if (!container) return;

  try {
    const res = await fetch('/api/return-inspections');
    const json = await res.json();
    if (json.status !== 'success') return;

    const { pipeline_stages, inspections } = json;

    container.innerHTML = `
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6">
        <h4 class="text-xs font-bold uppercase tracking-wider text-teal-700 mb-4">7-Stage Biomedical Decontamination & Re-use Protocol</h4>
        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
          ${pipeline_stages.map((st, i) => `
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div class="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[10px] mx-auto mb-1 flex items-center justify-center">${i + 1}</div>
              <div class="font-bold text-slate-800 text-[11px] leading-tight">${st.name}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="space-y-3">
        ${inspections.map(item => `
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-xs font-mono font-bold text-teal-700">${item.inspection_ref}</span>
                <span class="text-slate-300">•</span>
                <span class="text-xs text-slate-500">SN: ${item.serial_number}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${item.current_stage === 7 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                  ${item.status}
                </span>
              </div>
              <h5 class="text-sm font-bold text-slate-900 mt-1">${item.equipment_name}</h5>
              <div class="text-xs text-slate-600 mt-0.5">
                Current Stage: <strong class="text-teal-700">${item.stage_name}</strong> (Step ${item.current_stage} of 7)
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">Notes: ${item.notes} • Lead: ${item.technician_name}</div>
            </div>

            <div class="flex items-center space-x-3">
              ${item.current_stage < 7 ? `
                <button onclick="advanceInspection('${item.inspection_ref}')" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                  Advance to Next Stage →
                </button>
              ` : `
                <span class="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold">
                  ✓ Certified Ready for Next Patient
                </span>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Error loading return reuse pipeline:', err);
  }
}

async function advanceInspection(ref) {
  try {
    const res = await fetch(`/api/return-inspections/${ref}/advance`, { method: 'POST' });
    const json = await res.json();
    if (json.status === 'success') {
      showToast('Inspection Advanced', `${ref} moved to stage: ${json.stage_name}`, 'success');
      loadReturnReusePipeline();
    }
  } catch (err) {
    console.error('Error advancing inspection:', err);
  }
}

// ---------------- Vendor & Admin Dashboards ----------------
async function loadVendorDashboard() {
  const container = document.getElementById('vendor-inventory-table');
  if (!container) return;

  try {
    const res = await fetch('/api/vendor/inventory');
    const json = await res.json();
    if (json.status !== 'success') return;

    const { stats, inventory } = json;

    const stTotal = document.getElementById('vendor-stat-total');
    const stAvail = document.getElementById('vendor-stat-available');
    const stRent = document.getElementById('vendor-stat-rented');
    const stMaint = document.getElementById('vendor-stat-maintenance');

    if (stTotal) stTotal.innerText = stats.total_units;
    if (stAvail) stAvail.innerText = stats.in_stock;
    if (stRent) stRent.innerText = stats.rented;
    if (stMaint) stMaint.innerText = stats.maintenance;

    container.innerHTML = inventory.map(item => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
        <td class="p-3 font-bold text-slate-900">${item.name}</td>
        <td class="p-3 font-mono text-slate-500">${item.serial_number}</td>
        <td class="p-3 font-semibold text-slate-700">${item.category}</td>
        <td class="p-3 font-bold text-slate-800">₹${item.daily_price}/d • ₹${item.monthly_price}/m</td>
        <td class="p-3 text-emerald-700 font-bold">★ ${item.trust_score}/100</td>
        <td class="p-3">
          <select onchange="updateItemStatus('${item.id}', this.value)" class="px-2.5 py-1 rounded-lg border text-xs font-semibold ${item.availability === 'In Stock' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : (item.availability === 'Rented' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-amber-50 border-amber-200 text-amber-800')}">
            <option value="In Stock" ${item.availability === 'In Stock' ? 'selected' : ''}>In Stock</option>
            <option value="Rented" ${item.availability === 'Rented' ? 'selected' : ''}>Rented</option>
            <option value="Maintenance" ${item.availability === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
          </select>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading vendor dashboard:', err);
  }
}

async function updateItemStatus(equipmentId, newStatus) {
  try {
    await fetch(`/api/vendor/equipment/${equipmentId}/status?status=${encodeURIComponent(newStatus)}`, { method: 'POST' });
    showToast('Status Updated', `Equipment ${equipmentId} marked as ${newStatus}`, 'success');
    loadVendorDashboard();
  } catch (err) {
    console.error('Error updating status:', err);
  }
}

async function loadAdminDashboard() {
  try {
    const res = await fetch('/api/admin/metrics');
    const json = await res.json();
    if (json.status !== 'success') return;

    const m = json.metrics;
    const p = document.getElementById('admin-stat-patients');
    const v = document.getElementById('admin-stat-vendors');
    const e = document.getElementById('admin-stat-equipment');
    const r = document.getElementById('admin-stat-rentals');
    const rev = document.getElementById('admin-stat-revenue');
    const emg = document.getElementById('admin-stat-emergencies');

    if (p) p.innerText = m.total_patients;
    if (v) v.innerText = m.total_vendors;
    if (e) e.innerText = m.total_equipment;
    if (r) r.innerText = m.active_rentals;
    if (rev) rev.innerText = m.monthly_revenue;
    if (emg) emg.innerText = m.emergency_requests;
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
  }
}

// ---------------- Toast Notifications ----------------
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-900 border-emerald-600' : (type === 'error' ? 'bg-rose-900 border-rose-600' : (type === 'warning' ? 'bg-amber-900 border-amber-600' : 'bg-slate-900 border-slate-700'));
  toast.className = `${bg} text-white px-4 py-3 rounded-2xl shadow-xl border text-xs max-w-sm transition-all duration-300 transform translate-y-2 opacity-0`;
  toast.innerHTML = `
    <div class="font-bold">${title}</div>
    <div class="text-[11px] text-slate-200 mt-0.5">${message}</div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 50);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
