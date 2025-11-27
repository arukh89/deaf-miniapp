# 🚀 Panduan Deployment Lengkap - Gesture Translator ke Vercel & Farcaster

## 📋 Prerequisites

Sebelum memulai, pastikan Anda memiliki:

- ✅ Akun GitHub
- ✅ Akun Vercel (gratis di [vercel.com](https://vercel.com))
- ✅ Node.js 18+ terinstall
- ✅ pnpm terinstall (`npm install -g pnpm`)
- ✅ Git terinstall

## 🔧 Langkah 1: Persiapan Repository

### 1.1 Initialize Git Repository

\`\`\`bash
cd "C:\\Users\\UserBQ\\Downloads\\mini app\\deaf mini app"
git init
git add .
git commit -m "Initial commit: Gesture Translator Farcaster Mini App"
\`\`\`

### 1.2 Buat Repository di GitHub

1. Buka [github.com/new](https://github.com/new)
2. Nama repository: `gesture-translator` atau `deaf-miniapp`
3. Pilih **Public** (untuk Farcaster mini app harus public)
4. **JANGAN** centang "Initialize with README" (sudah ada)
5. Klik "Create repository"

### 1.3 Push ke GitHub

\`\`\`bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
\`\`\`

**Ganti:**
- `YOUR_USERNAME` dengan username GitHub Anda
- `YOUR_REPO_NAME` dengan nama repo yang Anda buat

---

## 🌐 Langkah 2: Deploy ke Vercel

### Method A: Via Vercel Dashboard (RECOMMENDED - Paling Mudah!)

#### 2.1 Login ke Vercel
1. Buka [vercel.com](https://vercel.com)
2. Login dengan akun GitHub Anda

#### 2.2 Import Project
1. Klik **"Add New..."** → **"Project"**
2. Pilih repository `gesture-translator` dari list
3. Klik **"Import"**

#### 2.3 Configure Project
Vercel akan otomatis mendeteksi Next.js. Pastikan settingan:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `pnpm build` (sudah otomatis dari vercel.json)
- **Output Directory**: `.next` (default Next.js)
- **Install Command**: `pnpm install`

#### 2.4 Environment Variables (Optional)
Klik "Environment Variables" dan tambahkan jika diperlukan (bisa skip untuk versi gratis ini). Gunakan nama variabel yang konsisten dengan `.env.example`:

\`\`\`
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_FARCASTER_APP_NAME=deaf-miniapp
# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
# Optional: External translation service (gratis/opsional)
TRANSLATION_API_URL=
TRANSLATION_API_KEY=
# Optional: Creator info (donasi & footer)
NEXT_PUBLIC_CREATOR_USERNAME=
NEXT_PUBLIC_CREATOR_FID=
NEXT_PUBLIC_CREATOR_WALLET=
\`\`\`

#### 2.5 Deploy!
1. Klik **"Deploy"**
2. Tunggu 2-3 menit sampai deployment selesai
3. Anda akan mendapat URL: `https://YOUR-PROJECT.vercel.app`

#### 2.6 Custom Domain (Optional)
Jika punya domain sendiri:
1. Buka Settings → Domains
2. Tambahkan domain Anda
3. Update DNS sesuai instruksi Vercel

---

### Method B: Via Vercel CLI (Advanced)

\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy ke preview
vercel

# Deploy ke production
vercel --prod
\`\`\`

---

## 🎯 Langkah 3: Konfigurasi Farcaster Mini App

### 3.1 Update farcaster.json

Setelah deployment berhasil, update file `public/.well-known/farcaster.json`:

\`\`\`json
{
  "miniapp": {
    "version": "1",
    "name": "Gesture Translator",
    "iconUrl": "https://YOUR-PROJECT.vercel.app/icon.png",
    "homeUrl": "https://YOUR-PROJECT.vercel.app",
    "imageUrl": "https://YOUR-PROJECT.vercel.app/og-image.png",
    "buttonTitle": "Open Translator",
    "splashImageUrl": "https://YOUR-PROJECT.vercel.app/splash.png",
    "splashBackgroundColor": "#ffffff",
    "tags": [
      "accessibility",
      "mini-app",
      "base",
      "farcaster"
    ],
    "primaryCategory": "utilities",
    "ogTitle": "Gesture Translator - Sign Language to Text & Voice",
    "ogImageUrl": "https://YOUR-PROJECT.vercel.app/og-image.png"
  },
  "baseBuilder": {
    "allowedAddresses": [""]
  }
}
\`\`\`

**Ganti semua `YOUR-PROJECT.vercel.app` dengan URL Vercel Anda!**

### 3.2 Push Update ke GitHub

\`\`\`bash
git add public/.well-known/farcaster.json
git commit -m "Update Farcaster manifest with production URL"
git push
\`\`\`

Vercel akan otomatis deploy ulang!

### 3.3 Tambahkan Icons & Images (PENTING!)

Buat dan tambahkan file berikut ke folder `public/`:

1. **icon.png** - 512x512px (logo aplikasi)
2. **og-image.png** - 1200x630px (untuk social sharing)
3. **splash.png** - 1080x1920px (splash screen)

Bisa gunakan tools:
- [Canva](https://canva.com) untuk design
- [TinyPNG](https://tinypng.com) untuk compress

---

## 🧪 Langkah 4: Testing Mini App

### 4.1 Test di Browser
1. Buka `https://YOUR-PROJECT.vercel.app`
2. Test semua fitur:
   - ✅ Live gesture recognition
   - ✅ Camera capture
   - ✅ Manual input
   - ✅ Language selection
   - ✅ Text-to-speech

### 4.2 Test di Farcaster
1. Buka Warpcast app atau web
2. Buat cast baru
3. Paste URL mini app Anda
4. Seharusnya muncul preview dengan icon & judul
5. Klik untuk membuka mini app

### 4.3 Validasi Manifest
Test manifest Anda:
\`\`\`bash
curl https://YOUR-PROJECT.vercel.app/.well-known/farcaster.json
\`\`\`

Pastikan return JSON yang valid!

---

## 📱 Langkah 5: Submit ke Farcaster Directory

### 5.1 Register Mini App
1. Buka [farcaster.xyz](https://farcaster.xyz) atau platform yang sesuai
2. Login dengan Farcaster account
3. Submit mini app Anda dengan:
   - Name: Gesture Translator
   - URL: `https://YOUR-PROJECT.vercel.app`
   - Manifest: `https://YOUR-PROJECT.vercel.app/.well-known/farcaster.json`
   - Category: Utilities / Accessibility
   - Description: Real-time sign language gesture translator

### 5.2 Promosi
Setelah live, promosikan di:
- ✅ Cast di Warpcast
- ✅ Share di Twitter
- ✅ Post di komunitas developer Farcaster
- ✅ Tag: #Farcaster #MiniApp #Accessibility #Base

---

## 🔐 Langkah 6: Security & Environment

### 6.1 Setup Environment Variables di Vercel (Opsional)

Untuk project versi gratis ini, environment variables bersifat opsional. Jika ingin menambahkan:

\`\`\`
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_FARCASTER_APP_NAME=deaf-miniapp
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
TRANSLATION_API_URL=
TRANSLATION_API_KEY=
# Creator info (opsional)
NEXT_PUBLIC_CREATOR_USERNAME=
NEXT_PUBLIC_CREATOR_FID=
NEXT_PUBLIC_CREATOR_WALLET=
\`\`\`

Catatan:
- Tidak ada database dan tidak perlu `DATABASE_URL`.
- Kunci Pro seperti `OPENAI_API_KEY` atau `ELEVENLABS_API_KEY` tidak digunakan pada versi gratis ini.

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'next'"
\`\`\`bash
rm -rf node_modules package-lock.json
pnpm install
\`\`\`

### Error: "Camera not accessible"
- Pastikan app diakses via HTTPS (Vercel otomatis HTTPS)
- Check browser permissions

### Error: "Build failed"
Check Vercel logs:
\`\`\`bash
vercel logs YOUR-PROJECT
\`\`\`

### Mini app tidak muncul di Farcaster
1. Pastikan repository **public**
2. Pastikan `farcaster.json` bisa diakses public
3. Clear cache Warpcast

---

## 📊 Monitoring & Analytics

### Vercel Analytics
1. Buka Project → Analytics
2. Gratis untuk hobby plan
3. Monitor:
   - Pageviews
   - Performance
   - Core Web Vitals

### PostHog (Optional)
Untuk detailed analytics:
1. Signup di [posthog.com](https://posthog.com)
2. Ambil API key
3. Tambahkan ke environment variables

---

## 🔄 Update & Maintenance

### Deploy Update
Setiap kali push ke GitHub, Vercel otomatis deploy!

\`\`\`bash
# Make changes
git add .
git commit -m "Update feature X"
git push

# Vercel will auto-deploy!
\`\`\`

### Rollback
Jika ada masalah:
1. Buka Vercel Dashboard → Deployments
2. Pilih deployment sebelumnya yang stabil
3. Klik "Promote to Production"

---

## 🎉 Checklist Final

Sebelum go live, pastikan:

- [ ] ✅ Project ter-push ke GitHub (public)
- [ ] ✅ Deploy berhasil di Vercel
- [ ] ✅ URL Vercel bisa diakses
- [ ] ✅ `farcaster.json` updated dengan URL production
- [ ] ✅ Icons & images sudah di-upload
- [ ] ✅ Camera permissions working
- [ ] ✅ Gesture recognition working
- [ ] ✅ Text-to-speech working
- [ ] ✅ Test di Warpcast berhasil
- [ ] ✅ Mini app tersubmit ke directory

---

## 📞 Support

Jika ada masalah:
1. Check [Vercel Docs](https://vercel.com/docs)
2. Check [Next.js Docs](https://nextjs.org/docs)
3. Check [Farcaster Docs](https://docs.farcaster.xyz)
4. Hubungi via Warpcast: @ukhy89

---

## 🚀 Next Steps

Setelah live:
1. Kumpulkan user feedback
2. Monitor analytics
3. Improve gesture recognition accuracy
4. Add more languages
5. Develop mobile app

**Good luck with your deployment! 🎉**

Built with ❤️ for the deaf community
