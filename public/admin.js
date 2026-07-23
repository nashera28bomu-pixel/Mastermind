(function () {
  const TOKEN_KEY = 'mm_admin_token';

  function getToken() { return sessionStorage.getItem(TOKEN_KEY); }
  function setToken(t) { sessionStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { sessionStorage.removeItem(TOKEN_KEY); }

  function showLogin() {
    document.getElementById('login-view').hidden = false;
    document.getElementById('dashboard-view').hidden = true;
    document.getElementById('logout-btn').hidden = true;
  }

  function showDashboard() {
    document.getElementById('login-view').hidden = true;
    document.getElementById('dashboard-view').hidden = false;
    document.getElementById('logout-btn').hidden = false;
  }

  async function login(username, password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data.token;
  }

  async function fetchEntries() {
    const res = await fetch('/api/admin/entries', {
      headers: { Authorization: 'Bearer ' + getToken() }
    });
    if (res.status === 401) {
      clearToken();
      showLogin();
      throw new Error('Session expired, please log in again');
    }
    return res.json();
  }

  async function fetchSlots() {
    const res = await fetch('/api/slots');
    return res.json();
  }

  async function deleteEntry(id) {
    const res = await fetch('/api/admin/entries/' + id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + getToken() }
    });
    return res.json();
  }

  function renderEntries(entries) {
    const body = document.getElementById('entries-body');
    const empty = document.getElementById('empty-state');
    body.innerHTML = '';

    if (!entries.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    entries.forEach(e => {
      const tr = document.createElement('tr');
      const date = new Date(e.createdAt).toLocaleString();
      const whatsapp = e.whatsappSameNumber ? 'Same number' : (e.whatsappNumber || 'Different — not given');
      const course = e.course === 'Other' ? (e.otherCourse || 'Other') : e.course;
      const traits = (e.mentorTraits || []).join(', ') || '—';
      tr.innerHTML = `
        <td>${escapeHtml(e.fullName)}</td>
        <td>${escapeHtml(e.email || '—')}</td>
        <td>${escapeHtml(e.phone)}</td>
        <td>${escapeHtml(whatsapp)}</td>
        <td>${escapeHtml(e.university)}</td>
        <td>${escapeHtml(course)}</td>
        <td>${escapeHtml(e.yearOfStudy)}</td>
        <td>${escapeHtml(e.countyOfOrigin)}</td>
        <td>${escapeHtml(e.highschool)}</td>
        <td>${escapeHtml(e.anxiety)}</td>
        <td>${escapeHtml(traits)}</td>
        <td>${escapeHtml(e.mentorGender || '—')}</td>
        <td>${date}</td>
        <td><button class="delete-btn" data-id="${e._id}">Remove</button></td>
      `;
      body.appendChild(tr);
    });

    body.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this registrant?')) return;
        await deleteEntry(btn.dataset.id);
        refreshDashboard();
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function refreshDashboard() {
    try {
      const [entriesData, slotsData] = await Promise.all([fetchEntries(), fetchSlots()]);
      document.getElementById('stat-count').textContent = entriesData.count;
      document.getElementById('stat-remaining').textContent = slotsData.remaining;
      renderEntries(entriesData.entries);
    } catch (err) {
      console.error(err);
    }
  }

  async function exportCsv() {
    const btn = document.getElementById('export-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Exporting…';

    try {
      const res = await fetch('/api/admin/entries/csv', {
        headers: { Authorization: 'Bearer ' + getToken() }
      });

      if (res.status === 401) {
        clearToken();
        showLogin();
        return;
      }
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registrants.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Could not export CSV. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginStatus = document.getElementById('login-status');
    const logoutBtn = document.getElementById('logout-btn');

    if (getToken()) {
      showDashboard();
      refreshDashboard();
    } else {
      showLogin();
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginStatus.textContent = '';
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      try {
        const token = await login(username, password);
        setToken(token);
        showDashboard();
        refreshDashboard();
      } catch (err) {
        loginStatus.textContent = err.message;
        loginStatus.className = 'form-status error';
      }
    });

    logoutBtn.addEventListener('click', () => {
      clearToken();
      showLogin();
    });

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportCsv);
  });
})();
