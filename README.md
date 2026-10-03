# ShizueeX — YouTube to Top4Top Converter

ShizueeX adalah web converter sederhana yang mengubah link video YouTube menjadi file audio, lalu mengunggah hasilnya secara otomatis ke **Top4Top** dan mengembalikan link hasil upload yang siap dipakai.

Project ini dibuat dengan tampilan **dark blue cinematic**, menggunakan video `.mp4` sebagai background, serta antarmuka satu halaman yang ringan tanpa framework frontend besar.

## ✨ Fitur

- Konversi link YouTube menjadi audio
- Ekstraksi audio otomatis menggunakan `yt-dlp`
- Konversi output ke MP3 menggunakan `ffmpeg`
- Upload hasil audio otomatis ke Top4Top
- Mengambil direct link hasil upload
- Progress proses: info video → download/convert → upload
- Tombol paste URL
- Copy link hasil dengan satu klik
- Validasi URL YouTube
- Dark blue cinematic UI
- Fullscreen animated video background
- Responsive untuk desktop dan mobile
- Health-check endpoint untuk deployment

## 🧭 Cara Kerja

Alur utama aplikasi:

```text
YouTube URL
    ↓
Validasi URL
    ↓
Ambil metadata video dengan yt-dlp
    ↓
Download / extract audio
    ↓
Konversi ke MP3 dengan ffmpeg
    ↓
Upload file ke top4top.io
    ↓
Parse hasil upload
    ↓
Direct link dikirim kembali ke browser
```

File audio sementara disimpan di temporary directory server dan akan dihapus setelah proses selesai.

## 🛠️ Teknologi yang Digunakan

### Backend

- **Node.js** — runtime utama aplikasi
- **Express.js** — web server dan API
- **Axios** — HTTP request
- **axios-cookiejar-support** — cookie-aware Axios client
- **tough-cookie** — menyimpan session/cookie Top4Top
- **FormData** — multipart upload file ke Top4Top
- **Cheerio** — parsing HTML hasil upload Top4Top

### Media Processing

- **yt-dlp** — mengambil metadata dan audio dari YouTube
- **ffmpeg** — ekstraksi dan konversi audio

### Frontend

Frontend tidak menggunakan React/Vue.

UI dibuat langsung dengan:

- HTML
- CSS
- Vanilla JavaScript
- Google Fonts (`Plus Jakarta Sans` dan `Space Mono`)

Markup, style, dan script frontend saat ini berada langsung di dalam `server.js`.

## 📁 Struktur Project

```text
Top4top-convert/
├── public/
│   └── assets/
│       ├── background.mp4
│       ├── logo.png
│       └── logo.jfif
│
├── Dockerfile
├── nixpacks.toml
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

### Asset utama

```text
public/assets/background.mp4
```

Digunakan sebagai fullscreen animated background.

```text
public/assets/logo.png
```

Digunakan sebagai favicon website.

## 📦 Requirements

Disarankan menjalankan project di **Linux / VPS**.

Kebutuhan:

- Node.js 20+ atau versi LTS terbaru
- npm
- yt-dlp
- ffmpeg
- curl
- koneksi internet

Project juga menyediakan `Dockerfile` dan konfigurasi `nixpacks.toml`.

## 🚀 Instalasi di Debian / Ubuntu

Update package:

```bash
sudo apt update
sudo apt install -y curl git ffmpeg
```

Install Node.js jika belum tersedia.

Contoh menggunakan NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Install `yt-dlp`:

```bash
sudo curl -L \
  https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp

sudo chmod +x /usr/local/bin/yt-dlp
```

Cek instalasi:

```bash
node -v
npm -v
ffmpeg -version
yt-dlp --version
```

Clone repository:

```bash
git clone <URL_REPOSITORY>
cd Top4top-convert
```

Install dependency Node.js:

```bash
npm install
```

Jalankan aplikasi:

```bash
npm start
```

atau:

```bash
node server.js
```

Secara default aplikasi berjalan di:

```text
http://localhost:3000
```

Port dapat diubah melalui environment variable:

```bash
PORT=8080 npm start
```

## 🐳 Menjalankan dengan Docker

Build image:

```bash
docker build -t shizueex-converter .
```

Jalankan container:

```bash
docker run --rm -p 3000:8080 \
  -e PORT=8080 \
  shizueex-converter
