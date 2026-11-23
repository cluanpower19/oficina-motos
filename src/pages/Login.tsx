import { useState, type FormEvent } from 'react'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import { Chave, Emblema, MotoSilhueta } from '../components/Cenario'

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

  const titulo = modo === 'entrar' ? 'Entrar na oficina' : modo === 'mecanico' ? 'Entrar como mecânico' : 'Criar minha oficina'

  return (
    <div className="cena">
      <section className="cena-visual" aria-hidden="false">
        <div className="parede" aria-hidden="true" />
        <div className="portao" aria-hidden="true" />
        <div className="painel-ferramentas" aria-hidden="true">
          <Chave className="chave" style={{ width: '70%', left: '8%', top: '14%' }} />
          <Chave className="chave" style={{ width: '56%', left: '14%', top: '42%', transform: 'rotate(-4deg)' }} />
          <Chave className="chave" style={{ width: '64%', left: '6%', top: '70%', transform: 'rotate(3deg)' }} />
        </div>
        <div className="pendente" style={{ left: '30%', height: '16%' }} aria-hidden="true" />
        <div className="pendente" style={{ left: '62%', height: '11%', animationDelay: '-3s' }} aria-hidden="true" />
        <div className="neon" aria-hidden="true">Aberto</div>
        <div className="piso" aria-hidden="true" />
        <div className="poca-oleo" aria-hidden="true" />
        <MotoSilhueta className="moto-cena" />
        {[
          ['78%', '30%', '60px', '-70px', '0s'], ['79%', '31%', '-50px', '-90px', '0.5s'], ['77%', '30%', '90px', '-40px', '1.1s'],
          ['78%', '30%', '30px', '-110px', '1.7s'], ['80%', '31%', '-20px', '-60px', '2.1s'],
        ].map(([l, b, dx, dy, d], i) => (
          <span key={i} className="faisca" aria-hidden="true" style={{ left: l, bottom: b, animationDelay: d, ['--dx' as string]: dx, ['--dy' as string]: dy }} />
        ))}
        <div className="chao-listra" aria-hidden="true" />
        <div className="barra-cine topo" aria-hidden="true" />
        <div className="barra-cine base" aria-hidden="true" />
        <div className="cena-texto">
          <div className="marca">
            <Emblema tamanho={52} />
            <div className="marca-nome">
              Oficina
              <small>Moto · Gestão</small>
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
        </form>
      </section>
    </div>
  )
}
