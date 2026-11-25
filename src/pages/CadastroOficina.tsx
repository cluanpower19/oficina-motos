import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { urlRedirecionamentoAuth } from '../lib/urlSite'

type Plano = 'basico' | 'completo'
const campo = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100'

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

  async function cadastrar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    let digitos = telefone.replace(/\D/g, '')
    if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) digitos = digitos.slice(2)
    if (!/^[1-9][1-9]9?\d{8}$/.test(digitos)) {
      setErro('Informe um telefone valido com DDD (10 ou 11 digitos).')
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
      setErro('Nao foi possivel iniciar o cadastro. Verifique sua conexao e tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1016] px-4 py-8 text-white sm:py-12">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link to="/" className="text-sm font-bold tracking-[.18em] text-orange-400">OFICIO DO MOTOR</Link>
        <Link to="/entrar" className="text-sm text-gray-300 underline underline-offset-4">Ja tenho uma conta</Link>
      </header>
      <section className="mx-auto mt-8 grid max-w-5xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-orange-400">Comece sem compromisso</p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">Sua oficina organizada em <span className="text-orange-400">7 dias gratis.</span></h1>
          <p className="max-w-xl text-base leading-relaxed text-gray-300">Escolha o plano e crie seu acesso. Nao pedimos cartao nem pagamento antecipado. O teste comeca depois da confirmacao do e-mail e do primeiro acesso.</p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- Todos os recursos do plano escolhido durante o teste.</li>
            <li>- Sem cobranca automatica ou cartao cadastrado.</li>
            <li>- Seus dados continuam disponiveis para consulta apos o teste.</li>
          </ul>
        </div>
        <form onSubmit={cadastrar} className="space-y-4 rounded-3xl bg-white p-5 text-gray-900 shadow-2xl shadow-black/30 sm:p-8">
          <div>
            <h2 className="text-2xl font-bold">Criar conta da oficina</h2>
            <p className="mt-1 text-sm text-gray-500">Preencha os dados para iniciar seu teste gratis.</p>
          </div>
          {confirmacao ? (
            <div role="status" className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">
              <h3 className="text-lg font-bold">Confira seu e-mail</h3>
              <p className="text-sm leading-relaxed">Enviamos um link de confirmacao para o endereco informado. Abra o link e entre no sistema para criar sua oficina e iniciar os sete dias de teste.</p>
              <p className="text-xs">Se nao encontrar a mensagem, verifique tambem a pasta de spam.</p>
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
                <span className="block text-xs font-normal text-gray-500">Minimo de 8 caracteres.</span>
              </label>
              <label className="block space-y-1 text-sm font-semibold">Plano para experimentar
                <select className={campo} value={plano} onChange={e => setPlano(e.target.value as Plano)}>
                  <option value="basico">Basico - R$ 49,90/mes</option>
                  <option value="completo">Completo - R$ 79,90/mes</option>
                </select>
              </label>
              {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
              <button disabled={enviando} className="w-full rounded-xl bg-orange-500 px-5 py-3.5 font-bold text-gray-950 transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60">
                {enviando ? 'Enviando...' : 'Criar conta e comecar 7 dias gratis'}
              </button>
              <p className="text-center text-xs leading-relaxed text-gray-500">Ao continuar, voce confirma que os dados informados sao verdadeiros. O teste e limitado a um por e-mail e telefone.</p>
            </>
          )}
        </form>
      </section>
    </main>
  )
}
