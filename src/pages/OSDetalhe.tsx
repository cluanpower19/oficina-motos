import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarMoeda, formatarPlaca, formatarTelefone, lerNumero, lerNumeroEstrito, mensagemErro } from '../lib/formatos'
import { COR, ROTULO, STATUS, type StatusOS } from '../lib/status'
import { botao, campo } from './Clientes'
import { reduzirImagem } from '../lib/imagem'
import { linkWhatsApp, msgOrcamento, msgPronta } from '../lib/whatsapp'
import { useAuth } from '../hooks/useAuth'
import { hojeISO, somarDias } from '../lib/lembretes'
import { urlSite } from '../lib/urlSite'

type OS = {
  id: string
  numero: number
  status: StatusOS
  valor_total: number
  defeito_relatado: string | null
  km_entrada: number | null
  criado_em: string
  cliente_id: string
  oficina_id: string
  token_publico: string
  moto_id: string
  clientes: { nome: string; telefone: string | null } | null
  motos: { placa: string; marca: string | null; modelo: string | null } | null
}
type Item = { id: string; tipo: 'servico' | 'peca'; descricao: string; quantidade: number; valor_unitario: number; peca_id: string | null }
type Cat = { id: string; nome: string; preco: number }
type Foto = { id: string; path: string; url: string }

const vazio = { tipo: 'servico' as 'servico' | 'peca', catId: '', descricao: '', qtd: '1', valor: '' }

