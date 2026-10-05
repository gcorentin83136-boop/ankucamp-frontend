interface BarPoint {
  label: string
  value: number
}

interface MiniBarChartProps {
  data: BarPoint[]
  color?: string
  height?: number
  valueFormatter?: (v: number) => string
}

export default function MiniBarChart({
  data,
  color = '#6aa84f',
  height = 140,
  valueFormatter = (v) => v.toFixed(2),
}: MiniBarChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="rounded-xl flex items-center justify-center text-sm text-gray-400"
        style={{ height, background: '#f9fafb', border: '1px dashed #e5e7eb' }}
      >
        Aucune donnée
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex items-end gap-1 sm:gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 40)
        const isLast = i === data.length - 1
        return (
          <div
            key={`${d.label}-${i}`}
            className="flex-1 flex flex-col items-center justify-end gap-1 group min-w-0"
          >
            <span
              className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition"
              style={{ color }}
            >
              {valueFormatter(d.value)}
            </span>
            <div
              className="w-full rounded-t-md transition-all hover:opacity-100"
              style={{
                height: Math.max(h, 2),
                background: isLast ? color : `${color}aa`,
                opacity: isLast ? 1 : 0.75,
              }}
              title={`${d.label} : ${valueFormatter(d.value)}`}
            />
            <span className="text-[9px] text-gray-500 truncate w-full text-center">
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
