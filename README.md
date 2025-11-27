# Deaf Mini App - Gesture Translator for Farcaster

## 📱 Tentang Aplikasi

Deaf Mini App adalah mini‑app Farcaster untuk menerjemahkan gesture ke Bahasa Inggris, lalu menerjemahkan lagi ke hingga 7 bahasa. Seluruhnya berjalan di sisi klien (browser) agar tetap gratis dan sederhana.

## 🚀 Fitur Utama

- Real‑time Gesture Recognition (MediaPipe)
- Terjemahan teks multi‑bahasa (opsional via API gratis)
- Integrasi Farcaster (manifest + postMessage)
- TTS via Web Speech API (gratis di browser)
- Manual text input sebagai alternatif

## 📋 Prerequisites

- Node.js 18+
- pnpm (disarankan)
- Akun Vercel (untuk deployment)
- Akun Farcaster (untuk testing mini‑app)

## 🛠️ Setup Lokal (tanpa database, tanpa Prisma)

1) Install dependencies

```bash
pnpm i
```

2) Buat file env

```bash
cp .env.example .env
```

Edit `.env` minimal:

```env
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_FARCASTER_APP_NAME=deaf-miniapp
# Creator (opsional - untuk donasi & footer)
NEXT_PUBLIC_CREATOR_USERNAME=
NEXT_PUBLIC_CREATOR_FID=
NEXT_PUBLIC_CREATOR_WALLET=
# Optional jika pakai layanan terjemahan eksternal gratis
TRANSLATION_API_URL=
TRANSLATION_API_KEY=
```

3) Jalankan dev server

```bash
pnpm dev
```

Buka `http://localhost:3000`.

## 🌐 Deployment ke Vercel

1) Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[username]/deaf-miniapp.git
git push -u origin main
```

2) Deploy

 - Buka vercel.com → New Project → Import repo
 - Set Environment Variables:
   - `NEXT_PUBLIC_APP_URL` → akan diisi URL Vercel setelah deploy
   - `NEXT_PUBLIC_FARCASTER_APP_NAME`
   - `NEXT_PUBLIC_CREATOR_USERNAME` (opsional)
   - `NEXT_PUBLIC_CREATOR_FID` (opsional)
   - `NEXT_PUBLIC_CREATOR_WALLET` (opsional)
 - Klik Deploy

3) Update URL Aplikasi

 - Setelah deploy, dapatkan URL seperti `https://deaf-miniapp.vercel.app`
 - Update `NEXT_PUBLIC_APP_URL` di Vercel → Redeploy
 - Update `public/.well-known/farcaster.json` → `homeUrl` = URL Vercel Anda

## 🎯 Setup Farcaster Mini App

Edit `public/.well-known/farcaster.json`:

```json
{
  "miniapp": {
    "version": "1",
    "name": "Gesture Translator",
    "homeUrl": "https://your-app-name.vercel.app",
    "iconUrl": "https://your-app-name.vercel.app/icon.png",
    "splashImageUrl": "https://your-app-name.vercel.app/splash.png"
  }
}
```

Daftarkan mini‑app di Warpcast → Settings → Developer → Mini Apps.

## 🔍 Struktur Folder

```
deaf-miniapp/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
├── public/
│   └── .well-known/
├── package.json
└── next.config.js
```

## 🐛 Troubleshooting

### CORS / Embedding
Pastikan headers di `next.config.js`/`vercel.json` mengizinkan iframe dari Farcaster.

### MediaPipe tidak tampil
Periksa permission kamera dan koneksi CDN.

## 📚 Commands

```bash
# Development
pnpm dev

# Production build
pnpm build
pnpm start

# Lint
pnpm lint

# Deploy (opsional via CLI)
vercel
vercel --prod
```

## 🤝 Contributing

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

MIT License

## 🆘 Support

- Open issue di GitHub
- Farcaster: @yourusername
- Email: support@yourapp.com

---

Built with ❤️ for the Farcaster community