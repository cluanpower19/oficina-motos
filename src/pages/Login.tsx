import { useEffect, useState, type FormEvent, type MouseEvent as MouseReact } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { Link } from 'react-router-dom'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import { Emblema } from '../components/Cenario'
import { Atmosfera } from '../components/Atmosfera'
import { URL_DOWNLOAD, noSite, urlInstalador, urlSite } from '../lib/urlSite'

const campo = 'campo'
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
const urlRedirecionamentoAuth = () => import.meta.env.MODE === 'test' ? window.location.origin : urlSite()
const urlRecuperacaoSenha = () => {
  const destino = new URL(urlRedirecionamentoAuth())
  destino.searchParams.set('recovery', '1')
  return destino.toString()
}

export default function Login({ redefinir = false }: { redefinir?: boolean } = {}) {
  const [modo, setModo] = useState<'entrar' | 'mecanico' | 'recuperar' | 'redefinir'>(() => redefinir || window.location.hash.includes('type=recovery') ? 'redefinir' : 'entrar')
  const [codigo, setCodigo] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [linkWindows, setLinkWindows] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState('')
  const [senhaAlterada, setSenhaAlterada] = useState(false)

  useEffect(() => {
    if (!noSite) return
    urlInstalador('-win-x64.exe').then(setLinkWindows)
  }, [])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setEnviando(true)
    try {
      if (modo === 'recuperar') {
        if (!turnstileSiteKey || !captchaToken) {
          setErro('Conclua a verificação de segurança antes de solicitar a recuperação.')
          return
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: urlRecuperacaoSenha(), captchaToken })
        setCaptchaToken('')
        if (error) setErro(error.message)
        else setAviso('Se houver uma conta vinculada a esse e-mail, enviaremos um link para redefinir a senha. Confira sua caixa de entrada e o spam.')
      } else if (modo === 'redefinir') {
        if (senhaNova.length < 6) {
          setErro('A nova senha precisa ter pelo menos 6 caracteres.')
        } else if (senhaNova !== confirmarSenha) {
          setErro('As senhas não conferem.')
        } else {
          const { error } = await supabase.auth.updateUser({ password: senhaNova })
          if (error) setErro(error.message)
          else {
            setSenhaAlterada(true)
            setSenhaNova('')
            setConfirmarSenha('')
            setAviso('Senha alterada com sucesso! Agora clique em “Ir para login” e entre usando sua nova senha.')
          }
        }
      } else if (modo === 'entrar') {
        if (!turnstileSiteKey || !captchaToken) {
          setErro('Conclua a verificação de segurança antes de entrar.')
          return
        }
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha, options: { captchaToken } })
        setCaptchaToken('')
        if (error) {
          if (error.code === 'email_not_confirmed') setErro('Este e-mail ainda não foi confirmado. Confira sua caixa de entrada.')
          else if (error.code === 'too_many_requests') setErro('Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.')
          else if (error.code === 'invalid_credentials') setErro('O Supabase não reconheceu esse e-mail e essa senha. Confira se digitou a senha nova corretamente, respeitando maiúsculas, minúsculas e caracteres especiais.')
          else setErro(`Não foi possível entrar: ${error.message}${error.code ? ` (${error.code})` : ''}`)
        }
      } else if (modo === 'mecanico') {
        if (!turnstileSiteKey || !captchaToken) {
          setErro('Conclua a verificação de segurança antes de criar o acesso.')
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: urlRedirecionamentoAuth(),
            data: { nome, codigo_oficina: codigo.trim().toLowerCase() },
            captchaToken,
          },
        })
        setCaptchaToken('')
        if (error) setErro(error.message)
        else if (!data.session) setAviso('Cadastro iniciado! Enviamos um link de confirmação para seu e-mail. Confirme o endereço antes de entrar. Verifique também o spam.')
        else setAviso('Cadastro concluído. Você já pode entrar.')
      }
    } catch {
      setErro('Não foi possível concluir a solicitação. Verifique sua conexão e tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  function mover(e: MouseReact<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }

  const titulo = modo === 'entrar' ? 'Entrar na oficina' : modo === 'mecanico' ? 'Entrar como mecânico' : modo === 'recuperar' ? 'Recuperar senha' : 'Criar nova senha'

  return (
    <div className="cena">
      <section className="cena-visual" aria-hidden="false" onMouseMove={mover}>
        <div className="camera">
          <div className="foto-cena" aria-hidden="true" />
          <div className="luz-foto" aria-hidden="true" />
          <Atmosfera />
        </div>
        <div className="barra-cine topo" aria-hidden="true" />
        <div className="barra-cine base" aria-hidden="true" />
        <div className="cena-texto">
          <div className="marca">
            <Emblema tamanho={52} />
            <div className="marca-nome">
              Ofício
              <small>do motor · Gestão</small>
            </div>
          </div>
          <div>
            <h1 className="manchete">Chega de orçamento só de boca.</h1>
            <p className="sub-manchete">O cliente aprova pelo link no WhatsApp e a oficina guarda o dia e a hora. Depois não tem discussão.</p>
            <div className="assinatura">
              <span>Orçamento por link</span>
              <span>Histórico por placa</span>
              <span>Lembrete de óleo</span>
            </div>
          </div>
        </div>
      </section>

      <section className="cena-form">
        <form onSubmit={enviar} className="cartao-entrada space-y-3">
          <h2 className="titulo text-3xl text-gray-800">{titulo}</h2>

          {!supabaseConfigurado && (
            <p className="rounded bg-yellow-100 p-3 text-sm text-yellow-800">
              Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.
            </p>
          )}


          {modo === 'mecanico' && (
            <>
              <input className={campo} placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <input className={campo} placeholder="Código da oficina (peça ao dono)" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
            </>
          )}
          {modo !== 'redefinir' && (
            <input className={campo} type="email" autoComplete="username" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          )}
          {(modo === 'entrar' || modo === 'mecanico') && (
            <input className={campo} type="password" autoComplete="current-password" placeholder="Senha (mín. 6 caracteres)" minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} required />
          )}
          {(modo === 'entrar' || modo === 'recuperar' || modo === 'mecanico') && (
            <div className="flex flex-col items-center gap-2 py-2">
              {turnstileSiteKey ? (
                <Turnstile
                  key={modo}
                  siteKey={turnstileSiteKey}
                  options={{ action: modo === 'entrar' ? 'login' : modo === 'recuperar' ? 'recuperar_senha' : 'cadastro_mecanico', language: 'pt-BR', theme: 'light' }}
                  onSuccess={token => { setCaptchaToken(token); setErro('') }}
                  onExpire={() => setCaptchaToken('')}
                  onError={() => { setCaptchaToken(''); setErro('Não foi possível validar a verificação. Atualize a página e tente novamente.') }}
                />
              ) : (
                <p className="text-sm text-red-600">A verificação de segurança está indisponível. Tente novamente mais tarde.</p>
              )}
            </div>
          )}
          {modo === 'redefinir' && !senhaAlterada && (
            <>
              <input className={campo} type="password" placeholder="Nova senha (mín. 6 caracteres)" minLength={6} value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} required />
              <input className={campo} type="password" placeholder="Confirme a nova senha" minLength={6} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required />
            </>
          )}

          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {aviso && <p className="text-sm text-green-700">{aviso}</p>}

          {!senhaAlterada && (
            <button disabled={enviando || (['entrar', 'recuperar', 'mecanico'].includes(modo) && (!turnstileSiteKey || !captchaToken))} className="w-full rounded-lg bg-orange-500 py-3.5 text-lg hover:bg-orange-600 disabled:opacity-60">
              {enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : modo === 'mecanico' ? 'Criar acesso de mecânico' : modo === 'recuperar' ? 'Enviar link de recuperação' : 'Salvar nova senha'}
            </button>
          )}
          {modo === 'redefinir' && senhaAlterada && (
            <button type="button" onClick={() => { void supabase.auth.signOut() }} className="w-full rounded-lg bg-orange-500 py-3.5 text-lg hover:bg-orange-600">
              Ir para login
            </button>
          )}

          {modo === 'entrar' && (
            <>
              <button type="button" onClick={() => { setModo('recuperar'); setCaptchaToken(''); setErro(''); setAviso('') }} className="link">
                Esqueci minha senha
              </button>
              <Link to="/cadastro" className="link">Criar conta e experimentar grátis por 7 dias</Link>
              <a href="https://wa.me/5579998424306?text=Ol%C3%A1!%20Quero%20falar%20sobre%20o%20Of%C3%ADcio%20do%20Motor." target="_blank" rel="noopener noreferrer" className="link">Falar com a equipe</a>
            </>
          )}
          {(modo === 'mecanico' || modo === 'recuperar' || modo === 'redefinir') && (
            <button type="button" onClick={() => { setModo('entrar'); setCaptchaToken(''); setErro(''); setAviso('') }} className="link">
              Voltar para entrar
            </button>
          )}
          {modo === 'entrar' && (
            <button type="button" onClick={() => { setModo('mecanico'); setCaptchaToken(''); setErro(''); setAviso('') }} className="link">
              Sou mecânico e tenho o código da oficina
            </button>
          )}
          {noSite && (
            <div className="downloads-entrada mt-5 border-t border-gray-700 pt-4 text-center">
              <p className="mb-3 text-sm text-gray-400">Acesse pelo navegador ou use o aplicativo</p>
              <div className="downloads-lista">
                <a
                  href={linkWindows ?? URL_DOWNLOAD}
                  {...(linkWindows ? { download: true } : { target: '_blank', rel: 'noreferrer' })}
                  className="download-app"
                >
                  Baixar para Windows
                </a>
                <a href="/downloads/OficioDoMotor.apk?v=2" download className="download-app" aria-label="Baixar aplicativo Ofício do Motor para Android">
                  Baixar para Android
                </a>
              </div>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}
