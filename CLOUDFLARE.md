# Cloudflare Workers (ücretsiz kurulum)

1. Cloudflare Dashboard > Workers & Pages > Create application > **Import a repository** (GitHub) veya Workers > Create > Connect to Git.
2. GitHub repository: `donozoyout-ux/lise-matematik-ai-`; branch: `feat/math-vision-mvp` (PR merge edilirse `main`).
3. Workers build/deploy: Build command: `npm install`; Deploy command: `npx wrangler deploy`. Root directory: `/`.
4. Workers > ilgili servis > Settings > Variables and Secrets > **Add secret**: `GEMINI_API_KEY`. Anahtarı GitHub'a eklemeyin.
5. Uygulamayı yeniden deploy edin. `https://<worker>.workers.dev/health` -> `{"ok":true}`.
6. Fotoğraf yükleyip soru çözün, devam sorusu sorun.

Node.js 20+ ile yerel test: `npm install && npx wrangler dev`. Ücretsiz Gemini kotası sınırlıdır; hassas kişisel bilgi içeren görseller yüklemeyin.
