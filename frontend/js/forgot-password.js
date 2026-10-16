import { supabase } from './supabaseClient.js';

const form      = document.getElementById('forgot-form');
const submitBtn = document.getElementById('submit-btn');
const errorDiv  = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const successDiv  = document.getElementById('success-message');
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

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.innerHTML = loading
    ? '<span class="spinner"></span> Sending…'
    : 'Send Reset Link <i data-lucide="send" style="width:18px;height:18px;"></i>';
  if (!loading && window.lucide) lucide.createIcons();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();

  if (!email) {
    showError('Please enter your email address.');
    return;
  }

  setLoading(true);

  try {
    const redirectTo = `${window.location.origin}/login.html`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      showError('We could not send a reset link. Please check the email address and try again.');
    } else {
      // Always show success to avoid leaking whether an email is registered
      showSuccess(
        'If that email is registered, you will receive a password reset link shortly. Check your inbox.'
      );
      form.classList.add('hidden');
    }
  } catch (err) {
    showError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
});
