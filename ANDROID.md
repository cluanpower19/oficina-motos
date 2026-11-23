# Aplicativo Android — Ofício do Motor

O APK oficial é compilado na nuvem pelo GitHub Actions e publicado diretamente no site. Não é necessário instalar Android Studio ou Android SDK.

## Chave de assinatura criada

Foi criada uma chave de assinatura PKCS#12 permanente para o aplicativo. No computador autorizado, os arquivos estão em:

`C:\Users\iaras\Documents\OficioDoMotor-Release\`

- `oficio-do-motor-release.p12`: chave privada de assinatura (backup essencial).
- `GITHUB-ACTIONS-SECRETS.txt`: valores para configurar os quatro segredos privados do GitHub.
- `LEIA-ME.txt`: instruções de segurança e impressão digital do certificado.

**Não publique, envie por e-mail/chat nem adicione esses arquivos ao repositório.** Mantenha duas cópias seguras da pasta, uma delas offline. Perder a chave pode impedir atualizações compatíveis para os usuários que instalaram o app.

## Etapa necessária: cadastrar os segredos no GitHub

O GitHub não permite que este fluxo de trabalho cadastre segredos privados por meio da integração disponível. É necessário fazer esta única etapa manualmente:

1. Abra o repositório `oficiodomotor/oficiodomotor.github.io` no GitHub.
2. Acesse **Settings → Secrets and variables → Actions**.
3. Clique em **New repository secret**.
4. Abra localmente `GITHUB-ACTIONS-SECRETS.txt` na pasta indicada acima e crie os quatro segredos, copiando cada valor correspondente:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

Não cole esses valores no chat. As duas senhas foram geradas automaticamente e são iguais para o formato PKCS#12.

## Compilar e publicar

Depois de cadastrar os quatro segredos:

1. Abra **Actions** no repositório.
2. Selecione **Build and publish official Android APK**.
3. Clique em **Run workflow** e confirme.

O workflow compila a variante `release`, verifica a assinatura, publica o arquivo `public/downloads/OficioDoMotor.apk` e executa o deploy do site. O botão Android na tela de login só aparece quando o APK já estiver disponível.

Link de download após a publicação:
`https://oficiodomotor.github.io/downloads/OficioDoMotor.apk`

Antes de divulgar amplamente, teste instalação, login, navegação, fotos, uploads, links do WhatsApp e retorno do Android. A assinatura não elimina necessariamente os avisos do Android para instalações fora da Play Store.

## Versão do aplicativo

Antes de cada lançamento, incremente `versionCode` e atualize `versionName` em `android/app/build.gradle`. Use sempre a mesma chave de assinatura criada para esta aplicação.
