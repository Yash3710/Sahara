import { supabase } from './supabaseClient.js';

const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const submitBtn = document.getElementById('submit-btn');

function showError(msg) {
  errorMsg.classList.remove('hidden');
  errorText.innerText = msg;
}

function hideError() {
  errorMsg.classList.add('hidden');
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  if (loading) {
    submitBtn.innerHTML = '<span class="spinner"></span> Signing in...';
  } else {
    submitBtn.innerHTML = 'Sign In <i data-lucide="arrow-right" class="w-5 h-5 ml-1"></i>';
    if (window.lucide) lucide.createIcons();
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;
    
    hideError();
    setLoading(true);

    // Demo mode - skip Supabase auth
    if (email === 'demo@sahara.com' && password === 'demo123') {
      localStorage.setItem('demo_session', JSON.stringify({ email, timestamp: Date.now() }));
      window.location.href = '/dashboard.html';
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let friendlyMessage = 'Something went wrong. Please try again.';
        const errLower = error.message.toLowerCase();
        if (errLower.includes('invalid login credentials')) {
          friendlyMessage = 'The email or password you entered is incorrect. Please try again.';
        } else if (errLower.includes('email not confirmed')) {
          friendlyMessage = 'Please check your email and click the verification link we sent you.';
        }
        showError(friendlyMessage);
      } else {
        window.location.href = '/dashboard.html';
      }
    } catch (err) {
      showError('Something went wrong. Please try again.');
    } finally {
      if (!errorMsg.classList.contains('hidden')) {
        setLoading(false);
      }
    }
  });
}
