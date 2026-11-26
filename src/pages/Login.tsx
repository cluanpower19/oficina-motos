import { useEffect, useState, type FormEvent, type MouseEvent as MouseReact } from 'react'
import { Link } from 'react-router-dom'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import { Emblema } from '../components/Cenario'
import { Atmosfera } from '../components/Atmosfera'
import { URL_DOWNLOAD, noSite, urlInstalador, urlSite } from '../lib/urlSite'

const campo = 'campo'
const urlRedirecionamentoAuth = () => import.meta.env.MODE === 'test' ? window.location.origin : urlSite()

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
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: urlRedirecionamentoAuth() })
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
            await supabase.auth.signOut()
            window.history.replaceState(null, '', window.location.pathname)
            setModo('entrar')
            setSenhaNova('')
            setConfirmarSenha('')
            setAviso('Senha alterada com sucesso! Entre usando sua nova senha.')
          }
        }
      } else if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) setErro('E-mail ou senha incorretos. Se acabou de se cadastrar, confirme seu e-mail primeiro.')
      } else if (modo === 'mecanico') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: urlRedirecionamentoAuth(),
            data: { nome, codigo_oficina: codigo.trim().toLowerCase() },
          },
        })
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
            <input className={campo} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          )}
          {(modo === 'entrar' || modo === 'mecanico') && (
            <input className={campo} type="password" placeholder="Senha (mín. 6 caracteres)" minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} required />
          )}
          {modo === 'redefinir' && (
            <>
              <input className={campo} type="password" placeholder="Nova senha (mín. 6 caracteres)" minLength={6} value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} required />
              <input className={campo} type="password" placeholder="Confirme a nova senha" minLength={6} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required />
            </>
          )}

          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {aviso && <p className="text-sm text-green-700">{aviso}</p>}

          <button disabled={enviando} className="w-full rounded-lg bg-orange-500 py-3.5 text-lg hover:bg-orange-600 disabled:opacity-60">
            {enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : modo === 'mecanico' ? 'Criar acesso de mecânico' : modo === 'recuperar' ? 'Enviar link de recuperação' : 'Salvar nova senha'}
          </button>

          {modo === 'entrar' && (
            <>
              <button type="button" onClick={() => { setModo('recuperar'); setErro(''); setAviso('') }} className="link">
                Esqueci minha senha
              </button>
              <Link to="/cadastro" className="link">Criar conta e experimentar grátis por 7 dias</Link>
              <a href="https://wa.me/5579998424306?text=Ol%C3%A1!%20Quero%20falar%20sobre%20o%20Of%C3%ADcio%20do%20Motor." target="_blank" rel="noopener noreferrer" className="link">Falar com a equipe</a>
            </>
          )}
          {(modo === 'mecanico' || modo === 'recuperar' || modo === 'redefinir') && (
            <button type="button" onClick={() => { setModo('entrar'); setErro(''); setAviso('') }} className="link">
              Voltar para entrar
            </button>
          )}
          {modo === 'entrar' && (
            <button type="button" onClick={() => { setModo('mecanico'); setErro(''); setAviso('') }} className="link">
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
                <a href="/downloads/OficioDoMotor.apk" download className="download-app" aria-label="Baixar aplicativo Ofício do Motor para Android">
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
