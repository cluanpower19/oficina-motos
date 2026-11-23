// Reduz a foto (lado maior 1600px, JPEG 80%) antes de enviar: economiza dados e armazenamento
export async function reduzirImagem(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const escala = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * escala)
  const h = Math.round(bmp.height * escala)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  return new Promise((ok, falha) =>
    canvas.toBlob((b) => (b ? ok(b) : falha(new Error('Não foi possível processar a foto.'))), 'image/jpeg', 0.8),
  )
}
