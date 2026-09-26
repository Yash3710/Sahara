import { requireAuth, apiRequest } from './supabaseClient.js';

const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

// Elements
const addBtn = document.getElementById('add-reminder-btn');
const formContainer = document.getElementById('reminder-form-container');
const form = document.getElementById('reminder-form');
const formTitle = document.getElementById('form-title');
const formId = document.getElementById('form-id');
const formType = document.getElementById('form-type');
const formTitleInput = document.getElementById('form-title-input');
const formDoctor = document.getElementById('form-doctor');
const formDatetime = document.getElementById('form-datetime');
const formNotes = document.getElementById('form-notes');
const formSubmitBtn = document.getElementById('form-submit-btn');
const formCancelBtn = document.getElementById('form-cancel-btn');
const doctorField = document.getElementById('doctor-field');
const titleLabel = document.getElementById('title-label');
const remindersList = document.getElementById('reminders-list');
const appointmentsList = document.getElementById('appointments-list');
const typeButtons = document.querySelectorAll('.type-btn');

let currentType = 'reminder';

// Type toggle
typeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentType = btn.dataset.type;
    formType.value = currentType;
    typeButtons.forEach(b => {
      b.classList.remove('border-green-600', 'bg-green-50', 'text-green-700', 'border-blue-600', 'bg-blue-50', 'text-blue-700');
      b.classList.add('border-gray-200', 'bg-white', 'text-gray-600');
    });
    const activeColor = currentType === 'reminder' ? 'green' : 'blue';
    btn.classList.remove('border-gray-200', 'bg-white', 'text-gray-600');
    btn.classList.add(`border-${activeColor}-600`, `bg-${activeColor}-50`, `text-${activeColor}-700`);
    
    doctorField.classList.toggle('hidden', currentType !== 'appointment');
    titleLabel.textContent = currentType === 'appointment' ? 'What is this appointment for?' : 'What is this reminder for?';
    formTitleInput.placeholder = currentType === 'appointment' ? 'e.g., Regular checkup' : 'e.g., Take blood pressure medicine';
  });
});

// Show/hide form
function showForm(editData = null) {
  formContainer.classList.remove('hidden');
  if (editData) {
    formTitle.textContent = currentType === 'appointment' ? 'Edit Appointment' : 'Edit Reminder';
    formId.value = editData.id;
    formTitleInput.value = editData.title || editData.doctor_name || '';
    formDatetime.value = formatDatetimeLocal(editData.remind_at || editData.appointment_at);
    formNotes.value = editData.notes || editData.description || '';
    if (editData.doctor_name) formDoctor.value = editData.doctor_name;
    formSubmitBtn.textContent = 'Save Changes';
  } else {
    formTitle.textContent = currentType === 'appointment' ? 'Add New Appointment' : 'Add New Reminder';
    formId.value = '';
    form.reset();
    formSubmitBtn.textContent = currentType === 'appointment' ? 'Save Appointment' : 'Save Reminder';
  }
  window.scrollTo({ top: formContainer.offsetTop - 20, behavior: 'smooth' });
}

function hideForm() {
  formContainer.classList.add('hidden');
  form.reset();
  formId.value = '';
}

function formatDatetimeLocal(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

addBtn.addEventListener('click', () => showForm());
formCancelBtn.addEventListener('click', hideForm);

// Form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formSubmitBtn.disabled = true;
  formSubmitBtn.innerHTML = '<span class="spinner"></span> Saving...';

  const id = formId.value;
  const type = formType.value;

  try {
    if (type === 'appointment') {
      const body = {
        doctor_name: formDoctor.value || formTitleInput.value,
        specialization: formTitleInput.value,
        appointment_at: new Date(formDatetime.value).toISOString(),
        notes: formNotes.value,
      };
      if (id) {
        await apiRequest(`/api/reminders/appointments/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiRequest('/api/reminders/appointments', { method: 'POST', body: JSON.stringify(body) });
      }
    } else {
      const body = {
        title: formTitleInput.value,
        remind_at: new Date(formDatetime.value).toISOString(),
        description: formNotes.value,
        type: 'general',
      };
      if (id) {
        await apiRequest(`/api/reminders/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiRequest('/api/reminders', { method: 'POST', body: JSON.stringify(body) });
      }
    }

    hideForm();
    loadData();
  } catch (err) {
    alert(err.message || 'Could not save. Please try again.');
  } finally {
    formSubmitBtn.disabled = false;
    formSubmitBtn.textContent = id ? 'Save Changes' : (type === 'appointment' ? 'Save Appointment' : 'Save Reminder');
  }
});

