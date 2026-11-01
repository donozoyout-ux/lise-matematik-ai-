# Lise Matematik AI

9–12. sınıf öğrencileri için fotoğrafla matematik çözümü ve AI öğretmeni. **İlk MVP**.

## Özellikler
- JPG/PNG/WebP soru görseli yükleme (en fazla 5 MB)
- Soru okuma, Türkçe adım adım çözüm
- Orijinal görsel üzerinde numaralı adım işaretleri (yaklaşık AI koordinatları)
- Önceki/sonraki çözüm adımları
- Çözüme bağlı yapay zekâ sohbeti
- Mobil uyumlu koyu tema

## Yerelde başlat
Node.js 20+ kurulu olmalı.

```bash
npm install
OPENAI_API_KEY=sk-... npm start
```

Windows PowerShell:
```powershell
$env:OPENAI_API_KEY="sk-..."
npm start
```

http://localhost:3000 adresini aç. **API anahtarını GitHub dosyalarına veya tarayıcı koduna koyma.**

## Render'da yayınla
Render > New > Blueprint > bu repoyu seç > render.yaml servis kurulumunu onayla. Render'da `OPENAI_API_KEY` ortam değişkenini **Secret** olarak gir. Varsayılan `OPENAI_MODEL=gpt-4.1-mini` olup değiştirilebilir. Servis dağıtıldıktan sonra /health yanıtını kontrol et.

## Test
```bash
npm test
```

## Sınırlar
- İşaretler AI tarafından önerilen **yaklaşık** konumlardır; geometrik şekil ve el yazısı için kusursuz işaretleme garantisi yok.
- Matematik cevapları hata içerebilir; öğretmen kontrolü tavsiye edilir.
- İlk sürümde kullanıcı hesabı, kalıcı dosya arşivi, faturalandırma ve üretim düzeyinde rate limit yoktur.
- Görsel her çözüm ve sohbet isteğinde API'ye gönderilir. Veri gizliliği ve kullanım maliyeti için kurumsal dağıtım öncesi ek önlemler gerekir.
