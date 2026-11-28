// Service worker simples: só guarda arquivos do próprio site (nunca Supabase nem fontes externas).
// Para forçar atualização do cache, troque o número da versão.
const VERSAO = 'oficio-identidade-v2'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  // Páginas: tenta a rede primeiro; sem internet, mostra a última versão guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copia = r.clone()
          caches.open(VERSAO).then((c) => c.put('/index.html', copia))
          return r
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  // Arquivos estáticos (js, css, imagens, ícones): usa o guardado e atualiza em segundo plano.
  e.respondWith(
    caches.match(req).then((guardado) => {
      const rede = fetch(req)
        .then((r) => {
          if (r.ok) {
            const copia = r.clone()
            caches.open(VERSAO).then((c) => c.put(req, copia))
          }
          return r
        })
        .catch(() => guardado)
      return guardado || rede
    }),
  )
})
