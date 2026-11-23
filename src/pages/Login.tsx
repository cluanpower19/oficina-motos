import { useEffect, useState, type FormEvent, type MouseEvent as MouseReact } from 'react'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import { Emblema } from '../components/Cenario'
import { Atmosfera } from '../components/Atmosfera'
import { URL_DOWNLOAD, noSite, urlInstalador } from '../lib/urlSite'

const campo = 'campo'

export default function Login() {
  const [modo, setModo] = useState<'entrar' | 'cadastrar' | 'mecanico'>('entrar')
  const [codigo, setCodigo] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [oficinaNome, setOficinaNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [linkWindows, setLinkWindows] = useState<string | null>(null)
  const [linkMac, setLinkMac] = useState<string | null>(null)

  useEffect(() => {
    if (!noSite) return
    urlInstalador('-win-x64.exe').then(setLinkWindows)
    urlInstalador(navigator.userAgent.includes('Mac') ? '-mac-arm64.dmg' : '-mac-x64.dmg').then(setLinkMac)
  }, [])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setEnviando(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) setErro('E-mail ou senha incorretos.')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data:
              modo === 'mecanico'
                ? { nome, codigo_oficina: codigo.trim().toLowerCase() }
                : { nome, oficina_nome: oficinaNome, telefone: telefone.replace(/\D/g, '') },
          },
        })
        if (error) setErro(error.message)
        else if (!data.session) setAviso('Cadastro feito! Confirme o e-mail que enviamos e depois entre.')
      }
    } finally {
      setEnviando(false)
    }
  }

  function mover(e: MouseReact<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }

  const titulo = modo === 'entrar' ? 'Entrar na oficina' : modo === 'mecanico' ? 'Entrar como mecânico' : 'Criar minha oficina'

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
          {modo === 'cadastrar' && <p className="text-sm text-gray-600">Teste grátis por 7 dias. Sem cartão.</p>}

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
          {modo === 'cadastrar' && (
            <>
              <input className={campo} placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <input className={campo} placeholder="Nome da oficina" value={oficinaNome} onChange={(e) => setOficinaNome(e.target.value)} required />
              <input className={campo} placeholder="Telefone com DDD" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
            </>
          )}
          <input className={campo} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={campo} type="password" placeholder="Senha (mín. 6 caracteres)" minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} required />

          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {aviso && <p className="text-sm text-green-700">{aviso}</p>}

          <button disabled={enviando} className="w-full rounded-lg bg-orange-500 py-3.5 text-lg hover:bg-orange-600 disabled:opacity-60">
            {enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : modo === 'mecanico' ? 'Entrar na oficina' : 'Criar minha oficina'}
          </button>

          <button
            type="button"
            onClick={() => { setModo(modo === 'entrar' ? 'cadastrar' : 'entrar'); setErro(''); setAviso('') }}
            className="link"
          >
            {modo === 'entrar' ? 'Quero cadastrar minha oficina' : 'Já tenho conta, quero entrar'}
          </button>
          {modo !== 'mecanico' && (
            <button type="button" onClick={() => { setModo('mecanico'); setErro(''); setAviso('') }} className="link">
              Sou mecânico e tenho o código da oficina
            </button>
          )}
          {noSite && (
            <div className="downloads-entrada mt-5 border-t border-gray-700 pt-4 text-center">
              <p className="mb-3 text-sm text-gray-400">Baixe o aplicativo para seu dispositivo</p>
              <div className="downloads-lista">
                <a
                  href={linkWindows ?? URL_DOWNLOAD}
                  {...(linkWindows ? { download: true } : { target: '_blank', rel: 'noreferrer' })}
                  className="download-app"
                >
                  Baixar para Windows
                </a>
                <a
                  href={linkMac ?? URL_DOWNLOAD}
                  {...(linkMac ? { download: true } : { target: '_blank', rel: 'noreferrer' })}
                  className="download-app"
                >
                  Baixar para Mac
                </a>
                <a href="/downloads/OficioDoMotor.apk" download className="download-app" aria-label="Baixar aplicativo Ofício do Motor para Android">
                  Baixar aplicativo para Android (APK)
                </a>
              </div>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}
