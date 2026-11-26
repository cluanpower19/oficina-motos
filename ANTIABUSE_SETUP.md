# Proteção gratuita do cadastro

O cadastro usa Cloudflare Turnstile integrado ao CAPTCHA nativo do Supabase Auth. A verificação é obrigatória no navegador e o token é enviado em `options.captchaToken` no `signUp`; o Supabase valida o token no servidor.

## Configuração necessária antes de publicar

1. No painel da Cloudflare, crie um widget Turnstile para o hostname `oficiodomotor.github.io`. Adicione também `localhost` se for testar localmente.
2. Copie a **Site Key** (pública) e a **Secret Key** (privada).
3. No Supabase de produção, abra Authentication > Bot and Abuse Protection > CAPTCHA, habilite CAPTCHA, escolha Cloudflare Turnstile e informe a Secret Key. Nunca coloque a Secret Key no frontend, no repositório ou no chat.
4. Informe a Site Key em `VITE_TURNSTILE_SITE_KEY` no arquivo `.env.production`. Para desenvolvimento local, use a mesma variável em `.env.development.local`.
5. Confirme que a opção CAPTCHA está habilitada no projeto Supabase de produção antes de liberar o cadastro.

## Proteções complementares

- A confirmação de e-mail continua obrigatória antes da criação da oficina e início do trial.
- A reserva única de e-mail e telefone na função `iniciar_trial_oficina` permanece ativa.
- O Supabase Auth aplica limites de requisições por endereço IP nos endpoints de cadastro e autenticação.
- Turnstile reduz automação e abuso por bots. Não comprova a titularidade do telefone e não impede uma pessoa determinada de usar outro e-mail, outro número e outra rede/dispositivo.

Não usar chaves de teste em produção. Não publicar enquanto a Site Key e a Secret Key reais não estiverem configuradas e o CAPTCHA estiver habilitado no Supabase.
