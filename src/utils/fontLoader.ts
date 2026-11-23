const loadedCssUrls = new Set<string>();

export function loadFontStylesheet(url?: string): void {
  if (!url || typeof document === 'undefined') return;
  if (loadedCssUrls.has(url)) return;
  loadedCssUrls.add(url);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

export async function registerStudioFontFace(familyName: string, buffer: ArrayBuffer): Promise<void> {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return;

  // Remove any previous instance of this studio font family so updates render immediately
  for (const face of Array.from(document.fonts)) {
    if (face.family === familyName || face.family === `"${familyName}"`) {
      document.fonts.delete(face);
    }
  }

  const face = new FontFace(familyName, buffer);
  const loaded = await face.load();
  document.fonts.add(loaded);
}

export function triggerBinaryDownload(data: ArrayBuffer | Blob, filename: string, mimeType = 'application/octet-stream'): void {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
