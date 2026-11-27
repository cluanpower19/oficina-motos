import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'br.com.oficiodomotor.gestao',
  appName: 'Ofício do Motor',
  webDir: 'dist',
  server: {
    // Permite que o desafio do Turnstile carregue dentro do WebView do Android.
    allowNavigation: ['challenges.cloudflare.com'],
  },
  android: {
    backgroundColor: '#0b1016',
  },
}

export default config
