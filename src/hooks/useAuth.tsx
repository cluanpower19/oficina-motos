import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type Perfil = {
  nome: string
  papel: 'dono' | 'mecanico'
  oficina: {
    id: string
    nome: string
    telefone: string | null
    endereco: string | null
    logo_url: string | null
    msg_orcamento: string | null
    msg_pronta: string | null
    msg_lembrete: string | null
    plano: string
    status_assinatura: string
    teste_ate: string
  }
}

type AuthCtx = {
  session: Session | null
  perfil: Perfil | null
  carregando: boolean
  recuperacao: boolean
  sair: () => Promise<void>
  recarregarPerfil: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({
  session: null,
  perfil: null,
  carregando: true,
  recuperacao: false,
  sair: async () => {},
  recarregarPerfil: async () => {},
})

export let erroCriacao = ''

async function buscarPerfil(session: Session): Promise<Perfil | null> {
  const ler = () =>
    supabase
      .from('usuarios')
      .select('nome, papel, oficinas(id, nome, telefone, endereco, logo_url, msg_orcamento, msg_pronta, msg_lembrete, plano, status_assinatura, teste_ate)')
      .eq('id', session.user.id)
      .maybeSingle()

  let { data } = await ler()

  // Primeiro login após cadastro: cria a oficina (dono) ou entra com o código (mecânico)
  if (!data) {
    const meta = session.user.user_metadata ?? {}
    if (meta.codigo_oficina) {
      await supabase.rpc('entrar_oficina', { p_codigo: meta.codigo_oficina, p_nome: meta.nome ?? 'Mecânico' })
      ;({ data } = await ler())
    } else if (meta.oficina_nome) {
      const r = await supabase.rpc('criar_oficina', {
        p_nome: meta.oficina_nome,
        p_telefone: meta.telefone ?? '',
        p_usuario_nome: meta.nome ?? 'Dono',
      })
      erroCriacao = r.error?.message ?? ''
      ;({ data } = await ler())
    }
  }
  if (!data) return null

  const of = Array.isArray(data.oficinas) ? data.oficinas[0] : data.oficinas
  return {
    nome: data.nome,
    papel: data.papel as Perfil['papel'],
    oficina: of as Perfil['oficina'],
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [recuperacao, setRecuperacao] = useState(false)
  const recuperacaoRef = useRef(false)

  useEffect(() => {
    const aplicar = async (s: Session | null, evento?: string) => {
      if (evento === 'PASSWORD_RECOVERY') {
        recuperacaoRef.current = true
        setRecuperacao(true)
        setSession(s)
        setPerfil(null)
        setCarregando(false)
        return
      }
      if (evento === 'SIGNED_OUT') {
        recuperacaoRef.current = false
        setRecuperacao(false)
      }
      setSession(s)
      if (recuperacaoRef.current) {
        setCarregando(false)
        return
      }
      setPerfil(s ? await buscarPerfil(s) : null)
      setCarregando(false)
    }
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      setTimeout(() => { void aplicar(s, evento) }, 0)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (!recuperacaoRef.current) void aplicar(data.session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const sair = async () => {
    await supabase.auth.signOut()
  }

  const recarregarPerfil = useCallback(async () => {
    if (session) setPerfil(await buscarPerfil(session))
  }, [session])

  return <Ctx.Provider value={{ session, perfil, carregando, recuperacao, sair, recarregarPerfil }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
