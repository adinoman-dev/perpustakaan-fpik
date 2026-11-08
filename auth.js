/* Autentikasi Supabase untuk Perpustakaan FPIK.
   Peran disimpan di tabel public.profiles dan dibatasi lagi dengan RLS di database. */
(() => {
  'use strict';
  const config = window.FPIK_SUPABASE_CONFIG || {};
  const ready = config.url && config.anonKey &&
    !config.url.includes('PROJECT-REF') && !config.anonKey.includes('ISI_DENGAN');

  const loginScreen = document.getElementById('login-screen');
  const appShell = document.getElementById('app-shell');
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const submit = document.getElementById('login-submit');
  const logout = document.getElementById('logout-button');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }
  function setBusy(busy) {
    submit.disabled = busy;
    submit.innerHTML = busy ? 'Memeriksa akun...' : '<i class="fa-solid fa-right-to-bracket mr-2"></i>Masuk';
  }
  function setVisible(signedIn) {
    loginScreen.classList.toggle('hidden', signedIn);
    appShell.classList.toggle('hidden', !signedIn);
  }
  function applyRole(role, email) {
    const normalized = ['administrator', 'petugas', 'anggota'].includes(role) ? role : 'anggota';
    document.getElementById('signed-in-user').textContent = `${email} • ${normalized}`;
    const allowed = {
      administrator: ['opac', 'dashboard', 'books', 'circulation', 'import'],
      petugas: ['opac', 'dashboard', 'books', 'circulation', 'import'],
      anggota: ['opac']
    }[normalized];

    document.querySelectorAll('[data-page]').forEach(button => {
      const page = button.dataset.page;
      button.classList.toggle('hidden', !allowed.includes(page));
    });
    document.querySelectorAll('.page').forEach(section => {
      const page = section.id.replace('page-', '');
      section.classList.toggle('hidden', !allowed.includes(page));
    });

    // Anggota hanya boleh melihat OPAC; kontrol mutasi disembunyikan untuk anggota.
    if (normalized === 'anggota') {
      document.querySelectorAll('#page-books form, #page-circulation form, #page-import form').forEach(node => node.classList.add('hidden'));
    }
    window.FPIK_CURRENT_USER = { email, role: normalized };
  }

  async function start() {
    if (!ready || !window.supabase) {
      showError('Konfigurasi Supabase belum diisi. Administrator perlu menyalin config.js.example menjadi config.js dan memasukkan Project URL serta anon/public key.');
      setVisible(false);
      return;
    }
    const client = window.supabase.createClient(config.url, config.anonKey);
    window.FPIK_SUPABASE = client;

    async function loadProfile(user) {
      const { data, error } = await client.from('profiles')
        .select('full_name, role, is_active')
        .eq('id', user.id).single();
      if (error || !data || !data.is_active) {
        await client.auth.signOut();
        setVisible(false);
        showError('Profil akun tidak ditemukan atau akun dinonaktifkan. Hubungi administrator perpustakaan.');
        return;
      }
      errorBox.classList.add('hidden');
      applyRole(data.role, data.full_name || user.email);
      setVisible(true);
      if (data.role === 'anggota') {
        document.querySelector('[data-page="opac"]')?.click();
      }
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      errorBox.classList.add('hidden');
      setBusy(true);
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        showError('Login gagal. Periksa email dan password, atau hubungi administrator.');
        return;
      }
      await loadProfile(data.user);
    });

    logout.addEventListener('click', async () => {
      await client.auth.signOut();
      window.FPIK_CURRENT_USER = null;
      setVisible(false);
      form.reset();
    });

    const { data: { session } } = await client.auth.getSession();
    if (session?.user) await loadProfile(session.user);
    else setVisible(false);

    client.auth.onAuthStateChange(async (event, sessionNow) => {
      if (event === 'SIGNED_OUT') setVisible(false);
    });
  }

  start().catch(error => {
    console.error(error);
    setVisible(false);
    showError('Tidak dapat menghubungkan layanan login. Periksa koneksi internet dan konfigurasi Supabase.');
  });
})();
