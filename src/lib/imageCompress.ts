/** Resize and JPEG-compress a camera data URL so localStorage is less likely to drop it. */
export async function compressDataUrlToJpeg(
  dataUrl: string,
  maxEdge = 960,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (!w || !h) {
        resolve(dataUrl)
        return
      }
      let tw = w
      let th = h
      if (w > maxEdge || h > maxEdge) {
        if (w >= h) {
          tw = maxEdge
          th = Math.round((h / w) * maxEdge)
        } else {
          th = maxEdge
          tw = Math.round((w / h) * maxEdge)
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = tw
      canvas.height = th
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, tw, th)
      try {
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = dataUrl
  })
}
