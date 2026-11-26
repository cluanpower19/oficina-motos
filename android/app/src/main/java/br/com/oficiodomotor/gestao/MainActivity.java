package br.com.oficiodomotor.gestao;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // O Turnstile é carregado em um iframe externo no WebView do Capacitor.
        // Mantém cookies e armazenamento disponíveis para o desafio de segurança.
        if (getBridge() != null) {
            WebView webView = getBridge().getWebView();
            CookieManager cookies = CookieManager.getInstance();
            cookies.setAcceptCookie(true);
            cookies.setAcceptThirdPartyCookies(webView, true);
        }
    }
}
