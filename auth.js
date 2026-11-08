/* Autentikasi dua akses: OPAC publik dan area petugas. */
(() => {
  'use strict';
  const config = window.FPIK_SUPABASE_CONFIG || {};
  const ready = Boolean(config.url && config.anonKey && window.supabase);
  const modal = document.getElementById('login-screen');
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const submit = document.getElementById('login-submit');
  const loginButton = document.getElementById('login-button');
  const closeButton = document.getElementById('close-login');
  const logoutButton = document.getElementById('logout-button');
  const staffPages = ['dashboard', 'books', 'circulation', 'import'];

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }
  function openLogin() {
    errorBox.classList.add('hidden');
    modal.classList.remove('hidden');
    document.getElementById('login-email').focus();
  }
  function closeLogin() { modal.classList.add('hidden'); }
  function setBusy(busy) {
    submit.disabled = busy;
    submit.innerHTML = busy ? 'Memeriksa akun...' : '<i class="fa-solid fa-right-to-bracket mr-2"></i>Masuk';
  }
  function applyAccess(profile, email) {
    const role = profile?.role || 'public';
    const staff = ['administrator', 'petugas'].includes(role);
    document.getElementById('signed-in-user').textContent = staff
      ? `${profile.full_name || email} • ${role}`
      : role === 'anggota' ? `${profile.full_name || email} • anggota` : 'Pengunjung umum • Akses katalog publik';
    loginButton.classList.toggle('hidden', Boolean(profile));
    logoutButton.classList.toggle('hidden', !profile);
    document.querySelectorAll('[data-staff-only]').forEach(button => {
      button.classList.toggle('hidden', !staff);
    });
    window.FPIK_CURRENT_USER = profile ? { id: profile.id, email, role } : null;
    if (!staff && window.FPIK_SHOW_PAGE) window.FPIK_SHOW_PAGE('opac');
  }

  async function start() {
    // Aplikasi tetap menampilkan OPAC walaupun Supabase/Auth sedang tidak tersedia.
    if (!ready) {
      applyAccess(null, null);
      window.FPIK_AUTH_READY = Promise.resolve(false);
      return;
    }
    const client = window.supabase.createClient(config.url, config.anonKey);
    window.FPIK_SUPABASE = client;

    async function loadProfile(user) {
      const { data, error } = await client.from('profiles')
        .select('id, full_name, role, is_active').eq('id', user.id).maybeSingle();
      if (error || !data || !data.is_active) {
        await client.auth.signOut();
        applyAccess(null, null);
        showError('Profil akun tidak ditemukan atau akun dinonaktifkan. Hubungi administrator perpustakaan.');
        openLogin();
        return;
      }
      if (!['administrator', 'petugas', 'anggota'].includes(data.role)) {
        await client.auth.signOut();
        applyAccess(null, null);
        showError('Peran akun tidak dikenali. Hubungi administrator perpustakaan.');
        openLogin();
        return;
      }
      applyAccess(data, user.email);
      closeLogin();
      if (data.role === 'anggota' && window.FPIK_SHOW_PAGE) window.FPIK_SHOW_PAGE('opac');
    }

    loginButton.addEventListener('click', openLogin);
    closeButton.addEventListener('click', closeLogin);
    modal.addEventListener('click', event => { if (event.target === modal) closeLogin(); });
    form.addEventListener('submit', async event => {
      event.preventDefault(); errorBox.classList.add('hidden'); setBusy(true);
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { showError('Login gagal. Periksa email dan password.'); return; }
      await loadProfile(data.user);
    });
    logoutButton.addEventListener('click', async () => {
      await client.auth.signOut();
      window.FPIK_CURRENT_USER = null;
      applyAccess(null, null);
      form.reset(); closeLogin();
      if (window.FPIK_SHOW_PAGE) window.FPIK_SHOW_PAGE('opac');
    });

    const { data: { session } } = await client.auth.getSession();
    if (session?.user) await loadProfile(session.user);
    else applyAccess(null, null);
    client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        applyAccess(null, null);
        if (window.FPIK_SHOW_PAGE) window.FPIK_SHOW_PAGE('opac');
      }
    });
    window.FPIK_AUTH_READY = Promise.resolve(true);
  }
  window.FPIK_OPEN_LOGIN = openLogin;
  start().catch(error => {
    console.error(error); applyAccess(null, null);
    window.FPIK_AUTH_READY = Promise.resolve(false);
  });
})();
