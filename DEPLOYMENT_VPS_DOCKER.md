# Panduan Deployment HRIS BQA & Aplikasi Tahfidz di VPS (Docker)

Dokumen ini berisi langkah-langkah untuk melakukan deployment dua aplikasi secara bersamaan pada VPS RumahWeb (OS Ubuntu):
1. **HRIS BQA** (Vite + Express + SQLite + Better Auth)
2. **Aplikasi Tahfidz** (Next.js + Express API + SQLite + JWT)

## Spesifikasi Target & Arsitektur
- **Server IP**: 103.247.10.48
- **OS**: Ubuntu (20.04/22.04 LTS)
- **Domain Mapping** (Disarankan menggunakan Subdomain):
  - `hris.baitulquranalikhwan.cloud` -> HRIS BQA (Port Lokal: 3000)
  - `tahfidz.baitulquranalikhwan.cloud` -> Frontend Tahfidz (Port Lokal: 3001)
  - `api.tahfidz.baitulquranalikhwan.cloud` -> Backend API Tahfidz (Port Lokal: 4000)
- **Stack**: Docker Compose, Nginx Reverse Proxy

---

## 1. Persiapan VPS (Instalasi Docker & Nginx)

Login ke VPS Anda menggunakan SSH:
```bash
ssh root@103.247.10.48
```

Update sistem dan install Nginx serta dependencies Docker:
```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg nginx sqlite3
```

Install Docker & Docker Compose:
```bash
# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 2. Setup HRIS BQA

```bash
mkdir -p /var/www/hris-bqa
cd /var/www/hris-bqa

# Clone repository HRIS Anda
git clone <URL_REPO_HRIS> .

# Buat file env
cat <<EOF > .env
NODE_ENV=production
PORT=3000
DATABASE_URL=/app/data/sqlite.db
BETTER_AUTH_SECRET=rahasia_super_kuat_bqa_2026_$(openssl rand -hex 16)
BETTER_AUTH_URL=https://hris.baitulquranalikhwan.cloud
EOF

# Jalankan container HRIS (Mapping port host 3000)
docker compose up -d --build
```

## 3. Setup Aplikasi Tahfidz

Karena port 3000 sudah dipakai oleh aplikasi HRIS, kita harus memetakan port frontend aplikasi Tahfidz ke port **3001** di Host/VPS.

```bash
mkdir -p /var/www/tahfidz-bqa
cd /var/www/tahfidz-bqa

# Clone repository Tahfidz Anda
git clone <URL_REPO_TAHFIDZ> .

# PENTING: Edit docker-compose.yml pada repo Tahfidz
# Ubah bagian ports untuk service 'web' dari "3000:3000" menjadi "3001:3000"
nano docker-compose.yml 

# Buat file konfigurasi API .env di dalam folder server Tahfidz
cat <<EOF > server/.env
PORT=4000
NODE_ENV=production
DB_PATH=/app/data/bqa.db
JWT_SECRET=rahasia_jwt_tahfidz_$(openssl rand -hex 16)
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://tahfidz.baitulquranalikhwan.cloud
EOF

# Build dan Jalankan container Tahfidz
# Perhatikan build-arg NEXT_PUBLIC_API_URL diarahkan ke domain publik API
docker compose build --build-arg NEXT_PUBLIC_API_URL=https://api.tahfidz.baitulquranalikhwan.cloud
docker compose up -d
```

## 4. Konfigurasi Reverse Proxy Nginx

Hapus default config dan buat config baru:
```bash
rm /etc/nginx/sites-enabled/default
nano /etc/nginx/sites-available/bqa-apps
```

Masukkan konfigurasi ini untuk melayani ke-3 service dengan subdomain berbeda:
```nginx
# 1. HRIS BQA
server {
    listen 80;
    server_name hris.baitulquranalikhwan.cloud;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. Frontend Aplikasi Tahfidz
server {
    listen 80;
    server_name tahfidz.baitulquranalikhwan.cloud;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 3. Backend API Aplikasi Tahfidz
server {
    listen 80;
    server_name api.tahfidz.baitulquranalikhwan.cloud;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan konfigurasi Nginx:
```bash
ln -s /etc/nginx/sites-available/bqa-apps /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 5. Setup SSL Gratis (HTTPS) dengan Let's Encrypt

Keamanan wajib menggunakan HTTPS, terutama untuk menjamin keamanan pengiriman Session (Better Auth) dan Token (JWT).

```bash
# Install Certbot untuk Nginx
apt install -y python3-certbot-nginx

# Meminta sertifikat SSL untuk semua subdomain (Ganti dengan alamat email Anda jika diminta)
certbot --nginx -d hris.baitulquranalikhwan.cloud -d tahfidz.baitulquranalikhwan.cloud -d api.tahfidz.baitulquranalikhwan.cloud
```

*(Certbot akan otomatis memodifikasi file konfigurasi Nginx Anda untuk menerapkan HTTPS)*

## 6. Selesai

- **HRIS BQA** bisa diakses di: `https://hris.baitulquranalikhwan.cloud`
- **Aplikasi Tahfidz** bisa diakses di: `https://tahfidz.baitulquranalikhwan.cloud`

**Penting:** Pastikan pengaturan DNS (A Record) untuk ke-3 subdomain (`hris`, `tahfidz`, `api.tahfidz`) sudah di-pointing ke IP VPS Anda (103.247.10.48).

---

## 7. Cara Menjalankan Secara Lokal (Local Development)

Jika Anda ingin menjalankan atau melakukan pengujian pada kedua aplikasi ini secara bersamaan di komputer lokal (Windows/Mac/Linux) tanpa Docker, ikuti panduan berikut:

### 1. Jalankan HRIS BQA
Buka terminal pertama, arahkan ke folder HRIS Anda:
```bash
cd D:\HRIS_BQA_Project\HRIS_BQA_Github\HRIS-BQA
npm run dev
```
> HRIS akan berjalan di **http://localhost:3000**

### 2. Jalankan Backend API Tahfidz
Buka terminal kedua, arahkan ke folder server Tahfidz Anda:
```bash
cd C:\Users\hudza\.gemini\antigravity-ide\brain\34e32b61-c544-4fa1-92b0-f688ce947898\scratch\Aplikasi-Tahfidz-BQA\server
npm run dev
```
> API Tahfidz akan berjalan di **http://localhost:4000**

### 3. Jalankan Frontend Aplikasi Tahfidz
Buka terminal ketiga, arahkan ke folder frontend Tahfidz Anda. Karena port 3000 sudah dipakai oleh HRIS, **wajib tambahkan bendera `-p 3001`**:
```bash
cd C:\Users\hudza\.gemini\antigravity-ide\brain\34e32b61-c544-4fa1-92b0-f688ce947898\scratch\Aplikasi-Tahfidz-BQA\bqa-app
npm run dev -- -p 3001
```
> Aplikasi web Tahfidz akan berjalan di **http://localhost:3001**
