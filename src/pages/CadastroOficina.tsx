import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import { supabase } from '../lib/supabase'
import { Emblema } from '../components/Cenario'

import { urlRedirecionamentoAuth } from '../lib/urlSite'
import './cadastro-oficina.css'

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

type Plano = 'basico' | 'completo'
const campo = 'cadastro-campo w-full rounded-xl px-4 py-3 text-base outline-none transition'

export default function CadastroOficina() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [plano, setPlano] = useState<Plano>(params.get('plano') === 'completo' ? 'completo' : 'basico')
  const [oficina, setOficina] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmacao, setConfirmacao] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaErro, setCaptchaErro] = useState('')

  async function cadastrar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    if (!turnstileSiteKey) {
      setErro('A proteção de segurança do cadastro ainda não foi configurada. Tente novamente mais tarde.')
      return
    }
    if (!captchaToken) {
      setErro('Conclua a verificação de segurança antes de criar sua conta.')
      return
    }
    let digitos = telefone.replace(/\D/g, '')
    if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) digitos = digitos.slice(2)
    if (!/^[1-9][1-9]9?\d{8}$/.test(digitos)) {
      setErro('Informe um telefone válido com DDD (10 ou 11 dígitos).')
      return
    }
    if (senha.length < 8) {
      setErro('Use uma senha com pelo menos 8 caracteres.')
      return
    }
    setEnviando(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: senha,
        options: {
          emailRedirectTo: urlRedirecionamentoAuth(),
          captchaToken,
          data: {
            tipo_cadastro: 'oficina',
            nome_oficina: oficina.trim(),
            nome: responsavel.trim(),
            telefone: digitos,
            plano,
          },
        },
      })
      if (error) setErro(error.message)
      else if (data.session) navigate('/', { replace: true })
      else setConfirmacao(true)
    } catch {
      setErro('Não foi possível iniciar o cadastro. Verifique sua conexão e tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="cadastro-oficina min-h-screen px-4 py-8 text-white sm:py-12">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 text-sm font-bold tracking-[.18em] text-orange-400"><Emblema tamanho={40} /><span>OFÍCIO DO MOTOR</span></Link>
        <Link to="/entrar" className="text-sm text-gray-300 underline underline-offset-4">Já tenho uma conta</Link>
      </header>
      <section className="mx-auto mt-8 grid max-w-5xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-orange-400">Comece sem compromisso</p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">Sua oficina organizada em <span className="text-orange-400">7 dias grátis.</span></h1>
          <p className="max-w-xl text-base leading-relaxed text-gray-300">Escolha o plano e crie seu acesso. Não pedimos cartão nem pagamento antecipado. O teste começa depois da confirmação do e-mail e do primeiro acesso.</p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- Todos os recursos do plano escolhido durante o teste.</li>
            <li>- Sem cobrança automática ou cartão cadastrado.</li>
            <li>- Seus dados continuam disponíveis para consulta após o teste.</li>
          </ul>
        </div>
        <form onSubmit={cadastrar} className="cadastro-form space-y-4 rounded-3xl p-5 shadow-2xl sm:p-8">
          <div>
            <h2 className="text-2xl font-bold">Criar conta da oficina</h2>
            <p className="mt-1 text-sm text-gray-500">Preencha os dados para iniciar seu teste grátis.</p>
          </div>
          {confirmacao ? (
            <div role="status" className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">
              <h3 className="text-lg font-bold">Confira seu e-mail</h3>
              <p className="text-sm leading-relaxed">Enviamos um link de confirmação para o endereço informado. Abra o link e entre no sistema para criar sua oficina e iniciar os sete dias de teste.</p>
              <p className="text-xs">Se não encontrar a mensagem, verifique também a pasta de spam.</p>
              <Link to="/entrar" className="inline-block font-semibold underline">Ir para entrar</Link>
            </div>
          ) : (
            <>
              <label className="block space-y-1 text-sm font-semibold">Nome da oficina
                <input className={campo} value={oficina} onChange={e => setOficina(e.target.value)} maxLength={120} autoComplete="organization" required />
              </label>
              <label className="block space-y-1 text-sm font-semibold">Seu nome
                <input className={campo} value={responsavel} onChange={e => setResponsavel(e.target.value)} maxLength={100} autoComplete="name" required />
              </label>
              <label className="block space-y-1 text-sm font-semibold">Telefone com DDD
                <input className={campo} type="tel" inputMode="numeric" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(79) 99999-9999" autoComplete="tel" required />
              </label>
              <label className="block space-y-1 text-sm font-semibold">E-mail
                <input className={campo} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
              </label>
              <label className="block space-y-1 text-sm font-semibold">Senha
                <input className={campo} type="password" minLength={8} value={senha} onChange={e => setSenha(e.target.value)} autoComplete="new-password" required />
                <span className="block text-xs font-normal text-gray-500">Mínimo de 8 caracteres.</span>
              </label>
              <label className="block space-y-1 text-sm font-semibold">Plano para experimentar
                <select className={campo} value={plano} onChange={e => setPlano(e.target.value as Plano)}>
                  <option value="basico">Básico — R$ 49,90/mês</option>
                  <option value="completo">Completo — R$ 79,90/mês</option>
                </select>
              </label>
              {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
              <div className="space-y-2">
                {turnstileSiteKey ? (
                  <Turnstile
                    siteKey={turnstileSiteKey}
                    options={{ language: 'pt-BR', theme: 'light', action: 'cadastro_oficina' }}
                    onSuccess={token => { setCaptchaToken(token); setCaptchaErro('') }}
                    onExpire={() => setCaptchaToken('')}
                    onError={() => { setCaptchaToken(''); setCaptchaErro('Não foi possível validar a verificação. Atualize a página e tente novamente.') }}
                  />
                ) : (
                  <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">A proteção de segurança ainda não foi configurada. O cadastro ficará indisponível até a ativação.</p>
                )}
                {captchaErro && <p role="alert" className="text-sm text-red-700">{captchaErro}</p>}
              </div>
              <button disabled={enviando || !turnstileSiteKey || !captchaToken} className="w-full rounded-xl bg-orange-500 px-5 py-3.5 font-bold text-gray-950 transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60">
                {enviando ? 'Enviando...' : 'Criar conta e começar 7 dias grátis'}
              </button>
              <p className="text-center text-xs leading-relaxed text-gray-500">Ao continuar, você confirma que os dados informados são verdadeiros. O teste é limitado a um por e-mail e telefone.</p>
            </>
          )}
        </form>
      </section>
    </main>
  )
}
