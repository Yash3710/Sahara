import { requireAuth, apiRequest } from './supabaseClient.js';

const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

// Elements
const viewMode = document.getElementById('view-mode');
const editMode = document.getElementById('edit-mode');
const editBtn = document.getElementById('edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const profileForm = document.getElementById('profile-form');
const saveBtn = document.getElementById('save-btn');
const successBanner = document.getElementById('success-banner');
const errorBanner = document.getElementById('error-banner');
const errorBannerText = document.getElementById('error-banner-text');
const copyToast = document.getElementById('copy-toast');

const personalFields = document.getElementById('personal-fields');
const idFields = document.getElementById('id-fields');
const medicalFields = document.getElementById('medical-fields');
const insuranceFields = document.getElementById('insurance-fields');

let profileData = {};

const fieldLabels = {
  full_name: 'Full Name',
  date_of_birth: 'Date of Birth',
  phone: 'Phone',
  alternate_phone: 'Alternate Phone',
  address: 'Address',
  city: 'City',
  state: 'State',
  pincode: 'PIN Code',
  blood_group: 'Blood Group',
  aadhaar_number: 'Aadhaar Number',
  pan_number: 'PAN Number',
  insurance_provider: 'Insurance Provider',
  insurance_policy_number: 'Policy Number',
  allergies: 'Allergies',
  medical_conditions: 'Medical Conditions',
};

// Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    copyToast.classList.remove('opacity-0', 'pointer-events-none');
    copyToast.classList.add('opacity-100');
    setTimeout(() => {
      copyToast.classList.remove('opacity-100');
      copyToast.classList.add('opacity-0', 'pointer-events-none');
    }, 1500);
  } catch {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
}

window.__copyField = (text) => copyToClipboard(text);

// Render a copyable field row
function renderField(label, value) {
  if (!value) {
    return `
      <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <span class="text-base text-gray-500">${label}</span>
        <span class="text-base text-gray-400 italic">Not set</span>
      </div>
    `;
  }
  const escaped = value.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  return `
    <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-green-50 rounded-lg px-3 -mx-3 transition" onclick="window.__copyField('${escaped}')" title="Tap to copy">
      <div>
        <span class="text-sm text-gray-500 block">${label}</span>
        <span class="text-lg font-medium text-gray-800">${value}</span>
      </div>
      <i data-lucide="copy" class="w-5 h-5 text-gray-400 shrink-0"></i>
    </div>
  `;
}

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

// Render view mode
function renderProfile() {
  const d = profileData;

  personalFields.innerHTML = [
    renderField('Full Name', d.full_name),
    renderField('Date of Birth', formatDate(d.date_of_birth)),
    renderField('Phone', d.phone),
    renderField('Alternate Phone', d.alternate_phone),
    renderField('Address', d.address),
    renderField('City', d.city),
    renderField('State', d.state),
    renderField('PIN Code', d.pincode),
  ].join('');

  idFields.innerHTML = [
    renderField('Aadhaar Number', d.aadhaar_number),
    renderField('PAN Number', d.pan_number),
  ].join('');

  medicalFields.innerHTML = [
    renderField('Blood Group', d.blood_group),
    renderField('Allergies', d.allergies),
    renderField('Medical Conditions', d.medical_conditions),
  ].join('');

  insuranceFields.innerHTML = [
    renderField('Insurance Provider', d.insurance_provider),
    renderField('Policy Number', d.insurance_policy_number),
  ].join('');

  if (window.lucide) lucide.createIcons();
}

// Populate edit form
function populateForm() {
  const fields = Object.keys(fieldLabels);
  fields.forEach(key => {
    const el = document.getElementById(`pf-${key}`);
    if (el && profileData[key]) {
      el.value = profileData[key];
    }
  });
}

// Toggle modes
editBtn.addEventListener('click', () => {
  populateForm();
  viewMode.classList.add('hidden');
  editMode.classList.remove('hidden');
  successBanner.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

cancelEditBtn.addEventListener('click', () => {
  editMode.classList.add('hidden');
  viewMode.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Save profile
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
  successBanner.classList.add('hidden');
  errorBanner.classList.add('hidden');

  const data = {};
  const fields = Object.keys(fieldLabels);
  fields.forEach(key => {
    const el = document.getElementById(`pf-${key}`);
    if (el) {
      data[key] = el.value.trim() || null;
    }
  });

  try {
    await apiRequest('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    profileData = { ...profileData, ...data };
    renderProfile();
    editMode.classList.add('hidden');
    viewMode.classList.remove('hidden');
    successBanner.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => successBanner.classList.add('hidden'), 4000);
  } catch (err) {
    errorBanner.classList.remove('hidden');
    errorBannerText.textContent = err.message || 'Could not save your profile. Please try again.';
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i> Save Profile';
    if (window.lucide) lucide.createIcons();
  }
});

// Load profile
async function loadProfile() {
  try {
    const data = await apiRequest('/api/profile');
    profileData = data.data || {};
    renderProfile();
  } catch {
    personalFields.innerHTML = '<p class="text-base text-gray-600">Could not load profile. Please refresh.</p>';
    idFields.innerHTML = '';
    medicalFields.innerHTML = '';
    insuranceFields.innerHTML = '';
  }
}

loadProfile();
