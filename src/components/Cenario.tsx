import type { CSSProperties } from 'react'

/* Elementos ilustrados de oficina: moto, engrenagem, disco de freio, chaves, velocímetro.
   Tudo em SVG inline (sem imagens externas), com luz rasante âmbar para dar clima de cinema. */

export function MotoSilhueta({ className = '' }: { className?: string }) {
  const raios = Array.from({ length: 16 }, (_, i) => (i * 360) / 16)
  const Roda = ({ cx }: { cx: number }) => (
    <g>
      <circle cx={cx} cy={236} r={78} fill="none" stroke="#06080b" strokeWidth={15} />
      <circle cx={cx} cy={236} r={71} fill="none" stroke="url(#mt-borracha)" strokeWidth={2} strokeDasharray="3 4" />
      <circle cx={cx} cy={236} r={58} fill="none" stroke="url(#mt-cromo)" strokeWidth={4} />
      {raios.map((a) => (
        <line key={a} x1={cx} y1={236} x2={cx + 56 * Math.cos((a * Math.PI) / 180)} y2={236 + 56 * Math.sin((a * Math.PI) / 180)} stroke="#2a3340" strokeWidth={1.4} />
      ))}
      <circle cx={cx} cy={236} r={30} fill="none" stroke="#c9ced6" strokeOpacity={0.55} strokeWidth={5} strokeDasharray="14 6" />
      <circle cx={cx} cy={236} r={11} fill="#10151c" stroke="url(#mt-cromo)" strokeWidth={3} />
    </g>
  )
  return (
    <svg className={className} viewBox="0 0 620 330" role="img" aria-label="Silhueta de uma moto na oficina">
      <defs>
        <linearGradient id="mt-cromo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f6f9" /><stop offset="0.5" stopColor="#7d8794" /><stop offset="1" stopColor="#e1e5ea" />
        </linearGradient>
        <linearGradient id="mt-tanque" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb85a" /><stop offset="0.18" stopColor="#8a4f12" /><stop offset="0.6" stopColor="#1a1410" /><stop offset="1" stopColor="#07090c" />
        </linearGradient>
        <linearGradient id="mt-borracha" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5b6573" /><stop offset="1" stopColor="#1d232c" />
        </linearGradient>
        <radialGradient id="mt-farol" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffbe9" /><stop offset="0.4" stopColor="#ffd98e" /><stop offset="1" stopColor="#ffd98e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="310" cy="318" rx="270" ry="9" fill="#000" opacity="0.55" />
      <Roda cx={130} />
      <Roda cx={492} />
      {/* balança traseira e corrente */}
      <path d="M130 236 L248 212" stroke="#0b0f14" strokeWidth={13} strokeLinecap="round" />
      <path d="M130 236 L248 212" stroke="#f2a03d" strokeOpacity={0.35} strokeWidth={1.5} transform="translate(0 -5)" />
      <path d="M130 228 L252 204 M130 244 L252 222" stroke="#3a4350" strokeWidth={1.6} strokeDasharray="2 3" />
      {/* motor com aletas */}
      <path d="M246 168 L352 162 L366 226 L252 238 Z" fill="#12171e" stroke="#2c3542" strokeWidth={2} />
      {[176, 186, 196, 206, 216].map((y) => (
        <line key={y} x1={256} y1={y} x2={354} y2={y - 6} stroke="#303a47" strokeWidth={2.2} />
      ))}
      <circle cx={302} cy={212} r={17} fill="#0a0d11" stroke="url(#mt-cromo)" strokeWidth={3} />
      <circle cx={302} cy={212} r={5} fill="#7d8794" />
      {/* quadro */}
      <path d="M250 170 L318 120 L420 130 L452 152" fill="none" stroke="#0b0f14" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M250 170 L318 120 L420 130" fill="none" stroke="#f2a03d" strokeOpacity={0.4} strokeWidth={1.4} transform="translate(0 -5)" />
      {/* banco e rabeta */}
      <path d="M176 142 C216 130 272 122 304 128 L298 146 C264 146 214 152 172 156 Z" fill="#0a0d11" stroke="#f2a03d" strokeOpacity={0.35} />
      <path d="M150 146 L182 138 L176 160 L146 164 Z" fill="#0d1117" />
      {/* tanque */}
      <path d="M300 126 C318 92 392 90 428 128 C408 148 336 148 300 126 Z" fill="url(#mt-tanque)" stroke="#ffb85a" strokeOpacity={0.55} />
      <path d="M318 108 C346 98 388 100 410 118" fill="none" stroke="#fff3d2" strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" />
      {/* garfo e guidão */}
      <path d="M440 124 L492 236" stroke="#0b0f14" strokeWidth={13} strokeLinecap="round" />
      <path d="M448 124 L500 236" stroke="url(#mt-cromo)" strokeWidth={3} strokeLinecap="round" />
      <path d="M428 112 L418 90 L452 84" fill="none" stroke="#0b0f14" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      {/* disco de freio */}
      <circle cx={492} cy={236} r={40} fill="none" stroke="#9aa4b2" strokeOpacity={0.5} strokeWidth={5} strokeDasharray="5 4" />
      {/* escapamento */}
      <path d="M262 232 C324 262 410 256 560 212" fill="none" stroke="#0b0f14" strokeWidth={14} strokeLinecap="round" />
      <path d="M262 228 C324 258 410 252 560 208" fill="none" stroke="url(#mt-cromo)" strokeWidth={3} strokeLinecap="round" />
      {/* farol aceso */}
      <circle cx={452} cy={128} r={46} fill="url(#mt-farol)" className="moto-farol" />
      <circle cx={452} cy={128} r={13} fill="#fffbe9" />
    </svg>
  )
}

