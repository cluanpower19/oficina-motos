import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RecursoPlano() {
  const { perfil } = useAuth()
  const nome = perfil?.oficina.nome ?? 'sua oficina'
  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-[#364152] bg-[#101925] p-6 text-center text-white shadow-xl">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-2xl">★</div>
      <p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">Recurso do Plano Completo</p>
      <h1 className="text-2xl font-bold">Leve a gestão da sua oficina mais longe</h1>
      <p className="text-sm leading-6 text-slate-300">Este módulo faz parte do Plano Completo. Fale com a equipe do Ofício do Motor para conhecer a mudança de plano para {nome}.</p>
      <Link to="/suporte" className="inline-flex rounded-xl bg-orange-500 px-5 py-3 font-bold text-slate-950">Falar com o suporte</Link>
    </section>
  )
}
