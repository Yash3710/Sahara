import { supabase } from './supabaseClient.js';

const form = document.getElementById('register-form');
const submitBtn = document.getElementById('submit-btn');
const errorDiv = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const successDiv = document.getElementById('success-message');
const successText = document.getElementById('success-text');

function showError(msg) {
  errorDiv.classList.remove('hidden');
  successDiv.classList.add('hidden');
  errorText.textContent = msg;
}

function showSuccess(msg) {
  successDiv.classList.remove('hidden');
  errorDiv.classList.add('hidden');
  successText.textContent = msg;
}

function hideMessages() {
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  if (loading) {
    submitBtn.innerHTML = '<span class="spinner"></span> Creating account...';
  } else {
    submitBtn.innerHTML = 'Create Account <i data-lucide="arrow-right" class="w-5 h-5"></i>';
    if (window.lucide) lucide.createIcons();
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  // Validate passwords match
  if (password !== confirmPassword) {
    showError('The passwords you entered do not match. Please try again.');
    return;
  }

  if (password.length < 6) {
    showError('Your password must be at least 6 characters long.');
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      // Map to friendly messages
      if (error.message.toLowerCase().includes('already registered')) {
        showError('This email is already registered. Please log in instead.');
      } else if (error.message.toLowerCase().includes('valid email')) {
        showError('Please enter a valid email address.');
      } else {
        showError('Something went wrong. Please try again.');
      }
      return;
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      // Email confirmation required
      showSuccess('Account created! Please check your email and click the verification link to get started.');
      form.classList.add('hidden');
    } else if (data.session) {
      // Auto-confirmed, redirect to dashboard
      window.location.href = '/dashboard.html';
    }
  } catch (err) {
    showError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
});
