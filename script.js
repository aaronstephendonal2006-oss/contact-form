/* ============================================================
   CONTACT FORM — JAVASCRIPT
   Handles: cursor-reactive background, validation, submission
   ============================================================ */

// ─── DOM REFERENCES ───────────────────────────────────────────
const canvas       = document.getElementById('bg-canvas');
const ctx          = canvas.getContext('2d');
const form         = document.getElementById('contact-form');
const submitBtn    = document.getElementById('submit-btn');
const successMsg   = document.getElementById('success-message');
const sendAnother  = document.getElementById('send-another-btn');

// Field references
const fields = {
  fullName: {
    input: document.getElementById('full-name'),
    error: document.getElementById('full-name-error'),
  },
  email: {
    input: document.getElementById('email'),
    error: document.getElementById('email-error'),
  },
  phone: {
    input: document.getElementById('phone'),
    error: document.getElementById('phone-error'),
  },
  message: {
    input: document.getElementById('message'),
    error: document.getElementById('message-error'),
  },
};

// ═══════════════════════════════════════════════════════════════
// SECTION 1: CURSOR-REACTIVE ANIMATED BACKGROUND
// ═══════════════════════════════════════════════════════════════

/** Mouse position (defaults to center of screen) */
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

/** Track mouse movement */
document.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

/** Resize canvas to fill viewport */
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/** Floating orb class — drifts toward cursor with spring-like motion */
class Orb {
  constructor(color, radius, speed) {
    this.x      = Math.random() * canvas.width;
    this.y      = Math.random() * canvas.height;
    this.vx     = (Math.random() - 0.5) * 0.5;
    this.vy     = (Math.random() - 0.5) * 0.5;
    this.color  = color;
    this.radius = radius;
    this.speed  = speed;
  }

