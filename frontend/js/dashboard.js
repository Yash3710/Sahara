import { supabase, requireAuth, logout, apiRequest } from './supabaseClient.js';

// Protect this page
const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

// Set user email
const emailEl = document.getElementById('user-email');
if (emailEl && session.user?.email) {
  emailEl.textContent = session.user.email;
}

// Logout button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

// Load next appointment
async function loadNextAppointment() {
  const container = document.getElementById('appointment-content');
  try {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('appointment_at', new Date().toISOString())
      .order('appointment_at', { ascending: true })
      .limit(1);

    if (data && data.length > 0) {
      const apt = data[0];
      const date = new Date(apt.appointment_at);
      const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
      
      container.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <i data-lucide="stethoscope" class="text-green-600"></i>
          </div>
          <div>
            <p class="text-lg font-semibold text-gray-800">${apt.doctor_name || 'Doctor Visit'}</p>
            <p class="text-base text-gray-600 mt-0.5">${dateStr} · ${timeStr}</p>
            ${apt.location ? `<p class="text-sm text-gray-500 mt-0.5">${apt.location}</p>` : ''}
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <p class="text-base text-gray-600">No upcoming appointments.</p>
        <a href="/reminders.html" class="text-green-700 font-semibold text-base hover:underline mt-2 inline-block">+ Add an appointment</a>
      `;
    }
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    container.innerHTML = '<p class="text-base text-gray-600">Could not load appointments.</p>';
  }
}

// Load today's reminders
async function loadTodayReminders() {
  const container = document.getElementById('reminders-list');
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // Fetch reminders
    const { data: reminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('remind_at', startOfDay)
      .lte('remind_at', endOfDay)
      .order('remind_at', { ascending: true });

    // Fetch medicines
    const { data: medicines } = await supabase
      .from('medicines')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('time_to_take', { ascending: true });

    const items = [];

    if (medicines && medicines.length > 0) {
      medicines.forEach(med => {
        items.push({
          title: med.name,
          subtitle: `${med.dosage || ''} · ${med.time_to_take || 'As needed'}`,
          icon: 'pill',
          color: 'blue',
        });
      });
    }

    if (reminders && reminders.length > 0) {
      reminders.forEach(rem => {
        const time = new Date(rem.remind_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
        items.push({
          title: rem.title || 'Reminder',
          subtitle: time,
          icon: 'bell',
          color: 'amber',
        });
      });
    }

    if (items.length === 0) {
      container.innerHTML = `
        <p class="text-base text-gray-600 py-4">No reminders for today. Enjoy your day! 😊</p>
      `;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="flex items-center gap-4 py-3 ${items.indexOf(item) < items.length - 1 ? 'border-b border-gray-100' : ''}">
        <div class="w-10 h-10 rounded-full bg-${item.color}-50 flex items-center justify-center shrink-0">
          <i data-lucide="${item.icon}" class="text-${item.color}-600 w-5 h-5"></i>
        </div>
        <div>
          <p class="text-base font-semibold text-gray-800">${item.title}</p>
          <p class="text-sm text-gray-600">${item.subtitle}</p>
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    container.innerHTML = '<p class="text-base text-gray-600">Could not load reminders.</p>';
  }
}

// Load all data
loadNextAppointment();
loadTodayReminders();
