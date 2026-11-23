import { useState, type FormEvent } from 'react'
import { supabase, supabaseConfigurado } from '../lib/supabase'

const campo =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-orange-500 focus:outline-none'

export default function Login() {
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar')
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
            data: {
              nome,
              oficina_nome: oficinaNome,
              telefone: telefone.replace(/\D/g, ''),
            },
          },
        })
        if (error) setErro(error.message)
        else if (!data.session) setAviso('Cadastro feito! Confirme o e-mail que enviamos e depois entre.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-800 p-4">
      <form onSubmit={enviar} className="w-full max-w-md space-y-4 rounded-2xl bg-gray-100 p-6 shadow-xl">
        <h1 className="text-center text-2xl font-bold text-gray-800">🏍️ Oficina Moto</h1>

        {!supabaseConfigurado && (
          <p className="rounded bg-yellow-100 p-3 text-sm text-yellow-800">
            Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.
          </p>
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

        <button disabled={enviando} className="w-full rounded-lg bg-orange-500 py-4 text-lg font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
          {enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar minha oficina'}
        </button>

        <button
          type="button"
          onClick={() => { setModo(modo === 'entrar' ? 'cadastrar' : 'entrar'); setErro(''); setAviso('') }}
          className="w-full text-center text-sm text-gray-700 underline"
        >
          {modo === 'entrar' ? 'Ainda não tenho conta' : 'Já tenho conta'}
        </button>
      </form>
    </div>
  )
}
