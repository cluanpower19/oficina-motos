import { describe, expect, it } from 'vitest'
import {
  formatarPlaca,
  formatarTelefone,
  lerNumero,
  mensagemErro,
  lerNumeroEstrito,
  normalizarPlaca,
  validarAnoFabricacao,
  validarKmEntrada,
  validarPlaca,
} from '../src/lib/formatos'
import { linkWhatsApp, msgLembrete, msgOrcamento, msgPronta } from '../src/lib/whatsapp'
import { ROTULO, STATUS } from '../src/lib/status'
import { dataBR, somarDias, TIPOS } from '../src/lib/lembretes'

describe('mensagens de erro do banco', () => {
  it('distingue conflito de código de peça, placa e outros registros', () => {
    expect(mensagemErro({ code: '23505', message: 'duplicate key codigo' })).toBe('Já existe uma peça com esse código.')
    expect(mensagemErro({ code: '23505', message: 'duplicate key placa' })).toBe('Já existe uma moto com essa placa.')
    expect(mensagemErro({ code: '23505', message: 'duplicate key nome' })).toBe('Este registro já existe. Confira os dados e tente novamente.')
    expect(mensagemErro({ code: '23503', message: 'foreign key' })).toBe('foreign key')
  })
})

describe('cadastro de motos e clientes', () => {
  it('normaliza e formata placas antigas e padrão Mercosul', () => {
    expect(normalizarPlaca('abc-1d23')).toBe('ABC1D23')
    expect(formatarPlaca('abc1d23')).toBe('ABC1D23')
    expect(formatarPlaca('ABC1234')).toBe('ABC-1234')
    expect(validarPlaca('ABC-1234')).toBe(true)
    expect(validarPlaca('ABC1D23')).toBe(true)
    expect(validarPlaca('AB12345')).toBe(false)
    expect(validarPlaca('ABC12D34')).toBe(false)
  })

  it('formata telefones brasileiros com DDD', () => {
    expect(formatarTelefone('79999998888')).toBe('(79) 99999-8888')
    expect(formatarTelefone('7933334444')).toBe('(79) 3333-4444')
  })

  it('converte valores digitados no padrão brasileiro', () => {
    expect(lerNumero('1.250,75')).toBe(1250.75)
    expect(lerNumero('49.90')).toBe(49.9)
    expect(lerNumero('1.250')).toBe(1250)
    expect(lerNumero('1234.56')).toBe(1234.56)
    expect(lerNumero('inválido')).toBe(0)
    expect(lerNumeroEstrito('49,90')).toBe(49.9)
    expect(lerNumeroEstrito('')).toBeNull()
    expect(lerNumeroEstrito('inválido')).toBeNull()
  })

  it('valida anos de fabricação antes de cadastrar motos', () => {
    expect(validarAnoFabricacao(null, 2026)).toBeNull()
    expect(validarAnoFabricacao(2026, 2026)).toBeNull()
    expect(validarAnoFabricacao(2027, 2026)).toBeNull()
    expect(validarAnoFabricacao(1884, 2026)).toContain('ano de fabricação')
    expect(validarAnoFabricacao(2028, 2026)).toContain('ano de fabricação')
    expect(validarAnoFabricacao(2020.5, 2026)).toContain('ano de fabricação')
    expect(validarAnoFabricacao(Number.NaN, 2026)).toContain('ano de fabricação')
  })

  it('valida quilometragem antes de criar cliente ou moto', () => {
    expect(validarKmEntrada(null, 12000)).toBeNull()
    expect(validarKmEntrada(12000, 12000)).toBeNull()
    expect(validarKmEntrada(12500, 12000)).toBeNull()
    expect(validarKmEntrada(11999, 12000)).toContain('menor que a última registrada')
    expect(validarKmEntrada(-1, null)).toBe('Informe uma quilometragem válida.')
    expect(validarKmEntrada(1.5, null)).toBe('Informe uma quilometragem válida.')
    expect(validarKmEntrada(Number.NaN, null)).toBe('Informe uma quilometragem válida.')
  })
})

describe('orçamento e comunicação por WhatsApp', () => {
  const moto = { cliente: 'Carlos Luan', marca: 'Honda', modelo: 'CG 160', placa: 'ABC1D23' }

  it('gera link de WhatsApp apenas para telefone válido', () => {
    expect(linkWhatsApp('79999998888', 'Olá')).toContain('https://wa.me/5579999998888?text=')
    expect(linkWhatsApp('12345', 'Olá')).toBeNull()
  })

  it('personaliza o orçamento com primeiro nome, moto, placa e link', () => {
    const texto = msgOrcamento(moto, 'https://exemplo.com/orcamento/abc')
    expect(texto).toContain('Olá, Carlos!')
    expect(texto).toContain('Honda CG 160')
    expect(texto).toContain('ABC1D23')
    expect(texto).toContain('https://exemplo.com/orcamento/abc')
  })

  it('monta mensagens de entrega e lembrete com modelos personalizados', () => {
    expect(msgPronta(moto, 150).toLowerCase()).toContain('sua honda cg 160')
    expect(msgPronta(moto, 150, 'Oi {cliente}: total {total}')).toContain('Oi Carlos: total')
    expect(msgLembrete(moto, 'troca de óleo', 'Olá {cliente}, {tipo}')).toBe('Olá Carlos, troca de óleo')
  })
})

describe('fluxo de OS e lembretes', () => {
  it('mantém todos os estados da ordem de serviço com rótulos', () => {
    expect(STATUS).toHaveLength(7)
    for (const status of STATUS) expect(ROTULO[status]).toBeTruthy()
  })

  it('mantém tipos de lembrete e calcula datas sem perder o dia', () => {
    expect(TIPOS).toEqual(['oleo', 'revisao', 'pneu', 'outro'])
    expect(somarDias('2026-01-31', 1)).toBe('2026-02-01')
    expect(somarDias('2024-02-28', 1)).toBe('2024-02-29')
    expect(dataBR('2026-11-24')).toBe('24/11/2026')
  })
})
