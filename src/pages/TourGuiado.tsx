import { useState } from 'react'

const etapas = [
  { nome: 'Visão geral', resumo: 'Veja o movimento da oficina, as ordens em andamento e os indicadores que ajudam a decidir o que merece atenção.', etiqueta: 'PAINEL DA OFICINA' },
  { nome: 'Ordens de serviço', resumo: 'Organize o atendimento por ordem, acompanhe o status e mantenha serviços e valores reunidos.', etiqueta: 'ROTINA ORGANIZADA' },
  { nome: 'Clientes e motos', resumo: 'Localize o cadastro pelo nome ou pela placa e consulte os dados da motocicleta.', etiqueta: 'HISTÓRICO NA MÃO' },
  { nome: 'Estoque e financeiro', resumo: 'No Plano Completo, acompanhe peças, estoque mínimo, entradas, saídas e valores a receber.', etiqueta: 'CONTROLE DO NEGÓCIO' },
]

const dataDemonstracao = () => new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
}).format(new Date()).toLocaleUpperCase('pt-BR')

export default function TourGuiado() {
  const [etapa, setEtapa] = useState(0)
  const atual = etapas[etapa]
  const data = dataDemonstracao()

  return (
    <section id="tour" className="sp-tour">
      <div className="sp-section-kicker"><span>04</span> CONHEÇA POR DENTRO, SEM FAZER LOGIN</div>
      <div className="sp-tour-heading"><div><h2>Um passeio rápido<br /><em>pela sua próxima rotina.</em></h2><p>Explore as principais áreas do Ofício do Motor. A prévia usa dados fictícios e representa o fluxo do sistema — não é necessário entrar nem criar uma conta.</p></div><span className="sp-tour-duration">4 ETAPAS <i>·</i> 2 MINUTOS</span></div>
      <div className="sp-tour-layout">
        <div className="sp-tour-steps" role="tablist" aria-label="Etapas do tour">
          {etapas.map((item, i) => <button key={item.nome} id={`sp-tour-tab-${i}`} type="button" role="tab" aria-controls="sp-tour-panel" aria-selected={etapa === i} tabIndex={etapa === i ? 0 : -1} className={etapa === i ? 'active' : ''} onClick={() => setEtapa(i)}><span>0{i + 1}</span><b>{item.nome}</b><small>{item.etiqueta}</small></button>)}
          <div className="sp-tour-note"><span>↗</span> Escolha uma etapa para explorar a demonstração.</div>
        </div>
        <div className="sp-tour-demo" id="sp-tour-panel" role="tabpanel" aria-labelledby={`sp-tour-tab-${etapa}`}>
          <div className="sp-demo-top"><div className="sp-demo-brand"><span>OM</span><b>OFÍCIO DO MOTOR</b></div><div className="sp-demo-status"><i /> PRÉVIA ILUSTRATIVA</div></div>
          <div className="sp-demo-body">
            <aside className="sp-demo-sidebar"><div className="sp-demo-avatar">OF</div><small>OFICINA EXEMPLO</small>{['Painel','Ordens de serviço','Clientes','Catálogo','Financeiro'].map((n,i)=><div key={n} className={(etapa===i || (etapa===3 && i===4))?'selected':''}><span>{['▦','▤','♙','◈','R$'][i]}</span>{n}</div>)}</aside>
            <div className="sp-demo-content">
              <div className="sp-demo-greeting"><div><small>{data}</small><h3>{['Resumo da oficina','Ordens de serviço','Clientes e motos','Gestão da oficina'][etapa]}</h3></div><span>OFICINA EXEMPLO</span></div>

              {etapa === 0 && <>
                <div className="sp-demo-metrics"><div><small>MOTOS NA BANCADA</small><b>08</b><span>ordens em aberto</span></div><div><small>LEMBRETES HOJE</small><b>03</b><span>contatos previstos</span></div><div><small>RECEBIDO NO MÊS</small><b>R$ 4.250</b><span>valores confirmados</span></div></div>
                <div className="sp-demo-panel"><strong>Motos na bancada <small>por etapa do serviço</small></strong>{[['Orçamento','02','sp-status-neutral'],['Aguardando aprovação','03','sp-status-wait'],['Em andamento','03','sp-status-work'],['Pronto','02','sp-status-ready']].map(([n,v,c])=><div className="sp-demo-line" key={n}><span>{n}</span><b className={`sp-demo-count ${c}`}>{v}</b></div>)}</div>
              </>}

              {etapa === 1 && <>
                <div className="sp-demo-filter"><span className="active">Abertas</span><span>Orçamento</span><span>Em andamento</span><span>Todas</span></div>
                <div className="sp-demo-panel sp-demo-table"><strong>Ordens recentes <small>exemplos fictícios</small></strong>
                  <div className="sp-demo-os-row sp-demo-os-head"><span>ORDEM / CLIENTE</span><span>MOTOCICLETA</span><span>STATUS</span><span>TOTAL</span></div>
                  {[
                    ['OS #0248','Marcos Oliveira','Honda CG 160','Em andamento','R$ 680,00','work'],
                    ['OS #0247','Ana Paula Santos','Yamaha Fazer 250','Aguardando aprovação','R$ 320,00','wait'],
                    ['OS #0246','Rafael Costa','Honda Biz 125','Pronto','R$ 180,00','ready'],
                  ].map(row=><div className="sp-demo-os-row" key={row[0]}><span><b>{row[0]}</b><small>{row[1]}</small></span><span>{row[2]}</span><span><i className={`sp-status-pill ${row[5]}`}>{row[3]}</i></span><strong>{row[4]}</strong></div>)}
                </div>
                <p className="sp-demo-helper">Cada ordem reúne cliente, moto, itens do serviço, valores e evolução do atendimento.</p>
              </>}

              {etapa === 2 && <>
                <div className="sp-demo-search"><span>⌕</span> Buscar por nome ou placa</div>
                <div className="sp-demo-panel sp-demo-table"><strong>Clientes cadastrados <small>exemplos fictícios</small></strong>
                  {[
                    ['MO','Marcos Oliveira','Honda CG 160 · 2022','ABC1D23'],
                    ['AS','Ana Paula Santos','Yamaha Factor · 2021','DEF4G56'],
                    ['RC','Rafael Costa','Honda Biz · 2023','GHI7J89'],
                  ].map(row=><div className="sp-demo-client-row" key={row[1]}><b>{row[0]}</b><span><strong>{row[1]}</strong><small>{row[2]}</small></span><i>{row[3]}</i></div>)}
                </div>
                <p className="sp-demo-helper">Os cadastros relacionam o cliente às motocicletas, facilitando a consulta pelo nome ou placa.</p>
              </>}

              {etapa === 3 && <>
                <div className="sp-demo-complete-grid">
                  <div className="sp-demo-panel"><strong>Peças e estoque <small>catálogo</small></strong>
                    {[
                      ['Óleo 10W30','02 un.','sp-stock-low'],
                      ['Filtro de óleo','12 un.','sp-stock-ok'],
                      ['Pastilha de freio','01 un.','sp-stock-low'],
                    ].map(row=><div className="sp-demo-stock-row" key={row[0]}><span>{row[0]}</span><b className={row[2]}>{row[1]}</b></div>)}
                    <small className="sp-demo-panel-note">Exemplo de quantidades e estoque mínimo.</small>
                  </div>
                  <div className="sp-demo-panel"><strong>Financeiro <small>mês exemplo</small></strong>
                    <div className="sp-demo-finance-row"><span>Entradas</span><b>R$ 8.450</b></div>
                    <div className="sp-demo-finance-row"><span>Saídas</span><b>R$ 3.120</b></div>
                    <div className="sp-demo-finance-row total"><span>Saldo</span><b>R$ 5.330</b></div>
                    <div className="sp-demo-receivable"><small>A RECEBER</small><b>R$ 2.480</b></div>
                  </div>
                </div>
                <p className="sp-demo-helper">Estoque, lembretes e financeiro fazem parte do Plano Completo.</p>
              </>}

              <div className="sp-demo-disclaimer">Ambiente demonstrativo · Dados fictícios · Recursos sujeitos ao plano contratado.</div>
            </div>
          </div>
          <div className="sp-demo-bottom"><span>PASSO 0{etapa+1} DE 04</span><div><button type="button" disabled={etapa===0} onClick={()=>setEtapa(v=>v-1)}>← Anterior</button><button type="button" onClick={()=>setEtapa(v=>v===3?0:v+1)}>{etapa===3?'Recomeçar tour':'Próxima etapa →'}</button></div></div>
        </div>
      </div>
      <div className="sp-tour-caption"><span>{atual.etiqueta}</span><p>{atual.resumo}</p></div>
    </section>
  )
}
