export const WHATSAPP_COMERCIAL = '5579998424306'

export function linkWhatsAppComercial(mensagem: string): string {
  return `https://wa.me/${WHATSAPP_COMERCIAL}?text=${encodeURIComponent(mensagem)}`
}
