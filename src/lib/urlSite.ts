// Endereço público do sistema, usado nos links de orçamento enviados ao cliente.
// No site (http/https) usa o próprio endereço. No app instalado (app://) usa o site publicado.
const SITE_PUBLICO = (import.meta.env.VITE_URL_PUBLICA as string | undefined) ?? 'https://oficiodomotor.github.io'

export function urlSite(): string {
  if (window.location.protocol.startsWith('http')) return `${window.location.origin}${import.meta.env.BASE_URL}`
  return SITE_PUBLICO.replace(/\/$/, '') + '/'
}
