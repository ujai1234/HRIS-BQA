# Panduan Deployment HRIS & Tahfidz BQA ke VPS RumahWeb

Dokumen ini memuat langkah-langkah komprehensif untuk men-deploy dua aplikasi (HRIS dan Tahfidz BQA) ke VPS RumahWeb menggunakan **Nginx Reverse Proxy** dengan struktur **Path-Based Routing**.

## Arsitektur Deployment

- **IP VPS:** `103.247.10.48`
- **Domain:** `baitulquranalikhwan.cloud`
- **Routing:**
  - `baitulquranalikhwan.cloud/hris` -> Aplikasi HRIS-BQA (Port internal: 3000)
  - `baitulquranalikhwan.cloud/tahfidz` -> Aplikasi Tahfidz-BQA (Port internal: 3001)
  - `baitulquranalikhwan.cloud/api` -> API Tahfidz-BQA (Port internal: 4000)
- **Process Manager:** PM2 (Node.js)
- **Database:** SQLite (lokal di masing-masing aplikasi)

---

## 1. Persiapan VPS (Akses & Dependensi)

### Akses Server
Buka terminal/command prompt di komputer Anda dan login melalui SSH:
```bash
ssh root@103.247.10.48
# Masukkan password VPS RumahWeb Anda
```

### Install Dependensi Sistem (Node.js, Git, Nginx)
```bash
# Update package list
apt update && apt upgrade -y

# Install Git dan Nginx
apt install -y git nginx curl build-essential sqlite3

# Install Node.js (Versi 20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verifikasi instalasi (Pastikan versi 20.x)
node -v
npm -v

# Install PM2 secara global
npm install -g pm2
```

---

## 2. Setup Aplikasi Tahfidz BQA (Backend & Frontend)

Aplikasi Tahfidz memiliki dua service utama jika dijalankan dari Next.js / Express (sesuaikan jika terpisah). Kita asumsikan letak file ada di direktori `/var/www/`.

```bash
# Buat direktori kerja
mkdir -p /var/www/bqa
cd /var/www/bqa

# Clone repositori Anda (ganti dengan link repository yang benar)
git clone https://github.com/ujai1234/Aplikasi-Tahfidz-BQA.git tahfidz
cd tahfidz
```

### Konfigurasi & Build Tahfidz
Masuk ke folder Next.js (misal `bqa-app`):
```bash
cd bqa-app

# Install dependency
npm install

# Buat file .env.production
cat <<EOT > .env.production
PORT=3001
NEXT_PUBLIC_API_URL=https://baitulquranalikhwan.cloud/api
NEXT_PUBLIC_BASE_PATH=/tahfidz
EOT

# Build aplikasi Next.js
npm run build
```
*(Catatan: Anda mungkin perlu menambahkan konfigurasi `basePath: '/tahfidz'` di `next.config.ts` aplikasi Tahfidz jika sebelumnya belum disiapkan).*

### Menjalankan Tahfidz Frontend dengan PM2
```bash
pm2 start npm --name "tahfidz-frontend" -- start -- -p 3001
```

### Menjalankan Tahfidz API/Backend dengan PM2 (Port 4000)
Jika backend Tahfidz berada di folder terpisah atau perintah berbeda, jalankan:
```bash
# Contoh jika API berada di root folder `server.js` atau sejenisnya
cd /var/www/bqa/tahfidz/server (sesuaikan)
npm install
pm2 start npm --name "tahfidz-api" -- run start -- -p 4000
```
*(Pastikan API ini running di `http://localhost:4000`)*

---

## 3. Setup Aplikasi HRIS BQA

```bash
cd /var/www/bqa

# Clone repositori HRIS
git clone https://github.com/ujai1234/HRIS-BQA.git hris
cd hris

# Install dependency
npm install

# Buat file .env.production
cat <<EOT > .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=./data/sqlite.db
TAHFIDZ_API_URL=http://localhost:4000/api
WA_GATEWAY_API_KEY=your_fonnte_key_here
VITE_BASE_PATH=/hris
EOT

# Build aplikasi HRIS (Frontend & Backend tersatukan dalam server.ts/dist)
npm run build

# Jalankan HRIS dengan PM2
pm2 start npm --name "hris-app" -- run start
```
*(Catatan: Anda mungkin perlu mengatur `base: '/hris/'` di `vite.config.ts` agar frontend HRIS dapat memuat aset dengan benar saat di-serve di sub-path).*