  update() {
    // Gently attract toward the mouse
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    this.vx += dx * this.speed * 0.00004;
    this.vy += dy * this.speed * 0.00004;

    // Damping
    this.vx *= 0.985;
    this.vy *= 0.985;

    this.x += this.vx;
    this.y += this.vy;

    // Soft wrap around edges
    if (this.x < -this.radius) this.x = canvas.width + this.radius;
    if (this.x > canvas.width + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = canvas.height + this.radius;
    if (this.y > canvas.height + this.radius) this.y = -this.radius;
  }

  draw() {
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

/** Create a set of orbs with varied colors */
const orbColors = [
  'rgba(124,  92, 252, 0.18)',  // Purple
  'rgba(167, 139, 250, 0.14)',  // Light purple
  'rgba( 52, 211, 153, 0.10)',  // Green
  'rgba( 56, 189, 248, 0.12)',  // Cyan
  'rgba(251, 146, 60,  0.08)',  // Orange
];

const orbs = orbColors.map((color, i) => {
  const radius = 200 + Math.random() * 250;
  const speed  = 0.6 + Math.random() * 1.4;
  return new Orb(color, radius, speed);
});

/** Animation loop */
function animateBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  orbs.forEach((orb) => {
    orb.update();
    orb.draw();
  });
  requestAnimationFrame(animateBackground);
}

// Respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  animateBackground();
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Validate the Full Name field.
 * Rules: non-empty, at least 2 characters.
 * @returns {string} Error message, or empty string if valid.
 */
function validateName(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Full name is required.';
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  return '';
}

/**
 * Validate the Email field.
 * Uses a standard email regex pattern.
 * @returns {string} Error message, or empty string if valid.
 */
function validateEmail(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Email address is required.';
  // Standard email pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'Please enter a valid email address.';
  return '';
}

/**
 * Validate the Phone field (Philippine format).
 * Accepts: 09XXXXXXXXX, +639XXXXXXXXX, or with spaces/dashes.
 * @returns {string} Error message, or empty string if valid.
 */
function validatePhone(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Phone number is required.';

  // Strip all non-digit characters except leading +
  const digitsOnly = trimmed.replace(/[\s\-\.()]/g, '');

  // Match Philippine mobile: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX (13 chars)
  const phMobileLocal    = /^09\d{9}$/;          // 09XX XXX XXXX
  const phMobileIntl     = /^\+639\d{9}$/;       // +63 9XX XXX XXXX
  // Match Philippine landline: 0X(X) XXXX XXXX or +63 X(X) XXXX XXXX
  const phLandlineLocal  = /^0[2-8]\d{7,9}$/;    // e.g. 028XXXXXXX
  const phLandlineIntl   = /^\+63[2-8]\d{7,9}$/; // e.g. +6328XXXXXXX

  const isValid =
    phMobileLocal.test(digitsOnly) ||
    phMobileIntl.test(digitsOnly) ||
    phLandlineLocal.test(digitsOnly) ||
    phLandlineIntl.test(digitsOnly);

  if (!isValid) return 'Enter a valid PH number (e.g. 09XX XXX XXXX or +63 9XX XXX XXXX).';
  return '';
}

/**
 * Validate the Message field.
 * Rules: non-empty, at least 10 characters.
 * @returns {string} Error message, or empty string if valid.
 */
function validateMessage(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'Message is required.';
  if (trimmed.length < 10) return 'Message must be at least 10 characters.';
  return '';
}

/** Map field keys to their validator functions */
const validators = {
  fullName: validateName,
  email:    validateEmail,
  phone:    validatePhone,
  message:  validateMessage,
};

// ═══════════════════════════════════════════════════════════════
// SECTION 3: UI HELPERS — SHOW/CLEAR ERRORS
// ═══════════════════════════════════════════════════════════════

/**
 * Display an error for a specific field.
 * Adds the .has-error class and sets the error text.
 */
function showError(fieldKey, message) {
  const { input, error } = fields[fieldKey];
  const group = input.closest('.form-group');
  group.classList.add('has-error');
  group.classList.remove('is-valid');
  error.textContent = message;
  input.setAttribute('aria-invalid', 'true');
}

/**
 * Clear the error for a specific field and mark it valid.
 */
function clearError(fieldKey) {
  const { input, error } = fields[fieldKey];
  const group = input.closest('.form-group');
  group.classList.remove('has-error');
  error.textContent = '';
  input.removeAttribute('aria-invalid');

  // Only show valid state if user has typed something
  if (input.value.trim().length > 0) {
    group.classList.add('is-valid');
  } else {
    group.classList.remove('is-valid');
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: REAL-TIME VALIDATION (on input events)
// ═══════════════════════════════════════════════════════════════

Object.keys(fields).forEach((key) => {
  const { input } = fields[key];
  const validate = validators[key];

  // Validate as the user types (after initial blur)
  let touched = false;

  input.addEventListener('blur', () => {
    touched = true;
    const err = validate(input.value);
    if (err) showError(key, err);
    else clearError(key);
  });

  input.addEventListener('input', () => {
    if (!touched) return; // Don't nag before user has left the field
    const err = validate(input.value);
    if (err) showError(key, err);
    else clearError(key);
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 5: FORM SUBMISSION
// ═══════════════════════════════════════════════════════════════

form.addEventListener('submit', (e) => {
  e.preventDefault();

  let isValid = true;
  let firstInvalidField = null;

  // Validate every field
  Object.keys(fields).forEach((key) => {
    const { input } = fields[key];
    const errorMsg = validators[key](input.value);

    if (errorMsg) {
      showError(key, errorMsg);
      isValid = false;
      if (!firstInvalidField) firstInvalidField = input;
    } else {
      clearError(key);
    }
  });

  // If invalid, focus the first errored field
  if (!isValid) {
    firstInvalidField.focus();
    return;
  }

  // --- Simulate submission with a brief loading state ---
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  setTimeout(() => {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;

    // Hide the form, show the success message
    form.hidden = true;
    successMsg.hidden = false;

    // Reset internal state
    form.reset();
    Object.keys(fields).forEach((key) => {
      const group = fields[key].input.closest('.form-group');
      group.classList.remove('has-error', 'is-valid');
      fields[key].error.textContent = '';
      fields[key].input.removeAttribute('aria-invalid');
    });
  }, 1200);
});

// ═══════════════════════════════════════════════════════════════
// SECTION 6: "SEND ANOTHER MESSAGE" BUTTON
// ═══════════════════════════════════════════════════════════════

sendAnother.addEventListener('click', () => {
  successMsg.hidden = true;
  form.hidden = false;
  // Re-animate the card
  const card = document.querySelector('.form-card');
  card.style.animation = 'none';
  // Trigger reflow to restart animation
  void card.offsetHeight;
  card.style.animation = '';
  // Focus the first field for convenience
  fields.fullName.input.focus();
});