export default function OSDetalhe() {
  const { perfil } = useAuth()
  const location = useLocation()
  const avisoNavegacao = (location.state as { aviso?: string } | null)?.aviso ?? ''
  const completo = perfil?.oficina.plano === 'completo'
  const { id } = useParams()
  const [os, setOs] = useState<OS | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [servicos, setServicos] = useState<Cat[]>([])
  const [pecas, setPecas] = useState<Cat[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aberto, setAberto] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [f, setF] = useState(vazio)
  const [salvando, setSalvando] = useState(false)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        supabase
          .from('ordens_servico')
          .select('id, numero, status, valor_total, defeito_relatado, km_entrada, criado_em, cliente_id, moto_id, oficina_id, token_publico, clientes!ordens_servico_cliente_id_fkey(nome, telefone), motos!ordens_servico_moto_id_fkey(placa, marca, modelo)')
          .eq('id', id)
          .single(),
        supabase
          .from('os_itens')
          .select('id, tipo, descricao, quantidade, valor_unitario, peca_id')
          .eq('os_id', id)
          .order('criado_em'),
      ])

      if (a.error) {
        setOs(null)
        setErro(mensagemErro(a.error))
      } else {
        setOs(a.data as unknown as OS)
      }

      if (b.error) {
        setItens([])
        setErro((anterior) => anterior || mensagemErro(b.error))
      } else {
        setItens((b.data ?? []) as Item[])
      }

      if (completo) {
        const c = await supabase.from('os_fotos').select('id, path').eq('os_id', id).order('criado_em')
        if (c.error) {
          setFotos([])
          setErro((anterior) => anterior || mensagemErro(c.error))
        } else if (c.data?.length) {
          const { data: assinadas, error: erroAssinadas } = await supabase.storage.from('os-fotos').createSignedUrls(c.data.map((foto) => foto.path), 300)
          if (erroAssinadas) setErro((anterior) => anterior || mensagemErro(erroAssinadas))
          const urls = new Map((assinadas ?? []).map((foto) => [foto.path, foto.signedUrl]))
          setFotos(c.data.map((foto) => ({ ...foto, url: urls.get(foto.path) ?? '' })))
        } else {
          setFotos([])
        }
      } else {
        setFotos([])
      }
    } catch {
      setErro((anterior) => anterior || 'Não foi possível consultar esta ordem de serviço. Verifique sua conexão e tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [id, completo])

  useEffect(() => {
    carregar()
    supabase.from('servicos_catalogo').select('id, nome, valor_padrao').order('nome').then(({ data, error }) => {
      if (error) setErro((anterior) => anterior || mensagemErro(error))
      else setServicos((data ?? []).map((s) => ({ id: s.id, nome: s.nome, preco: Number(s.valor_padrao) })))
    })
    if (completo) {
      supabase.from('pecas').select('id, nome, preco_venda').order('nome').then(({ data, error }) => {
        if (error) setErro((anterior) => anterior || mensagemErro(error))
        else setPecas((data ?? []).map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco_venda) })))
      })
    } else {
      setPecas([])
    }
  }, [carregar, completo])

  async function mudarStatus(status: StatusOS) {
    if (!os || status === os.status) return
    setErro('')
    const { error } = await supabase.from('ordens_servico').update({ status }).eq('id', os.id)
    if (error) return setErro(mensagemErro(error))
    if (completo && status === 'entregue' && window.confirm('Criar lembrete de retorno (troca de óleo em 90 dias ou +1.500 km)? Você pode editar depois em Lembretes.')) {
      const r = await supabase.from('lembretes').insert({
        moto_id: os.moto_id,
        tipo: 'oleo',
        data_prevista: somarDias(hojeISO(), 90),
        km_previsto: os.km_entrada ? os.km_entrada + 1500 : null,
      })
      if (r.error) setErro(mensagemErro(r.error))
    }
    carregar()
  }

  function escolherCatalogo(catId: string) {
    const cat = (f.tipo === 'servico' ? servicos : pecas).find((c) => c.id === catId)
    if (!cat) return setF({ ...f, catId: '', descricao: '', valor: '' })
    setF({ ...f, catId, descricao: cat.nome, valor: String(cat.preco).replace('.', ',') })
  }

  function fechar() {
    setAberto(false)
    setEditId(null)
    setF(vazio)
  }
  function editar(i: Item) {
    setEditId(i.id)
    setF({ tipo: i.tipo, catId: i.peca_id ?? '', descricao: i.descricao, qtd: String(i.quantidade), valor: String(i.valor_unitario).replace('.', ',') })
    setAberto(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function salvarItem(e: FormEvent) {
    e.preventDefault()
    if (!os) return
    setErro('')
    setSalvando(true)
    const quantidade = lerNumeroEstrito(f.qtd)
    const valorUnitario = lerNumeroEstrito(f.valor)
    if (!f.descricao.trim()) {
      setSalvando(false)
      return setErro('Informe a descrição do item.')
    }
    if (quantidade === null || !Number.isSafeInteger(quantidade) || quantidade < 1) {
      setSalvando(false)
      return setErro('A quantidade deve ser um número inteiro maior que zero.')
    }
    if (valorUnitario === null || valorUnitario < 0) {
      setSalvando(false)
      return setErro('Informe um valor unitário válido e igual ou maior que zero.')
    }
    const dados = {
      tipo: f.tipo,
      descricao: f.descricao.trim(),
      quantidade,
      valor_unitario: valorUnitario,
      peca_id: f.tipo === 'peca' && f.catId ? f.catId : null,
    }
    const { error } = editId
      ? await supabase.from('os_itens').update(dados).eq('id', editId)
      : await supabase.from('os_itens').insert({ ...dados, os_id: os.id })
    setSalvando(false)
    if (error) return setErro(mensagemErro(error))
    fechar()
    carregar()
  }

  async function removerItem(i: Item) {
    if (!window.confirm(`Remover "${i.descricao}"?`)) return
    const { error } = await supabase.from('os_itens').delete().eq('id', i.id)
    if (error) setErro(mensagemErro(error))
    else carregar()
  }

  async function enviarFotos(lista: FileList | null) {
    if (!os || !lista?.length) return
    setErro('')
    setEnviandoFoto(true)
    for (const arq of Array.from(lista)) {
      let caminhoEnviado: string | null = null
      try {
        if (!arq.type.startsWith('image/')) throw new Error('Selecione somente arquivos de imagem.')
        if (arq.size > 15 * 1024 * 1024) throw new Error('A foto deve ter no máximo 15 MB.')
        const blob = await reduzirImagem(arq)
        const path = `${os.oficina_id}/${os.id}/${crypto.randomUUID()}.jpg`
        const up = await supabase.storage.from('os-fotos').upload(path, blob, { contentType: 'image/jpeg' })
        if (up.error) throw up.error
        caminhoEnviado = path
        const ins = await supabase.from('os_fotos').insert({ os_id: os.id, path })
        if (ins.error) throw ins.error
      } catch (e) {
        const erroOriginal = mensagemErro(e as { message: string })
        if (caminhoEnviado) {
          const limpeza = await supabase.storage.from('os-fotos').remove([caminhoEnviado])
          setErro(limpeza.error
            ? `${erroOriginal} O arquivo ficou no armazenamento e precisa de limpeza manual.`
            : erroOriginal)
        } else {
          setErro(erroOriginal)
        }
      }
    }
    setEnviandoFoto(false)
    carregar()
  }

  async function removerFoto(fo: Foto) {
    if (!window.confirm('Remover esta foto?')) return
    setErro('')
    const arquivo = await supabase.storage.from('os-fotos').remove([fo.path])
    if (arquivo.error) return setErro('Não foi possível remover o arquivo: ' + mensagemErro(arquivo.error))
    const { error } = await supabase.from('os_fotos').delete().eq('id', fo.id)
    if (error) return setErro('O arquivo foi removido, mas o registro da foto não: ' + mensagemErro(error))
    carregar()
  }

  async function copiarLink() {
    if (!os) return
    const link = `${urlSite()}orcamento/${os.token_publico}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      window.prompt('Copie o link do orçamento:', link)
    }
  }

  function dadosMsg() {
    if (!os) return null
    return { cliente: os.clientes?.nome ?? '', marca: os.motos?.marca, modelo: os.motos?.modelo, placa: os.motos?.placa ?? '' }
  }

  function enviarOrcamentoWhats() {
    const d = dadosMsg()
    if (!os || !d) return
    const link = linkWhatsApp(os.clientes?.telefone, msgOrcamento(d, `${urlSite()}orcamento/${os.token_publico}`, perfil?.oficina.msg_orcamento))
    if (!link) return setErro('O cliente não tem um telefone válido com DDD. Corrija no cadastro do cliente.')
    window.open(link, '_blank', 'noopener')
    if (os.status === 'orcamento') mudarStatus('aguardando_aprovacao')
  }

  function avisarProntaWhats() {
    const d = dadosMsg()
    if (!os || !d) return
    const link = linkWhatsApp(os.clientes?.telefone, msgPronta(d, Number(os.valor_total), perfil?.oficina.msg_pronta))
    if (!link) return setErro('O cliente não tem um telefone válido com DDD. Corrija no cadastro do cliente.')
    window.open(link, '_blank', 'noopener')
  }

  if (carregando) return <p className="text-gray-600">Carregando...</p>
  if (!os) return <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro || 'OS não encontrada.'}</p>

  const entregue = os.status === 'entregue'
  const cat = f.tipo === 'servico' ? servicos : pecas
  const tab = (ativo: boolean) =>
    `flex-1 rounded-lg px-4 py-2 text-center ${ativo ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`

  return (
    <div className="space-y-4">
      <Link to="/os" className="text-orange-600">← Ordens de Serviço</Link>

      <div className="space-y-2 rounded-xl bg-white p-4 shadow">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-800">OS #{os.numero}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${COR[os.status]}`}>{ROTULO[os.status]}</span>
        </div>
        <Link to={`/clientes/${os.cliente_id}`} className="block font-semibold text-gray-800 underline">{os.clientes?.nome}</Link>
        <div className="text-sm text-gray-600">
          {formatarTelefone(os.clientes?.telefone) || 'Sem telefone'} ·{' '}
          {os.motos ? `${formatarPlaca(os.motos.placa)} ${[os.motos.marca, os.motos.modelo].filter(Boolean).join(' ')}` : ''}
        </div>
        <div className="text-sm text-gray-600">
          Entrada: {new Date(os.criado_em).toLocaleDateString('pt-BR')}
          {os.km_entrada ? ` · ${os.km_entrada} km` : ''}
        </div>
        {os.defeito_relatado && <p className="rounded-lg bg-gray-50 p-3 text-gray-700">{os.defeito_relatado}</p>}
        <label className="block pt-1 text-sm text-gray-600">
          Status
          <select className={campo} value={os.status} disabled={entregue} onChange={(e) => mudarStatus(e.target.value as StatusOS)}>
            {STATUS.map((s) => (
              <option key={s} value={s}>{ROTULO[s]}</option>
            ))}
          </select>
          {entregue && <p className="mt-2 text-xs text-gray-500">OS entregue e finalizada. Para manter o histórico financeiro correto, não é possível alterar o status ou os itens.</p>}
        </label>
        {completo && <p className="text-xs text-gray-500">As peças saem do estoque ao iniciar a OS ou ao finalizá-la diretamente como Pronto/Entregue, uma única vez.</p>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-800">Itens</h2>
        {!entregue && <button className={botao} onClick={aberto ? fechar : () => setAberto(true)}>{aberto ? 'Cancelar' : '+ Item'}</button>}
      </div>

      {aberto && (
        <form onSubmit={salvarItem} className="space-y-3 rounded-xl bg-white p-4 shadow">
          <div className="flex gap-2">
            <button type="button" className={tab(f.tipo === 'servico')} onClick={() => setF({ ...vazio, tipo: 'servico' })}>Serviço</button>
            {completo && <button type="button" className={tab(f.tipo === 'peca')} onClick={() => setF({ ...vazio, tipo: 'peca' })}>Peça</button>}
          </div>
          <select className={campo} value={f.catId} onChange={(e) => escolherCatalogo(e.target.value)}>
            <option value="">Digitar livre (fora do catálogo)</option>
            {cat.map((c) => (
              <option key={c.id} value={c.id}>{c.nome} — {formatarMoeda(c.preco)}</option>
            ))}
          </select>
          <input className={campo} placeholder="Descrição" required value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              Quantidade
              <input className={campo} inputMode="numeric" value={f.qtd} onChange={(e) => setF({ ...f, qtd: e.target.value })} />
            </label>
            <label className="text-sm text-gray-600">
              Valor unitário (R$)
              <input className={campo} inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
            </label>
          </div>
          <button className={botao + ' w-full'} disabled={salvando}>
            {salvando ? 'Salvando...' : editId ? 'Salvar alterações' : 'Adicionar'}
          </button>
        </form>
      )}

      {avisoNavegacao && <p className="rounded-lg bg-yellow-50 p-3 text-yellow-800" role="status">{avisoNavegacao}</p>}
      {erro && <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro}</p>}

      {itens.length === 0 ? (
        <p className="text-gray-600">Nenhum item ainda. Toque em "+ Item".</p>
      ) : (
        <ul className="space-y-2">
          {itens.map((i) => (
            <li key={i.id} className="rounded-xl bg-white p-4 shadow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-800">{i.descricao}</div>
                  <div className="text-sm text-gray-500">
                    {i.tipo === 'servico' ? 'Serviço' : 'Peça'} · {i.quantidade} x {formatarMoeda(Number(i.valor_unitario))}
                  </div>
                </div>
                <div className="font-semibold text-gray-800">{formatarMoeda(i.quantidade * Number(i.valor_unitario))}</div>
              </div>
              {!entregue && <div className="mt-2 flex justify-end gap-2 text-sm">
                <button onClick={() => editar(i)} className="rounded-lg bg-gray-100 px-3 py-2">Editar</button>
                <button onClick={() => removerItem(i)} className="rounded-lg bg-red-50 px-3 py-2 text-red-700">Remover</button>
              </div>}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between rounded-xl bg-gray-800 p-4 text-white">
        <span>Total</span>
        <span className="text-2xl font-bold text-orange-400">{formatarMoeda(Number(os.valor_total))}</span>
      </div>

      {completo ? (
      <div className="space-y-3 rounded-xl bg-white p-4 shadow">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800">Fotos</h2>
          <label className={botao + ' cursor-pointer'}>
            {enviandoFoto ? 'Enviando...' : '+ Foto'}
            <input type="file" accept="image/*" capture="environment" multiple hidden disabled={enviandoFoto} onChange={(e) => { enviarFotos(e.target.files); e.target.value = '' }} />
          </label>
        </div>
        {fotos.length === 0 ? (
          <p className="text-sm text-gray-600">Sem fotos. Elas aparecem no orçamento do cliente.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {fotos.map((fo) => (
              <div key={fo.id} className="relative">
                <img src={fo.url} alt="Foto da OS" className="h-32 w-full rounded-lg object-cover" />
                <button onClick={() => removerFoto(fo)} className="absolute right-1 top-1 rounded-full bg-red-600 px-2 py-1 text-xs text-white" aria-label="Remover foto">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
      ) : (
        <div className="rounded-xl border border-[#364152] bg-[#101925] p-4 text-sm text-slate-300">Fotos da ordem de serviço estão disponíveis no Plano Completo.</div>
      )}

      <div className="space-y-2 rounded-xl bg-white p-4 shadow">
        <h2 className="text-lg font-bold text-gray-800">Orçamento para o cliente</h2>
        <p className="text-sm text-gray-600">Link com botões Aprovar/Recusar. Ao enviar, o status vai para "Aguardando aprovação".</p>
        <button className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white" onClick={enviarOrcamentoWhats}>
          Enviar orçamento por WhatsApp
        </button>
        {(os.status === 'pronto' || os.status === 'entregue') && (
          <button className="w-full rounded-lg bg-green-100 px-4 py-3 font-semibold text-green-800" onClick={avisarProntaWhats}>
            Avisar cliente: moto pronta
          </button>
        )}
        <div className="flex gap-2">
          <button className={botao + ' flex-1'} onClick={copiarLink}>{copiado ? 'Link copiado!' : 'Copiar link'}</button>
          <a className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-center text-gray-800" href={`${import.meta.env.BASE_URL}orcamento/${os.token_publico}`} target="_blank" rel="noreferrer">Abrir</a>
        </div>
      </div>
    </div>
  )
}