### Simpan Status PM2
Agar aplikasi otomatis hidup ketika VPS direstart:
```bash
pm2 save
pm2 startup
# Jalankan perintah yang dihasilkan oleh pm2 startup di terminal
```

---

## 4. Konfigurasi Nginx (Reverse Proxy)

Sekarang kita mengatur Nginx agar merutekan traffic domain utama ke aplikasi-aplikasi yang berjalan di localhost.

```bash
# Hapus konfigurasi default
rm /etc/nginx/sites-enabled/default

# Buat konfigurasi baru untuk BQA
nano /etc/nginx/sites-available/bqa
```

Masukkan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name baitulquranalikhwan.cloud www.baitulquranalikhwan.cloud;

    # Akses root (Opsional: Redirect ke HRIS atau Tahfidz)
    location = / {
        return 301 /hris/;
    }

    # Proxy untuk HRIS
    location /hris/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy untuk Tahfidz Frontend
    location /tahfidz/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy untuk Tahfidz API
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Simpan dan keluar (Ctrl+O, Enter, Ctrl+X).

Aktifkan konfigurasi:
```bash
ln -s /etc/nginx/sites-available/bqa /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 5. Konfigurasi DNS di RumahWeb

Sebelum mengatur HTTPS, pastikan domain sudah mengarah ke IP VPS Anda:
1. Login ke panel client/cPanel RumahWeb Anda.
2. Masuk ke menu **DNS Management**.
3. Tambahkan (atau edit) A Record:
   - **Hostname:** `@` (atau kosongkan)
   - **Type:** `A`
   - **Destination/IP:** `103.247.10.48`
4. Tambahkan A Record untuk www:
   - **Hostname:** `www`
   - **Type:** `A`
   - **Destination/IP:** `103.247.10.48`

*Catatan: Propagasi DNS mungkin membutuhkan waktu hingga 1-24 jam, tetapi seringkali hanya beberapa menit.*

---

## 6. Install SSL (HTTPS) dengan Certbot

Agar aplikasi aman (gembok hijau), pasang SSL gratis dari Let's Encrypt.

```bash
# Install Certbot
apt install -y python3-certbot-nginx

# Request SSL Certificate
certbot --nginx -d baitulquranalikhwan.cloud -d www.baitulquranalikhwan.cloud
```

Certbot akan otomatis memodifikasi file konfigurasi Nginx Anda untuk menambahkan SSL dan mengatur redirect otomatis dari HTTP ke HTTPS.

---

## 7. Firewall (Opsional namun sangat direkomendasikan)

Pastikan port 80 dan 443 terbuka, sementara port aplikasi internal dilindungi.

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## 8. Troubleshooting Umum

**Q: Mengapa CSS/Asset tidak termuat (Error 404) saat mengakses `/hris`?**
A: Pada aplikasi React/Vite, jika di-deploy dalam sub-path, Anda perlu memastikan `vite.config.ts` (HRIS) memiliki setelan:
```javascript
export default defineConfig({
  base: '/hris/',
  // ...
})
```
Dan di Next.js (Tahfidz) dalam `next.config.ts`:
```javascript
const nextConfig = {
  basePath: '/tahfidz',
  // ...
}
```
Setiap kali Anda merubah konfigurasi ini, Anda perlu menjalankan `npm run build` dan `pm2 restart all` kembali.

**Q: Bagaimana cara mengecek apakah integrasi Payroll HRIS berhasil membaca API Tahfidz?**
A: Pastikan `TAHFIDZ_API_URL` di server HRIS menggunakan internal port: `http://localhost:4000/api`. Karena keduanya berada di satu VPS, proxy internal lebih cepat dan aman daripada memanggil URL publik HTTPS.

```bash
# Cek log aplikasi HRIS
pm2 logs hris-app
```
