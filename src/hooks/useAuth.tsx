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
    vencimento_assinatura: string | null
    dia_ciclo: number | null
    cancelamento_agendado: boolean
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

function mensagemAmigavelCadastro(mensagem: string): string {
  const normalizada = mensagem.toLocaleLowerCase('pt-BR')
  if (normalizada.includes('utilizou o teste')) {
    return 'Este e-mail ou telefone já foi usado para iniciar um teste grátis. Cada e-mail e número de telefone pode participar de um único teste. Se você acredita que houve um engano ou deseja contratar um plano, fale com nossa equipe.'
  }
  if (normalizada.includes('confirme seu e-mail')) {
    return 'Confirme seu endereço de e-mail pelo link que enviamos e depois entre novamente para concluir o cadastro.'
  }
  return mensagem
}

// O SDK pode emitir INITIAL_SESSION e SIGNED_IN quase simultaneamente.
// Compartilha a mesma operação para impedir duas tentativas concorrentes de trial.
const buscasPerfil = new Map<string, Promise<Perfil | null>>()

function buscarPerfil(session: Session): Promise<Perfil | null> {
  const id = session.user.id
  const existente = buscasPerfil.get(id)
  if (existente) return existente
  const busca = buscarPerfilUnico(session)
  buscasPerfil.set(id, busca)
  const limpar = () => {
    if (buscasPerfil.get(id) === busca) buscasPerfil.delete(id)
  }
  void busca.then(limpar, limpar)
  return busca
}

async function buscarPerfilUnico(session: Session): Promise<Perfil | null> {
  erroCriacao = ''
  const ler = () =>
    supabase
      .from('usuarios')
      .select('nome, papel, oficinas(id, nome, telefone, endereco, logo_url, msg_orcamento, msg_pronta, msg_lembrete, plano, status_assinatura, teste_ate, vencimento_assinatura, dia_ciclo, cancelamento_agendado)')
      .eq('id', session.user.id)
      .maybeSingle()

  const primeiraConsulta = await ler()
  if (primeiraConsulta.error) {
    throw new Error('Não foi possível consultar o cadastro da oficina: ' + primeiraConsulta.error.message)
  }
  let { data } = primeiraConsulta

  // Primeiro acesso do dono inicia o trial; mecânicos entram pelo código de convite.
  if (!data) {
    const meta = session.user.user_metadata ?? {}
    if (meta.tipo_cadastro === 'oficina') {
      const r = await supabase.rpc('iniciar_trial_oficina', {
        p_nome: meta.nome_oficina,
        p_telefone: meta.telefone,
        p_usuario_nome: meta.nome,
        p_plano: meta.plano,
      })
      erroCriacao = r.error ? mensagemAmigavelCadastro(r.error.message) : ''
      if (r.error?.message.toLocaleLowerCase('pt-BR').includes('utilizou o teste')) {
        // A RPC valida novamente no servidor; falha no registro não pode impedir o acesso ao aviso.
        try { await supabase.rpc('registrar_alerta_trial_repetido') } catch { /* registro de auditoria não bloqueia a autenticação */ }
      }
      if (!r.error) {
        const consulta = await ler()
        if (consulta.error) throw new Error('O cadastro foi iniciado, mas não foi possível carregar a oficina: ' + consulta.error.message)
        data = consulta.data
      }
    } else if (meta.codigo_oficina) {
      const r = await supabase.rpc('entrar_oficina', { p_codigo: meta.codigo_oficina, p_nome: meta.nome ?? 'Mecânico' })
      erroCriacao = r.error ? mensagemAmigavelCadastro(r.error.message) : ''
      if (!r.error) {
        const consulta = await ler()
        if (consulta.error) throw new Error('O acesso foi criado, mas não foi possível carregar a oficina: ' + consulta.error.message)
        data = consulta.data
      }
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
      try {
        setPerfil(s ? await buscarPerfil(s) : null)
      } catch (error) {
        erroCriacao = error instanceof Error ? error.message : 'Falha de comunicação ao carregar sua oficina.'
        setPerfil(null)
      } finally {
        setCarregando(false)
      }
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
    if (!session) return
    setCarregando(true)
    try {
      setPerfil(await buscarPerfil(session))
    } catch (error) {
      erroCriacao = error instanceof Error ? error.message : 'Falha de comunicação ao carregar sua oficina.'
      setPerfil(null)
    } finally {
      setCarregando(false)
    }
  }, [session])

  return <Ctx.Provider value={{ session, perfil, carregando, recuperacao, sair, recarregarPerfil }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
