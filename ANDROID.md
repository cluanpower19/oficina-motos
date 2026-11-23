# Aplicativo Android — Ofício do Motor

O aplicativo Android é gerado com Capacitor a partir do mesmo projeto React/Vite. O site continua sendo a versão principal; não é necessário manter uma segunda aplicação.

## Gerar a versão oficial pelo GitHub Actions

A compilação oficial roda na nuvem. Não é necessário instalar Android Studio ou Android SDK no computador.

Antes do primeiro lançamento, crie uma chave de assinatura permanente (keystore) em um local seguro. Nunca envie o arquivo keystore ou as senhas para o repositório.

O workflow `.github/workflows/android-apk.yml` espera estes quatro **Repository secrets**:

- `ANDROID_KEYSTORE_BASE64`: conteúdo do keystore codificado em Base64.
- `ANDROID_KEYSTORE_PASSWORD`: senha do keystore.
- `ANDROID_KEY_ALIAS`: alias da chave.
- `ANDROID_KEY_PASSWORD`: senha da chave.

Para criar uma chave com JDK 21, execute em um terminal local (ajuste o caminho de destino e defina suas próprias senhas fortes):

```powershell
keytool -genkeypair -v -keystore "$HOME\oficio-do-motor-release.jks" -alias oficio-do-motor -keyalg RSA -keysize 4096 -validity 10000
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\oficio-do-motor-release.jks")) | Set-Content "$HOME\oficio-do-motor-release-base64.txt" -NoNewline
```

No GitHub, abra **Settings > Secrets and variables > Actions > New repository secret** e cadastre os quatro valores. Para `ANDROID_KEYSTORE_BASE64`, use o conteúdo do arquivo `oficio-do-motor-release-base64.txt`. Use o mesmo alias e as senhas definidos na criação da chave.

Depois, abra **Actions > Build and publish official Android APK > Run workflow**. O workflow compila a variante `release`, verifica a assinatura e publica o arquivo em `public/downloads/OficioDoMotor.apk`. O deploy do site disponibiliza então o link:

`https://oficiodomotor.github.io/downloads/OficioDoMotor.apk`

O botão Android na tela de login do site só aparece quando esse arquivo já estiver publicado. O workflow não publica APK de depuração nem usa a chave em arquivos versionados.

**Importante:** mantenha o keystore e suas senhas em backup seguro. Perder a chave pode impedir a publicação de atualizações compatíveis para quem já instalou esta versão. Não compartilhe esses dados no chat ou no repositório.

Antes de divulgar amplamente, teste instalação, login, navegação, seleção/tirada de fotos, envio de imagens, links do WhatsApp e retorno do Android. A assinatura não elimina necessariamente os avisos do Android para instalações fora da Play Store.

## Versão do aplicativo

Antes de cada lançamento, atualize `versionCode` (sempre crescente) e `versionName` em `android/app/build.gradle`.
