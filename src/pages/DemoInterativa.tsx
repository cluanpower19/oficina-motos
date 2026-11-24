import { useMemo, useState } from 'react'

type Status = 'Orçamento' | 'Em andamento' | 'Pronto'
type Ordem = { id: number; cliente: string; moto: string; servico: string; valor: number; status: Status }
const iniciais: Ordem[] = [
  { id: 248, cliente: 'Marcos Oliveira', moto: 'Honda CG 160', servico: 'Revisão completa', valor: 680, status: 'Em andamento' },
  { id: 247, cliente: 'Ana Paula Santos', moto: 'Yamaha Fazer 250', servico: 'Troca de relação', valor: 320, status: 'Orçamento' },
  { id: 246, cliente: 'Rafael Costa', moto: 'Honda Biz 125', servico: 'Freios e regulagem', valor: 180, status: 'Pronto' },
]
const clientes = [
  { nome: 'Marcos Oliveira', moto: 'Honda CG 160 · 2022', placa: 'ABC1D23' },
  { nome: 'Ana Paula Santos', moto: 'Yamaha Fazer 250 · 2021', placa: 'DEF4G56' },
  { nome: 'Rafael Costa', moto: 'Honda Biz 125 · 2023', placa: 'GHI7J89' },
]
const estoqueInicial = [{ nome: 'Óleo 10W30', qtd: 8 }, { nome: 'Filtro de óleo', qtd: 12 }, { nome: 'Pastilha de freio', qtd: 5 }]
const dinheiro = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function DemoInterativa() {
  const [aba, setAba] = useState('Painel')
  const [ordens, setOrdens] = useState(iniciais)
  const [estoque, setEstoque] = useState(estoqueInicial)
  const [busca, setBusca] = useState('')
  const [aviso, setAviso] = useState('Você está em uma oficina de demonstração. Nenhuma informação é enviada ou salva.')
  const [contador, setContador] = useState(0)
  const totalAberto = ordens.filter(o => o.status !== 'Pronto').length
  const recebido = ordens.filter(o => o.status === 'Pronto').reduce((s, o) => s + o.valor, 0) + 4250
  const filtrados = useMemo(() => ordens.filter(o => `${o.cliente} ${o.moto} ${o.id}`.toLowerCase().includes(busca.toLowerCase())), [ordens, busca])

  function novaOrdem() {
    const id = 249 + contador
    setContador(v => v + 1)
    setOrdens(v => [{ id, cliente: 'Cliente de demonstração', moto: 'Yamaha Fazer 150', servico: 'Revisão básica', valor: 240, status: 'Orçamento' }, ...v])
    setAba('Ordens de serviço')
    setAviso(`OS #${id} criada com dados fictícios. Experimente avançar o status.`)
  }
  function avancar(id: number) {
    setOrdens(v => v.map(o => o.id !== id ? o : { ...o, status: o.status === 'Orçamento' ? 'Em andamento' : o.status === 'Em andamento' ? 'Pronto' : 'Pronto' }))
    setAviso(`A situação da OS #${id} foi atualizada apenas nesta demonstração.`)
  }
  function consumir(nome: string) {
    setEstoque(v => v.map(p => p.nome === nome ? { ...p, qtd: Math.max(0, p.qtd - 1) } : p))
    setAviso(`Uma unidade de ${nome} foi baixada no estoque fictício.`)
  }
  function reiniciar() {
    setOrdens(iniciais); setEstoque(estoqueInicial); setBusca(''); setContador(0); setAba('Painel')
    setAviso('Demonstração reiniciada. Os dados voltaram ao exemplo inicial.')
  }

  return <section id="demo" className="sp-live-demo">
    <div className="sp-section-kicker"><span>04</span> AGORA É SUA VEZ DE EXPERIMENTAR</div>
    <div className="sp-live-heading"><div><h2>Entre na oficina.<br/><em>Teste sem compromisso.</em></h2><p>Explore uma oficina fictícia, crie uma ordem de serviço, avance atendimentos e consulte o estoque. Tudo acontece aqui, sem cadastro e sem tocar em dados reais.</p></div><span className="sp-live-tag"><i/> AMBIENTE SEGURO DE DEMONSTRAÇÃO</span></div>
    <div className="sp-live-shell">
      <header className="sp-live-top"><div className="sp-live-brand"><span>OM</span><b>OFÍCIO DO MOTOR</b><small>DEMONSTRAÇÃO</small></div><div className="sp-live-shop"><i/> OFICINA EXEMPLO <span>·</span> MODO DE TESTE</div><button type="button" onClick={reiniciar}>↺ Reiniciar</button></header>
      <div className="sp-live-workspace">
        <nav className="sp-live-sidebar" aria-label="Áreas da demonstração">{['Painel','Ordens de serviço','Clientes e motos','Estoque','Financeiro'].map((n,i)=><button type="button" key={n} className={aba===n?'active':''} onClick={()=>setAba(n)}><span>{['▦','▤','♙','◈','R$'][i]}</span>{n}</button>)}<div className="sp-live-side-note">AMBIENTE FICTÍCIO<br/>As alterações são temporárias.</div></nav>
        <div className="sp-live-main">
          <div className="sp-live-pagehead"><div><small>OFICINA EXEMPLO / {aba.toUpperCase()}</small><h3>{aba === 'Painel' ? 'Bom trabalho. Veja como está a oficina.' : aba}</h3></div><span className="sp-live-date">HOJE · DEMONSTRAÇÃO</span></div>
          {aba === 'Painel' && <>
            <div className="sp-live-metrics"><article><small>ORDENS EM ABERTO</small><b>{String(totalAberto).padStart(2,'0')}</b><span>atendimentos em andamento</span></article><article><small>CLIENTES CADASTRADOS</small><b>128</b><span>cadastros fictícios</span></article><article><small>RECEBIDO NO MÊS</small><b>{dinheiro(recebido)}</b><span>valores de exemplo</span></article></div>
            <div className="sp-live-panel"><div className="sp-live-panel-title"><div><b>Movimento recente</b><small>Ordens de serviço de exemplo</small></div><button type="button" onClick={()=>setAba('Ordens de serviço')}>Ver todas →</button></div>{ordens.slice(0,4).map(o=><div className="sp-live-order" key={o.id}><span className="sp-live-os-id">OS #{o.id}</span><span className="sp-live-os-info"><b>{o.cliente}</b><small>{o.moto} · {o.servico}</small></span><em className={`sp-live-status ${o.status==='Pronto'?'done':o.status==='Em andamento'?'doing':'quote'}`}>{o.status}</em><strong>{dinheiro(o.valor)}</strong></div>)}</div>
            <button className="sp-live-primary" type="button" onClick={novaOrdem}>＋ Criar ordem de serviço de teste</button>
          </>}
          {aba === 'Ordens de serviço' && <>
            <div className="sp-live-toolbar"><input aria-label="Buscar ordem" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por cliente, moto ou número da OS"/><button className="sp-live-primary" type="button" onClick={novaOrdem}>＋ Nova OS</button></div>
            <div className="sp-live-panel"><div className="sp-live-panel-title"><div><b>Ordens da oficina</b><small>{filtrados.length} registros fictícios</small></div></div>{filtrados.map(o=><div className="sp-live-order" key={o.id}><span className="sp-live-os-id">OS #{o.id}</span><span className="sp-live-os-info"><b>{o.cliente}</b><small>{o.moto} · {o.servico}</small></span><em className={`sp-live-status ${o.status==='Pronto'?'done':o.status==='Em andamento'?'doing':'quote'}`}>{o.status}</em><strong>{dinheiro(o.valor)}</strong><button className="sp-live-small-action" type="button" disabled={o.status==='Pronto'} onClick={()=>avancar(o.id)}>{o.status==='Orçamento'?'Iniciar':o.status==='Em andamento'?'Marcar pronto':'Concluída'}</button></div>)}{!filtrados.length&&<p className="sp-live-empty">Nenhuma ordem encontrada. Tente outro termo.</p>}</div>
          </>}
          {aba === 'Clientes e motos' && <div className="sp-live-panel"><div className="sp-live-panel-title"><div><b>Clientes cadastrados</b><small>Dados fictícios para conhecer a organização</small></div></div>{clientes.map(c=><div className="sp-live-client" key={c.placa}><span>{c.nome.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><div><b>{c.nome}</b><small>{c.moto}</small></div><code>{c.placa}</code></div>)}</div>}
          {aba === 'Estoque' && <div className="sp-live-panel"><div className="sp-live-panel-title"><div><b>Peças e estoque</b><small>Experimente dar baixa em uma unidade</small></div></div>{estoque.map(p=><div className="sp-live-stock" key={p.nome}><span>{p.nome}</span><b className={p.qtd<=2?'low':''}>{p.qtd} un.</b><button type="button" disabled={!p.qtd} onClick={()=>consumir(p.nome)}>− Dar baixa</button></div>)}</div>}
          {aba === 'Financeiro' && <div className="sp-live-finance-grid"><article><small>ENTRADAS DO MÊS</small><b>R$ 8.450,00</b></article><article><small>SAÍDAS DO MÊS</small><b>R$ 3.120,00</b></article><article><small>SALDO DO PERÍODO</small><b>R$ 5.330,00</b></article><p>Valores ilustrativos. Nenhuma movimentação financeira real é realizada nesta demonstração.</p></div>}
          <div className="sp-live-feedback" role="status">ⓘ {aviso}</div>
        </div>
      </div>
      <footer className="sp-live-footer"><span>AMBIENTE DE DEMONSTRAÇÃO · DADOS FICTÍCIOS · SEM INTEGRAÇÃO COM A CONTA REAL</span><button type="button" onClick={reiniciar}>↺ Restaurar dados de exemplo</button></footer>
    </div>
    <p className="sp-live-after">Gostou do que viu? <a href="#planos">Conheça os planos</a> ou <a href="#tour">faça o tour guiado</a> para entender o fluxo completo.</p>
  </section>
}
