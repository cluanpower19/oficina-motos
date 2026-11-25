import { describe, expect, it } from 'vitest'
import { planoPermiteFotos } from '../supabase/functions/_shared/assinatura'

describe('visibilidade das fotos de orçamentos', () => {
  it('permite consultar fotos existentes para oficinas do Plano Completo', () => {
    expect(planoPermiteFotos('completo')).toBe(true)
  })

  it('não condiciona a consulta à situação da assinatura', () => {
    // A função recebe apenas o plano: o bloqueio da assinatura impede gravações via RLS,
    // mas a consulta aos dados existentes continua disponível.
    expect(planoPermiteFotos('completo')).toBe(true)
  })

  it('não disponibiliza fotos do Plano Básico ou de planos desconhecidos', () => {
    expect(planoPermiteFotos('basico')).toBe(false)
    expect(planoPermiteFotos(null)).toBe(false)
    expect(planoPermiteFotos(undefined)).toBe(false)
  })
})
