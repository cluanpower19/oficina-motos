import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
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
  sair: () => Promise<void>
  recarregarPerfil: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({
  session: null,
  perfil: null,
  carregando: true,
  sair: async () => {},
  recarregarPerfil: async () => {},
})

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
      await supabase.rpc('criar_oficina', {
        p_nome: meta.oficina_nome,
        p_telefone: meta.telefone ?? '',
        p_usuario_nome: meta.nome ?? 'Dono',
      })
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

  useEffect(() => {
    const aplicar = async (s: Session | null) => {
      setSession(s)
      setPerfil(s ? await buscarPerfil(s) : null)
      setCarregando(false)
    }
    supabase.auth.getSession().then(({ data }) => aplicar(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => aplicar(s), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const sair = async () => {
    await supabase.auth.signOut()
  }

  const recarregarPerfil = useCallback(async () => {
    if (session) setPerfil(await buscarPerfil(session))
  }, [session])

  return <Ctx.Provider value={{ session, perfil, carregando, sair, recarregarPerfil }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
