import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type FuncionalidadeOficina = {
  chave: string
  nome: string
  descricao: string | null
  habilitado: boolean
}

/**
 * Consulta os recursos liberados exclusivamente para a oficina logada.
 * Use temFuncionalidade('chave_do_recurso') para proteger telas e ações
 * de módulos adicionais. A segurança dos dados continua dependendo também
 * das políticas RLS do banco.
 */
export function useFeatureFlags() {
  const { perfil } = useAuth()
  const [recursos, setRecursos] = useState<FuncionalidadeOficina[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      if (!perfil?.oficina.id) {
        setRecursos([])
        setCarregando(false)
        return
      }
      setCarregando(true)
      const { data, error } = await supabase
        .from('oficina_funcionalidades')
        .select('chave,nome,descricao,habilitado')
        .eq('oficina_id', perfil.oficina.id)
        .eq('habilitado', true)
      if (!ativo) return
      setRecursos(error ? [] : (data ?? []) as FuncionalidadeOficina[])
      setCarregando(false)
    }
    void carregar()
    return () => { ativo = false }
  }, [perfil?.oficina.id])

  const temFuncionalidade = useCallback(
    (chave: string) => recursos.some(r => r.chave === chave && r.habilitado),
    [recursos],
  )

  return { recursos, carregando, temFuncionalidade }
}
