/* Camera and gallery photos share one upload pipeline. No third-party library required. */
(() => {
  const MB = 1024 * 1024;
  const SUPPORTED = new Set(['image/jpeg', 'image/png', 'image/webp']);
  function isImage(file) {
    return !!file && (typeof file.type === 'string' && file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|heic|heif)$/i.test(String(file.name || '')));
  }
  function asDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Fotoğraf okunamadı. Tekrar dene.'));
      reader.readAsDataURL(file);
    });
  }
  function loadImage(objectUrl) {
    return new Promise((resolve, reject) => {
      const photo = new Image();
      photo.onload = () => resolve(photo);
      photo.onerror = () => reject(new Error('Fotoğraf açılamadı. JPG veya PNG olarak tekrar çek.'));
      photo.src = objectUrl;
    });
  }
  async function prepare(file) {
    if (!isImage(file) || !Number.isFinite(file.size) || file.size <= 0) {
      throw new Error('Lütfen bir fotoğraf seç veya kamerayla çek.');
    }
    if (file.size > 40 * MB) {
      throw new Error('Fotoğraf çok büyük. Daha düşük çözünürlükle tekrar çek.');
    }
    // Preserve small, crisp PNGs and JPEGs (especially textbook equations).
    if (SUPPORTED.has(file.type) && file.size <= 5 * MB) {
      return asDataUrl(file);
    }
    // Camera photos may be 8–30 MB. Resize to fit Worker/Gemini limits.
    // HEIC/HEIF conversion works when the browser can decode the source format.
    const objectUrl = URL.createObjectURL(file);
    try {
      const photo = await loadImage(objectUrl);
      if (!photo.naturalWidth || !photo.naturalHeight) throw new Error('Görsel boyutları okunamadı.');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Telefon fotoğrafı işleyemiyor.');
      for (const maxSide of [2600, 2200, 1900, 1600]) {
        const ratio = Math.min(1, maxSide / Math.max(photo.naturalWidth, photo.naturalHeight));
        canvas.width = Math.max(1, Math.round(photo.naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(photo.naturalHeight * ratio));
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(photo, 0, 0, canvas.width, canvas.height);
        for (const quality of [0.94, 0.84, 0.74]) {
          const encoded = canvas.toDataURL('image/jpeg', quality);
          // Base64 payload and the total JSON request must remain below server limits.
          if (encoded.startsWith('data:image/jpeg;base64,') && encoded.length < 6_800_000) {
            canvas.width = canvas.height = 0;
            return encoded;
          }
        }
      }
      throw new Error('Fotoğraf küçültülemedi. Soruyu daha yakından tekrar çek.');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
  globalThis.PhotoUpload = { prepare, isImage };
})();
