import type { CSSProperties } from 'react'

/* Atmosfera de cinema: neblina, vazamento de luz e poeira flutuando no feixe do farol.
   As posições são fixas (pseudo-aleatórias determinísticas) para não "pular" a cada render. */

const alea = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const POEIRA = Array.from({ length: 26 }, (_, i) => ({
  x: 50 + alea(i + 1) * 46,
  y: 16 + alea(i + 50) * 54,
  s: 1.5 + alea(i + 90) * 2.5,
  d: 6 + alea(i + 130) * 8,
  t: -alea(i + 170) * 10,
  dx: (alea(i + 210) - 0.5) * 70,
  dy: -20 - alea(i + 250) * 55,
}))

export function Atmosfera() {
  return (
    <div className="atmosfera" aria-hidden="true">
      <div className="nevoa n1" />
      <div className="nevoa n2" />
      <div className="vazamento" />
      {POEIRA.map((p, i) => (
        <span
          key={i}
          className="poeira"
          style={
            {
              '--x': `${p.x}%`,
              '--y': `${p.y}%`,
              '--s': `${p.s}px`,
              '--d': `${p.d}s`,
              '--t': `${p.t}s`,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
