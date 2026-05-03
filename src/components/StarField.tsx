export function StarField({ count = 150 }: { count?: number }) {
  // Seeded LCG — same output on server and client (no hydration mismatch)
  let s = 0x9e3779b9
  const r = () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = s ^ (s >>> 16)
    return (s >>> 0) / 0xffffffff
  }

  const stars = Array.from({ length: count }, () => ({
    x: r() * 100,
    y: r() * 100,
    radius: r() < 0.82 ? 1 : r() < 0.96 ? 1.5 : 2,
    opacity: 0.04 + r() * 0.14,
    dur: (5 + r() * 8).toFixed(1),
    begin: (r() * 12).toFixed(1),
  }))

  return (
    <div
      aria-hidden
      className="starfield pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {stars.map((star, i) => (
          <circle
            key={i}
            cx={`${star.x.toFixed(3)}%`}
            cy={`${star.y.toFixed(3)}%`}
            r={star.radius}
            fill="white"
            opacity={star.opacity}
          >
            <animate
              attributeName="opacity"
              values={`${star.opacity.toFixed(3)};${Math.min(star.opacity * 2.2, 0.4).toFixed(3)};${star.opacity.toFixed(3)}`}
              dur={`${star.dur}s`}
              begin={`${star.begin}s`}
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              keyTimes="0;0.5;1"
            />
          </circle>
        ))}
      </svg>
    </div>
  )
}