```

Lalu buka:

```text
http://localhost:3000
```

`Dockerfile` sudah memasang `ffmpeg` dan `yt-dlp`.

## 🖥️ Penggunaan Website

1. Buka website.
2. Salin link video YouTube.
3. Paste ke kolom **Link Video YouTube**.
4. Klik **Generate & Upload**.
5. Tunggu proses:
   - mengambil info video
   - download dan konversi audio
   - upload ke Top4Top
6. Setelah selesai, link hasil Top4Top akan muncul.
7. Copy atau buka link tersebut.

Format URL yang didukung oleh validator project saat ini meliputi:

```text
https://www.youtube.com/watch?v=...
https://youtu.be/...
https://www.youtube.com/shorts/...
https://www.youtube.com/embed/...
```

## 🔌 API

### `POST /api/generate`

Memulai proses konversi dan upload.

Request:

```json
{
  "url": "https://youtu.be/VIDEO_ID"
}
```

Response berhasil:

```json
{
  "success": true,
  "url": "https://e.top4top.io/...",
  "title": "Judul Video"
}
```

Response gagal:

```json
{
  "success": false,
  "error": "Pesan error"
}
```

### `GET /api/health`

Health check sederhana.

Response:

```json
{
  "ok": true
}
```

## 🎬 Mengganti Background Video

Ganti file:

```text
public/assets/background.mp4
```

dengan video baru dan pertahankan nama file:

```text
background.mp4
```

Tidak perlu mengubah source code selama path dan nama file tetap sama.

Disarankan menggunakan video yang sudah dikompresi agar loading website tidak terlalu berat.

## 🖼️ Mengganti Favicon / Logo Browser

Ganti file:

```text
public/assets/logo.png
```

Favicon saat ini dipanggil melalui:

```html
<link rel="icon" type="image/png" href="/assets/logo.png">
```

## ⚙️ Detail Implementasi yt-dlp

Project mencoba beberapa strategi client YouTube secara berurutan saat download:

1. TV / Web client
2. Android client
3. mWeb client
4. `bestaudio/best` fallback

Saat aplikasi berjalan di Linux, project akan:

1. mencari `yt-dlp` dari `PATH`;
2. menggunakan `/tmp/yt-dlp` jika tersedia;
3. mencoba mengunduh binary `yt-dlp` ke `/tmp/yt-dlp` sebagai fallback.

Karena implementasi tersebut menggunakan command Linux seperti `which`, `/tmp`, dan `chmod`, **Linux/VPS atau Docker adalah environment yang paling cocok untuk project ini**.

## ☁️ Deployment VPS

Untuk menjalankan aplikasi secara terus-menerus, PM2 dapat digunakan:

```bash
sudo npm install -g pm2
pm2 start server.js --name shizueex
pm2 save
pm2 startup
```

Update project setelah push baru ke GitHub:

```bash
cd /var/www/Top4top-convert
git pull
npm install
pm2 restart shizueex
```

Untuk production, gunakan Nginx atau reverse proxy lain di depan aplikasi Node.js.

## ⚠️ Catatan

- YouTube dapat mengubah mekanisme delivery/anti-bot sewaktu-waktu sehingga update `yt-dlp` mungkin diperlukan.
- Top4Top juga dapat mengubah struktur halaman upload mereka; parser mungkin perlu disesuaikan jika itu terjadi.
- Jangan commit file cookie, `.env`, credential, atau data sensitif ke repository publik.
- Gunakan aplikasi hanya untuk konten yang memang boleh Anda download, konversi, atau distribusikan.

## 📄 License

Belum ada license khusus yang ditentukan untuk repository ini.

---

Made for **ShizueeX**  
Powered by **Node.js, yt-dlp, ffmpeg, and Top4Top**