export function Engrenagem({ className = '', style }: { className?: string; style?: CSSProperties }) {
  const dentes = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <svg className={className} style={style} viewBox="0 0 100 100" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        {dentes.map((a) => (
          <rect key={a} x="45" y="4" width="10" height="14" rx="2" transform={`rotate(${a} 50 50)`} fill="currentColor" stroke="none" />
        ))}
        <circle cx="50" cy="50" r="33" />
        <circle cx="50" cy="50" r="12" />
        <circle cx="50" cy="50" r="22" strokeDasharray="4 5" strokeWidth="1.5" />
      </g>
    </svg>
  )
}

export function Chave({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 240 40" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx="20" cy="20" r="13" strokeWidth="7" />
        <path d="M33 20 H196" strokeWidth="10" />
        <path d="M196 8 H226 V17 H212 V23 H226 V32 H196 Z" fill="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export function Emblema({ tamanho = 44 }: { tamanho?: number }) {
  return (
    <span className="emblema" style={{ width: tamanho, height: tamanho }} aria-hidden="true">
      <Engrenagem className="emblema-engrenagem" />
      <svg viewBox="0 0 24 24" className="emblema-chave" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3.5 17.2a1.8 1.8 0 0 0 2.6 2.6l5.8-5.8a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.2-.6-.6-2.2 2.4-2.4z" />
      </svg>
    </span>
  )
}

export function Velocimetro({ valor, max, rotulo, destaque = false }: { valor: number; max: number; rotulo: string; destaque?: boolean }) {
  const r = 42
  const arco = Math.PI * 1.5 * r
  const prop = Math.min(1, max > 0 ? valor / max : 0)
  const marcas = Array.from({ length: 11 }, (_, i) => i)
  return (
    <div className={`velocimetro ${destaque ? 'velocimetro-destaque' : ''}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <g transform="rotate(135 50 50)">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#1f2833" strokeWidth="7" strokeDasharray={`${arco} 999`} strokeLinecap="round" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="url(#vel-grad)" strokeWidth="7" strokeDasharray={`${arco * prop} 999`} strokeLinecap="round" className="velocimetro-arco" />
        </g>
        {marcas.map((i) => {
          const a = ((135 + i * 27) * Math.PI) / 180
          return <line key={i} x1={50 + 33 * Math.cos(a)} y1={50 + 33 * Math.sin(a)} x2={50 + 37 * Math.cos(a)} y2={50 + 37 * Math.sin(a)} stroke="#566170" strokeWidth="1" />
        })}
        <defs>
          <linearGradient id="vel-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#1f6f78" /><stop offset="1" stopColor="#f2a03d" />
          </linearGradient>
        </defs>
      </svg>
      <div className="velocimetro-numero">{valor}</div>
      <div className="velocimetro-rotulo">{rotulo}</div>
    </div>
  )
}
