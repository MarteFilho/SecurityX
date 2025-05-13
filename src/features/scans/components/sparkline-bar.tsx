import { Bar, BarChart, ResponsiveContainer } from 'recharts'

interface SparklineBarProps {
  data: Array<{
    count: number
    date: string
  }>
  height?: number
  increasing?: boolean
}

export function SparklineBar({ data, height = 24, increasing = false }: SparklineBarProps) {
  // Garantir que os dados são válidos e não são NaN
  const validData = data.map(item => ({
    value: Number.isFinite(item.count) ? item.count : 0,
    date: item.date
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart 
        data={validData} 
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <Bar
          dataKey="value"
          fill={increasing ? "rgb(239 68 68 / 0.2)" : "rgb(34 197 94 / 0.2)"}
          stroke={increasing ? "rgb(239 68 68)" : "rgb(34 197 94)"}
          strokeWidth={1}
          minPointSize={2}
          barSize={4}
        />
      </BarChart>
    </ResponsiveContainer>
  )
} 