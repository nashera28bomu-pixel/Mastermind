(function () {
  let whatsappLink = '';
  let contactNumber = '0743 756698';
  let totalSlots = 200;

  async function loadConfig() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      whatsappLink = data.whatsappLink || '';
      contactNumber = data.contactNumber || contactNumber;
      totalSlots = data.totalSlots || 200;
      applyContactInfo();
    } catch (err) {
      console.error('Could not load config', err);
    }
  }

  function applyContactInfo() {
    const digits = contactNumber.replace(/\D/g, '');
    const waNumber = digits.startsWith('0') ? '254' + digits.slice(1) : digits;

    const contactNumberEl = document.getElementById('contact-number');
    if (contactNumberEl) contactNumberEl.textContent = contactNumber;

    const contactWhatsappEl = document.getElementById('contact-whatsapp');
    if (contactWhatsappEl) contactWhatsappEl.href = 'https://wa.me/' + waNumber;

    const footerNumberEl = document.getElementById('footer-number');
    if (footerNumberEl) footerNumberEl.textContent = contactNumber;
  }

  async function loadSlots() {
    try {
      const res = await fetch('/api/slots');
      const data = await res.json();
      renderSlots(data.filled, data.total, data.remaining);
    } catch (err) {
      console.error('Could not load slot count', err);
    }
  }

  function renderSlots(filled, total, remaining) {
    const remainingEl = document.getElementById('slots-remaining');
    const filledEl = document.getElementById('slots-filled');
    const fillEl = document.getElementById('slots-fill');
    if (!remainingEl) return;

    remainingEl.textContent = remaining;
    filledEl.textContent = `${filled} filled`;
    const pct = total > 0 ? Math.min((filled / total) * 100, 100) : 0;
    fillEl.style.width = pct + '%';

    if (remaining <= 0) {
      const submitBtn = document.getElementById('submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'All slots filled';
      }
    }
  }

  function setStatus(message, type) {
    const el = document.getElementById('form-status');
    if (!el) return;
    el.textContent = message;
    el.className = 'form-status' + (type ? ' ' + type : '');
  }

  function setupConditionalFields(form) {
    // Show/hide "different WhatsApp number" field
    const whatsappRadios = form.querySelectorAll('input[name="whatsappSameNumber"]');
    const whatsappNumberField = document.getElementById('whatsapp-number-field');
    whatsappRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const showField = form.whatsappSameNumber.value === 'no';
        whatsappNumberField.hidden = !showField;
      });
    });

    // Show/hide "specify other course" field
    const courseSelect = document.getElementById('course');
    const otherCourseField = document.getElementById('other-course-field');
    courseSelect.addEventListener('change', () => {
      otherCourseField.hidden = courseSelect.value !== 'Other';
    });

    // Limit mentor traits to 3
    const traitCheckboxes = form.querySelectorAll('input[name="mentorTraits"]');
    const traitsStatus = document.getElementById('traits-status');
    traitCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = Array.from(traitCheckboxes).filter(c => c.checked);
        if (checked.length > 3) {
          cb.checked = false;
          traitsStatus.textContent = 'You can pick up to 3 traits only.';
          traitsStatus.className = 'form-status error';
        } else {
          traitsStatus.textContent = '';
          traitsStatus.className = 'form-status';
        }
      });
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById('submit-btn');

    const mentorTraits = Array.from(form.querySelectorAll('input[name="mentorTraits"]:checked')).map(c => c.value);
    const whatsappSameNumber = form.whatsappSameNumber.value === 'yes';

    const payload = {
      email: form.email.value.trim(),
      fullName: form.fullName.value.trim(),
      phone: form.phone.value.trim(),
      whatsappSameNumber,
      whatsappNumber: whatsappSameNumber ? '' : form.whatsappNumber.value.trim(),
      university: form.university.value.trim(),
      course: form.course.value,
      otherCourse: form.course.value === 'Other' ? form.otherCourse.value.trim() : '',
      countyOfOrigin: form.countyOfOrigin.value.trim(),
      yearOfStudy: form.yearOfStudy.value,
      highschool: form.highschool.value.trim(),
      anxiety: form.anxiety.value.trim(),
      mentorTraits,
      mentorGender: form.mentorGender.value
    };

    if (!payload.email || !payload.fullName || !payload.phone || !payload.university ||
        !payload.course || !payload.countyOfOrigin || !payload.yearOfStudy ||
        !payload.highschool || !payload.anxiety) {
      setStatus('Please fill in all required fields.', 'error');
      return;
    }
    if (mentorTraits.length === 0) {
      setStatus('Please pick at least one preferred mentor trait.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering…';
    setStatus('', '');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || 'Something went wrong. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register & join WhatsApp';
        return;
      }

      setStatus('You\'re in! Redirecting you to the WhatsApp community…', 'success');
      const link = data.whatsappLink || whatsappLink;
      setTimeout(() => {
        if (link) window.location.href = link;
      }, 1200);

      loadSlots();
    } catch (err) {
      console.error(err);
      setStatus('Network error. Please check your connection and try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Register & join WhatsApp';
    }
  }

  function setupScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(el => io.observe(el));
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    loadSlots();
    setupScrollReveal();
    const form = document.getElementById('register-form');
    if (form) {
      setupConditionalFields(form);
      form.addEventListener('submit', handleSubmit);
    }
  });
})();
