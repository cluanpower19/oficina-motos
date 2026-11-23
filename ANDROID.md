# Aplicativo Android — Ofício do Motor

O aplicativo Android é gerado com Capacitor a partir do mesmo projeto React/Vite. O site continua sendo a versão principal; não é necessário manter uma segunda aplicação.

## Requisitos para gerar o APK

- Node.js compatível com o projeto.
- Android Studio instalado.
- JDK 21 (pode ser o JDK incluído no Android Studio).
- Android SDK instalado pelo Android Studio, incluindo a plataforma e as ferramentas de build indicadas pelo projeto Gradle.

## Preparar e abrir o projeto

```bash
npm install
npm run android:sync
npm run android:open
```

Sempre que houver alterações no sistema web, execute `npm run android:sync` para atualizar os arquivos usados pelo aplicativo.

## Gerar APK para distribuição

No Android Studio:

1. Abra o projeto `android`.
2. Aguarde a sincronização do Gradle.
3. Selecione **Build > Generate Signed Bundle / APK**.
4. Escolha **APK**.
5. Crie ou selecione uma chave de assinatura (keystore) de lançamento.
6. Selecione a variante `release` e conclua a geração.

O APK de lançamento costuma ficar em `android/app/release/`.

**Importante:** guarde o arquivo keystore e suas senhas em local seguro e com backup. Eles serão necessários para assinar futuras atualizações do aplicativo. Nunca envie a chave ou as senhas para o repositório.

Antes de publicar o APK no site, teste instalação, login, navegação, seleção/tirada de fotos, envio de imagens, links do WhatsApp e retorno do Android. O APK de depuração não deve ser usado como versão oficial de distribuição.

## Versão do aplicativo

Antes de cada lançamento, atualize `versionCode` (sempre crescente) e `versionName` em `android/app/build.gradle`.
