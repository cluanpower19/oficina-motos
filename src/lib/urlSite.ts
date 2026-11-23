// Endereço público do sistema, usado nos links de orçamento enviados ao cliente.
// No site (http/https) usa o próprio endereço. No app instalado (app://) usa o site publicado.
const SITE_PUBLICO = (import.meta.env.VITE_URL_PUBLICA as string | undefined) ?? 'https://oficiodomotor.github.io'

export function urlSite(): string {
  if (window.location.protocol.startsWith('http')) return `${window.location.origin}${import.meta.env.BASE_URL}`
  return SITE_PUBLICO.replace(/\/$/, '') + '/'
}

// Página de downloads do app desktop (instaladores anexados nas Releases do GitHub).
export const URL_DOWNLOAD = 'https://github.com/oficiodomotor/oficiodomotor.github.io/releases/latest'

// Verdadeiro no site (http/https); falso dentro do app instalado (app://).
export const noSite = window.location.protocol.startsWith('http')

// Link direto do instalador da Release mais recente (baixa na hora, sem abrir a página do GitHub).
// Procura o arquivo pelo final do nome, então continua valendo quando a versão muda.
const API_RELEASE = 'https://api.github.com/repos/oficiodomotor/oficiodomotor.github.io/releases/latest'

export async function urlInstalador(sufixo: string): Promise<string | null> {
  try {
    const r = await fetch(API_RELEASE, { headers: { Accept: 'application/vnd.github+json' } })
    if (!r.ok) return null
    const dados = (await r.json()) as { assets?: { name: string; browser_download_url: string }[] }
    return dados.assets?.find((a) => a.name.endsWith(sufixo))?.browser_download_url ?? null
  } catch {
    return null
  }
}
