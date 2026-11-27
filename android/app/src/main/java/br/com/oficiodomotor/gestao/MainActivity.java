package br.com.oficiodomotor.gestao;

import android.content.pm.PackageInfo;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "TurnstileWebView";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // O Turnstile precisa de recursos completos do WebView para carregar seus desafios.
        if (getBridge() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();

            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setLoadWithOverviewMode(true);
            settings.setUseWideViewPort(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setBlockNetworkLoads(false);

            // Mantém o User-Agent original do Android WebView, sem modificações.
            CookieManager cookies = CookieManager.getInstance();
            cookies.setAcceptCookie(true);
            cookies.setAcceptThirdPartyCookies(webView, true);

            String versaoWebView = "desconhecida";
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                PackageInfo provider = WebView.getCurrentWebViewPackage();
                if (provider != null && provider.versionName != null) {
                    versaoWebView = provider.versionName;
                }
            }

            Log.i(TAG, "WebView=" + versaoWebView
                    + "; JavaScript=" + settings.getJavaScriptEnabled()
                    + "; DOMStorage=" + settings.getDomStorageEnabled()
                    + "; cookies=" + cookies.acceptCookie()
                    + "; cookiesTerceiros=" + cookies.acceptThirdPartyCookies(webView)
                    + "; UserAgentOriginal=true");
        }
    }
}
