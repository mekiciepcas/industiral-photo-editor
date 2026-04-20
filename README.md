# UPS Photo Studio

Endüstriyel güç elektroniği cihazlarının (UPS, inverter, rectifier, rack / dikili
/ duvar tipi / endüstriyel kabin) profesyonel fotoğraflarını çekmek için mobile
öncelikli bir Progressive Web App. Çekim sırasında cihaz tipine özgü SVG silüet
rehberi, 3x3 ızgara ve telefon seviye göstergesi gösterir; çekim sonrası
tarayıcıda AI ile (ESRGAN-slim) çözünürlük yükseltir.

Tamamen client-side çalışır — görseller cihazdan dışarı çıkmaz, her şey
IndexedDB içinde kalır.

## Özellikler

- Cihaz tipine göre akıllı çekim rehberi (rack, dikili, duvar, endüstriyel)
- Yarı saydam SVG silüet + rule-of-thirds ızgarası + merkez hedefi
- `DeviceOrientationEvent` tabanlı yatay/dikey eğim (level) göstergesi
  (iOS'ta tek dokunuşla izin akışı)
- Parlaklık/kontrast sezgisel uyarıları (aşırı pozlanma, düşük ışık,
  "cihazı silüete hizalayın")
- `react-easy-crop` ile kırpma, zoom ve döndürme
- [UpscalerJS](https://upscalerjs.com/) + `@upscalerjs/esrgan-slim` ile 2x / 3x
  / 4x AI çözünürlük artırma, TensorFlow.js üzerinde (WebGL/WebGPU)
- IndexedDB galeri, Web Share API ile paylaşım, indirme
- [Serwist](https://serwist.pages.dev/) ile PWA / offline cache, ana ekrana
  eklenebilir

## Çalıştırma

```bash
npm install
npm run dev          # http://localhost:3000
# veya üretim:
npm run build
npm start
```

`getUserMedia` ve `DeviceOrientationEvent` için HTTPS ZORUNLUDUR. Telefondan
test için:

- `localhost` tarayıcıda çalışır.
- LAN üzerinden telefonla test için `next dev --experimental-https` veya ngrok /
  tunnel servisleri kullanın.
- En kolay yöntem: Vercel / Cloudflare Pages deploy.

## Mimari

```
app/
  page.tsx                    # Ana ekran - cihaz tipi seçimi
  capture/[type]/             # Canlı kamera + rehber overlay
  edit/[id]/                  # Kırpma + AI upscale
  gallery/                    # Kayıtlı fotoğraflar
  manifest.ts                 # PWA manifest
  icon.tsx, apple-icon.tsx    # Dinamik uygulama ikonları
  sw.ts                       # Service worker (Serwist)

components/
  CameraView.tsx              # getUserMedia + capture
  GuideOverlay.tsx            # Silüet + 3x3 ızgara
  LevelIndicator.tsx          # DeviceOrientation bubble level
  DistanceHint.tsx            # Brightness / contrast hints
  CaptureButton.tsx
  UpscalePanel.tsx            # Upscaling UI + progress
  SilhouettePreview.tsx

lib/
  templates.ts                # Cihaz tipi şablonları (SVG path'ler)
  storage.ts                  # idb IndexedDB sarmalayıcı
  upscale.ts                  # UpscalerJS entegrasyonu
  image.ts                    # Blob/crop yardımcıları
  utils.ts
```

## Notlar

- Next.js 16 varsayılan olarak Turbopack kullanır; Serwist henüz Turbopack
  build'i desteklemediğinden `dev` ve `build` script'leri `--webpack` ile
  çalıştırılır.
- İlk AI upscale çağrısında TF.js + model (~5-15 MB) indirilir; sonraki
  çağrılarda hem model hem SW cache nedeniyle anlık başlar.
- `@upscalerjs/esrgan-slim`'in 2x, 3x, 4x alt paketleri vardır; UI seçiciden
  faktör değişince önceki model disposable olarak serbest bırakılır.
- iOS Safari `DeviceOrientationEvent.requestPermission()` sadece kullanıcı
  etkileşimi sonrası çağrılabildiğinden kamera ekranında "Seviye göstergesini
  etkinleştir" butonu gösterilir.
