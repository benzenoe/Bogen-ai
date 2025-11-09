// Bogen.ai Common JavaScript Functions

// API base URL
const API_BASE = window.location.origin + '/api';

/**
 * Make API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'success') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add styles
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '8px',
    background: type === 'success' ? '#4CAF50' : type === 'error' ? '#D32F2F' : '#1B365D',
    color: 'white',
    fontWeight: '500',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    zIndex: '9999',
    animation: 'slideIn 0.3s ease',
  });

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

/**
 * Form validation helper
 */
function validateForm(formElement) {
  const inputs = formElement.querySelectorAll('[required]');
  let isValid = true;

  inputs.forEach((input) => {
    const errorElement = input.parentElement.querySelector('.form-error');

    if (!input.value.trim()) {
      isValid = false;
      input.style.borderColor = '#D32F2F';

      if (!errorElement) {
        const error = document.createElement('div');
        error.className = 'form-error';
        error.textContent = 'This field is required';
        input.parentElement.appendChild(error);
      }
    } else {
      input.style.borderColor = '';
      if (errorElement) errorElement.remove();
    }
  });

  return isValid;
}

/**
 * Email validation
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Smooth scroll to element
 */
function smoothScrollTo(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!', 'success');
  } catch (error) {
    showNotification('Failed to copy', 'error');
  }
}

/**
 * Get referral code from URL
 */
function getReferralCode() {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}

/**
 * Track referral code in cookie
 */
function trackReferral() {
  const ref = getReferralCode();
  if (ref) {
    // Cookie is set by server, but we can show a notification
    console.log('Referral code detected:', ref);
  }
}

/**
 * Mobile menu toggle
 */
function initMobileMenu() {
  const header = document.querySelector('.header');
  if (!header) return;

  // Create mobile menu toggle button
  const toggle = document.createElement('button');
  toggle.className = 'mobile-menu-toggle';
  toggle.innerHTML = '☰';
  toggle.style.cssText = `
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--navy);
    cursor: pointer;
    padding: 8px;
  `;

  const nav = document.querySelector('.nav-menu');
  if (nav) {
    const navContainer = nav.parentElement;
    navContainer.insertBefore(toggle, nav);

    toggle.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });

    // Show toggle on mobile
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    function handleMobile(e) {
      if (e.matches) {
        toggle.style.display = 'block';
        nav.style.cssText = `
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          flex-direction: column;
          padding: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          display: none;
        `;
        nav.classList.remove('mobile-open');
      } else {
        toggle.style.display = 'none';
        nav.style = '';
      }
    }

    mediaQuery.addListener(handleMobile);
    handleMobile(mediaQuery);

    // Add mobile-open style
    const mobileStyle = document.createElement('style');
    mobileStyle.textContent = `
      .nav-menu.mobile-open {
        display: flex !important;
      }
    `;
    document.head.appendChild(mobileStyle);
  }
}

/**
 * Initialize common functionality
 */
document.addEventListener('DOMContentLoaded', () => {
  // Track referral if present
  trackReferral();

  // Initialize mobile menu
  initMobileMenu();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        smoothScrollTo(href.substring(1));
      }
    });
  });
});

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
  const navMenu = document.querySelector('.nav-menu');
  if (navMenu) {
    navMenu.classList.toggle('mobile-active');
  }
}

/**
 * Export functions for use in other scripts
 */
window.bogenAI = {
  apiRequest,
  showNotification,
  validateForm,
  isValidEmail,
  formatCurrency,
  formatDate,
  smoothScrollTo,
  copyToClipboard,
  getReferralCode,
  toggleMobileMenu,
};
