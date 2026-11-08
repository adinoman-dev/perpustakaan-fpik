# Sistem Informasi Perpustakaan FPIK Universitas Khairun

## Isi paket
- `index.html`: antarmuka dan halaman login.
- `auth.js`: login/logout Supabase Auth dan pembacaan peran dari `public.profiles`.
- `config.js`: Project URL dan Publishable Key proyek Supabase Anda.
- `app.js`: katalog, data buku, transaksi, dan import CSV versi demo.
- `supabase-schema.sql`: rancangan skema awal untuk referensi.
- `contoh-data-buku-perpustakaan-fpik.csv`: contoh data buku (jika disertakan).

## Status integrasi (penting)
Login/logout sudah diarahkan ke Supabase Auth. Sesudah login, aplikasi membaca profil dan peran `administrator`, `petugas`, atau `anggota`.

Namun, operasi katalog, data buku, peminjaman, pengembalian, denda, dan import CSV pada `app.js` masih menggunakan `localStorage` browser. Itu berarti data belum tersimpan sebagai data bersama di Supabase dan belum tersinkron antarperangkat. Integrasi database untuk bagian tersebut menjadi tahap berikutnya.

## Jangan jalankan ulang SQL secara membabi buta
Anda sudah membuat tabel `profiles`, `books`, `loans`, `returns`, dan `fines` di proyek Supabase. Struktur kolom tabel yang ada perlu diperiksa dahulu sebelum menjalankan perubahan skema. File `supabase-schema.sql` disertakan sebagai dokumentasi awal, bukan instruksi untuk dijalankan ulang sekarang.

## Konfigurasi
`config.js` berisi Project URL dan Publishable Key. Publishable Key boleh digunakan di browser. Jangan pernah memasukkan `service_role` key, Secret Key, atau password database ke file frontend/repository.

RLS (Row Level Security) harus aktif dan kebijakannya harus membatasi akses data sesuai peran. Menyembunyikan menu pada tampilan bukan pengamanan database.

## Unggah ke GitHub
Unggah file `index.html`, `app.js`, `auth.js`, `config.js`, `README.md`, dan `.gitignore` ke root repository `adinoman-dev/perpustakaan-fpik`. File CSV contoh boleh diunggah jika ingin disediakan sebagai data demo.

## Aktifkan GitHub Pages
1. Buka repository → Settings → Pages.
2. Pada Build and deployment pilih `Deploy from a branch`.
3. Branch `main`, folder `/ (root)`, lalu Save.
4. Setelah deployment selesai, alamat situsnya:
   `https://adinoman-dev.github.io/perpustakaan-fpik/`

## URL Configuration Supabase (setelah GitHub Pages aktif)
- Site URL: `https://adinoman-dev.github.io/perpustakaan-fpik/`
- Redirect URL: `https://adinoman-dev.github.io/perpustakaan-fpik/**`

## Uji coba
Gunakan akun administrator yang sudah dibuat. Jika login berhasil tetapi profil tidak ditemukan, periksa bahwa UUID pada `public.profiles.id` sama dengan UID akun pada Authentication → Users, dan `is_active` bernilai `true`.
