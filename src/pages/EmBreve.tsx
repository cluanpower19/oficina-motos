export default function EmBreve({ titulo }: { titulo: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">{titulo}</h1>
      <p className="mt-2 text-gray-600">Disponível nas próximas etapas.</p>
    </div>
  )
}
