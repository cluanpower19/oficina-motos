import { useState } from 'react'

const etapas = [
  { nome: 'Visão geral', resumo: 'Tenha uma visão rápida da oficina e saiba o que merece sua atenção.', etiqueta: 'PAINEL DA OFICINA' },
  { nome: 'Ordens de serviço', resumo: 'Acompanhe cada moto, o serviço combinado e o andamento até a entrega.', etiqueta: 'ROTINA ORGANIZADA' },
  { nome: 'Clientes e motos', resumo: 'Consulte os dados e o histórico de cada cliente e motocicleta em poucos segundos.', etiqueta: 'HISTÓRICO NA MÃO' },
  { nome: 'Estoque e financeiro', resumo: 'Tenha mais clareza sobre peças, movimentações e valores da oficina.', etiqueta: 'CONTROLE DO NEGÓCIO' },
]

export default function TourGuiado() {
  const [etapa, setEtapa] = useState(0)
  const atual = etapas[etapa]
  return (
    <section id="tour" className="sp-tour">
      <div className="sp-section-kicker"><span>03</span> CONHEÇA POR DENTRO, SEM FAZER CADASTRO</div>
      <div className="sp-tour-heading"><div><h2>Um passeio rápido<br /><em>pela sua próxima rotina.</em></h2><p>Veja como as principais áreas se conectam. Este é um tour demonstrativo, com informações fictícias — você não precisa entrar nem criar uma conta.</p></div><span className="sp-tour-duration">4 ETAPAS <i>·</i> 2 MINUTOS</span></div>
      <div className="sp-tour-layout">
        <div className="sp-tour-steps" role="tablist" aria-label="Etapas do tour">
          {etapas.map((item, i) => <button key={item.nome} type="button" role="tab" aria-selected={etapa === i} className={etapa === i ? 'active' : ''} onClick={() => setEtapa(i)}><span>0{i + 1}</span><b>{item.nome}</b><small>{item.etiqueta}</small></button>)}
          <div className="sp-tour-note"><span>↗</span> Navegue pelas etapas para conhecer cada parte do sistema.</div>
        </div>
        <div className="sp-tour-demo">
          <div className="sp-demo-top"><div className="sp-demo-brand"><span>OM</span><b>OFÍCIO DO MOTOR</b></div><div className="sp-demo-status"><i /> AMBIENTE DE DEMONSTRAÇÃO</div></div>
          <div className="sp-demo-body">
            <aside className="sp-demo-sidebar"><div className="sp-demo-avatar">OF</div><small>OFICINA EXEMPLO</small>{['Visão geral','Ordens de serviço','Clientes e motos','Estoque e financeiro'].map((n,i)=><div key={n} className={etapa===i?'selected':''}><span>{['⌂','▤','♙','◫'][i]}</span>{n}</div>)}</aside>
            <div className="sp-demo-content"><div className="sp-demo-greeting"><div><small>TERÇA-FEIRA, 24 DE NOVEMBRO</small><h3>{['Bom dia!','Ordens de serviço','Seus clientes','Controle da oficina'][etapa]}</h3></div><span>OFICINA EXEMPLO</span></div>
              {etapa === 0 && <><div className="sp-demo-metrics"><div><small>EM ANDAMENTO</small><b>08</b><span>serviços na oficina</span></div><div><small>AGUARDANDO</small><b>03</b><span>aprovação ou peça</span></div><div><small>PARA ENTREGAR</small><b>02</b><span>motos prontas</span></div></div><div className="sp-demo-panel"><strong>Movimentação recente</strong>{[['Honda CG 160 · Revisão','Em andamento'],['Yamaha Fazer 250 · Freios','Aguardando peça'],['Honda Biz · Troca de óleo','Concluída']].map(([n,v])=><div className="sp-demo-line" key={n}><span>{n}</span><i>{v}</i></div>)}</div></>}
              {etapa === 1 && <div className="sp-demo-panel sp-demo-table"><strong>Ordens recentes <small>3 de 8 serviços</small></strong>{[['OS-0248','Honda CG 160','Revisão completa','Em andamento'],['OS-0247','Yamaha Fazer 250','Sistema de freios','Aguardando'],['OS-0246','Honda Biz 125','Troca de óleo','Concluída']].map(row=><div className="sp-demo-row" key={row[0]}>{row.map((v,i)=><span key={i}>{v}</span>)}</div>)}</div>}
              {etapa === 2 && <div className="sp-demo-panel sp-demo-table"><strong>Clientes cadastrados <small>Exemplos fictícios</small></strong>{[['Marcos Oliveira','Honda CG 160 · 2022','2 atendimentos'],['Ana Paula Santos','Yamaha Factor · 2021','4 atendimentos'],['Rafael Costa','Honda Biz · 2023','1 atendimento']].map(row=><div className="sp-demo-row sp-demo-client" key={row[0]}><b>{row[0].split(' ').map(x=>x[0]).join('').slice(0,2)}</b>{row.map((v,i)=><span key={i}>{v}</span>)}</div>)}</div>}
              {etapa === 3 && <><div className="sp-demo-metrics"><div><small>ITENS CADASTRADOS</small><b>126</b><span>peças no catálogo</span></div><div><small>ESTOQUE BAIXO</small><b>04</b><span>itens para conferir</span></div><div><small>A RECEBER</small><b>R$ 2.480</b><span>valores em aberto</span></div></div><div className="sp-demo-panel"><strong>Atenção no estoque</strong>{[['Óleo 10W30','Estoque: 2 un.'],['Pastilha de freio','Estoque: 1 un.'],['Filtro de óleo','Estoque: 3 un.']].map(([n,v])=><div className="sp-demo-line" key={n}><span>{n}</span><i>{v}</i></div>)}</div></>}
              <div className="sp-demo-disclaimer">Prévia ilustrativa · Dados fictícios · Algumas funções variam conforme o plano.</div>
            </div>
          </div>
          <div className="sp-demo-bottom"><span>PASSO 0{etapa+1} DE 04</span><div><button type="button" disabled={etapa===0} onClick={()=>setEtapa(v=>v-1)}>← Anterior</button><button type="button" onClick={()=>setEtapa(v=>v===3?0:v+1)}>{etapa===3?'Recomeçar tour':'Próxima etapa →'}</button></div></div>
        </div>
      </div>
      <div className="sp-tour-caption"><span>{atual.etiqueta}</span><p>{atual.resumo}</p></div>
    </section>
  )
}