// Delete
async function deleteItem(type, id) {
  if (!confirm('Are you sure you want to remove this?')) return;
  try {
    const endpoint = type === 'appointment' ? `/api/reminders/appointments/${id}` : `/api/reminders/${id}`;
    await apiRequest(endpoint, { method: 'DELETE' });
    loadData();
  } catch (err) {
    alert(err.message || 'Could not delete. Please try again.');
  }
}

// Edit
function editItem(type, data) {
  // Switch type
  currentType = type;
  formType.value = type;
  typeButtons.forEach(btn => {
    btn.classList.remove('border-green-600', 'bg-green-50', 'text-green-700', 'border-blue-600', 'bg-blue-50', 'text-blue-700');
    btn.classList.add('border-gray-200', 'bg-white', 'text-gray-600');
    if (btn.dataset.type === type) {
      const color = type === 'reminder' ? 'green' : 'blue';
      btn.classList.remove('border-gray-200', 'bg-white', 'text-gray-600');
      btn.classList.add(`border-${color}-600`, `bg-${color}-50`, `text-${color}-700`);
    }
  });
  doctorField.classList.toggle('hidden', type !== 'appointment');
  showForm(data);
}

// Render list
function renderReminders(reminders) {
  if (!reminders || reminders.length === 0) {
    remindersList.innerHTML = '<p class="text-base text-gray-600 py-4">No reminders yet. Add one above!</p>';
    return;
  }
  remindersList.innerHTML = reminders.map(rem => {
    const time = new Date(rem.remind_at).toLocaleString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
    });
    return `
      <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <i data-lucide="bell" class="text-amber-600 w-6 h-6"></i>
          </div>
          <div>
            <p class="text-lg font-semibold text-gray-800">${rem.title || 'Reminder'}</p>
            <p class="text-base text-gray-600">${time}</p>
            ${rem.description ? `<p class="text-sm text-gray-500 mt-0.5">${rem.description}</p>` : ''}
          </div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button onclick="window.__editReminder('${rem.id}')" class="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition" aria-label="Edit">
            <i data-lucide="pencil" class="w-5 h-5"></i>
          </button>
          <button onclick="window.__deleteReminder('${rem.id}')" class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" aria-label="Delete">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

function renderAppointments(appointments) {
  if (!appointments || appointments.length === 0) {
    appointmentsList.innerHTML = '<p class="text-base text-gray-600 py-4">No appointments scheduled.</p>';
    return;
  }
  appointmentsList.innerHTML = appointments.map(apt => {
    const time = new Date(apt.appointment_at).toLocaleString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
    });
    return `
      <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <i data-lucide="stethoscope" class="text-blue-600 w-6 h-6"></i>
          </div>
          <div>
            <p class="text-lg font-semibold text-gray-800">${apt.doctor_name || 'Appointment'}</p>
            <p class="text-base text-gray-600">${time}</p>
            ${apt.location ? `<p class="text-sm text-gray-500 mt-0.5">${apt.location}</p>` : ''}
          </div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button onclick="window.__editAppointment('${apt.id}')" class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" aria-label="Edit">
            <i data-lucide="pencil" class="w-5 h-5"></i>
          </button>
          <button onclick="window.__deleteAppointment('${apt.id}')" class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" aria-label="Delete">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

// Store data for edit handlers
let allReminders = [];
let allAppointments = [];

// Global handlers for inline onclick
window.__editReminder = (id) => {
  const rem = allReminders.find(r => r.id === id);
  if (rem) editItem('reminder', rem);
};
window.__deleteReminder = (id) => deleteItem('reminder', id);
window.__editAppointment = (id) => {
  const apt = allAppointments.find(a => a.id === id);
  if (apt) editItem('appointment', apt);
};
window.__deleteAppointment = (id) => deleteItem('appointment', id);

// Load data
async function loadData() {
  try {
    const data = await apiRequest('/api/reminders');
    allReminders = data.data?.reminders || [];
    allAppointments = data.data?.appointments || [];
    renderReminders(allReminders);
    renderAppointments(allAppointments);
  } catch (err) {
    remindersList.innerHTML = '<p class="text-base text-red-600 py-4">Could not load reminders. Please refresh the page.</p>';
    appointmentsList.innerHTML = '';
  }
}

loadData();
