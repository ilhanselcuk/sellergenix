'use client'

/**
 * Multi-Series Chart Component
 * Blends multiple chart types: Area + Line + Bar
 * Premium gradients, custom tooltips, interactive
 */

import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ChartDataPoint {
  date: string
  netProfit?: number
  grossProfit?: number
  totalSales?: number
  unitsSold?: number
  orders?: number
  adSpend?: number
  acos?: number
  refunds?: number
  margin?: number
  roi?: number
  // Add more metrics as needed
}

interface MultiSeriesChartProps {
  data: ChartDataPoint[]
  selectedMetrics: string[]
  height?: number
}

// Metric configuration for chart rendering - ALL METRICS
const metricConfig: Record<string, {
  dataKey: string
  type: 'area' | 'line' | 'bar'
  color: string
  fillGradient?: string
  yAxisId?: 'left' | 'right'
  strokeWidth?: number
  opacity?: number
}> = {
  // Revenue & Sales
  totalSales: {
    dataKey: 'totalSales',
    type: 'line',
    color: '#00b6e3', // Cyan from palette
    yAxisId: 'left',
    strokeWidth: 3
  },
  unitsSold: {
    dataKey: 'unitsSold',
    type: 'bar',
    color: '#ff8833', // Orange from palette
    yAxisId: 'right',
    opacity: 0.6
  },
  avgOrder: {
    dataKey: 'avgOrder',
    type: 'line',
    color: '#444444', // Dark gray from palette
    yAxisId: 'right',
    strokeWidth: 2
  },
  orders: {
    dataKey: 'orders',
    type: 'bar',
    color: '#8aba56', // Green from palette
    yAxisId: 'right',
    opacity: 0.6
  },

  // Deductions
  promotional: {
    dataKey: 'promotional',
    type: 'line',
    color: '#fbbc05',
    yAxisId: 'left',
    strokeWidth: 2
  },
  refunds: {
    dataKey: 'refunds',
    type: 'line',
    color: '#f9a825',
    yAxisId: 'left',
    strokeWidth: 2
  },
  discounts: {
    dataKey: 'discounts',
    type: 'line',
    color: '#f57c00',
    yAxisId: 'left',
    strokeWidth: 2
  },

  // Amazon Fees
  referralFee: {
    dataKey: 'referralFee',
    type: 'line',
    color: '#ea4335',
    yAxisId: 'left',
    strokeWidth: 2
  },
  fbaFee: {
    dataKey: 'fbaFee',
    type: 'line',
    color: '#d32f2f',
    yAxisId: 'left',
    strokeWidth: 2
  },
  storageFee: {
    dataKey: 'storageFee',
    type: 'line',
    color: '#c62828',
    yAxisId: 'left',
    strokeWidth: 2
  },
  otherFees: {
    dataKey: 'otherFees',
    type: 'line',
    color: '#b71c1c',
    yAxisId: 'left',
    strokeWidth: 2
  },

  // Advertising
  adSpend: {
    dataKey: 'adSpend',
    type: 'line',
    color: '#ea4c89', // Pink from palette
    yAxisId: 'left',
    strokeWidth: 3
  },
  ppcSales: {
    dataKey: 'ppcSales',
    type: 'line',
    color: '#4285f4',
    yAxisId: 'left',
    strokeWidth: 2
  },
  acos: {
    dataKey: 'acos',
    type: 'line',
    color: '#f57c00',
    yAxisId: 'right',
    strokeWidth: 2
  },
  roas: {
    dataKey: 'roas',
    type: 'line',
    color: '#34a853',
    yAxisId: 'right',
    strokeWidth: 2
  },

  // Costs
  cogs: {
    dataKey: 'cogs',
    type: 'line',
    color: '#7c3aed',
    yAxisId: 'left',
    strokeWidth: 2
  },
  logistics: {
    dataKey: 'logistics',
    type: 'line',
    color: '#9333ea',
    yAxisId: 'left',
    strokeWidth: 2
  },
  indirect: {
    dataKey: 'indirect',
    type: 'line',
    color: '#a855f7',
    yAxisId: 'left',
    strokeWidth: 2
  },

  // Profit
  grossProfit: {
    dataKey: 'grossProfit',
    type: 'line',
    color: '#2e7d32',
    yAxisId: 'left',
    strokeWidth: 2
  },
  netProfit: {
    dataKey: 'netProfit',
    type: 'area',
    color: '#8aba56', // Green from palette
    fillGradient: 'profitGradient',
    yAxisId: 'left',
    strokeWidth: 3
  },
  margin: {
    dataKey: 'margin',
    type: 'line',
    color: '#34a853',
    yAxisId: 'right',
    strokeWidth: 2
  },
  roi: {
    dataKey: 'roi',
    type: 'line',
    color: '#137333',
    yAxisId: 'right',
    strokeWidth: 2
  }
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-xl">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        {label}
      </p>
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {typeof entry.value === 'number'
                ? entry.dataKey === 'acos' || entry.dataKey === 'margin' || entry.dataKey === 'roi'
                  ? `${entry.value.toFixed(1)}%`
                  : entry.dataKey === 'unitsSold' || entry.dataKey === 'orders'
                  ? entry.value.toLocaleString()
                  : `$${entry.value.toLocaleString()}`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MultiSeriesChart({ data, selectedMetrics, height = 400 }: MultiSeriesChartProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="bg-white dark:bg-gray-900">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data}>
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8aba56" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#8aba56" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00b6e3" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#00b6e3" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            {/* Grid & Axes */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
              fontSize={11}
              fontWeight="500"
              tick={{ fill: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
            />
            <YAxis
              yAxisId="left"
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
              fontSize={11}
              fontWeight="500"
              tick={{ fill: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
              fontSize={11}
              fontWeight="500"
              tick={{ fill: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
            />

            {/* Custom Tooltip */}
            <Tooltip content={<CustomTooltip />} />

            {/* Legend */}
            <Legend
              wrapperStyle={{
                paddingTop: '24px',
                fontSize: '11px',
                fontWeight: '500'
              }}
              iconType="circle"
            />

            {/* Render selected metrics dynamically */}
            {selectedMetrics.map((metricId) => {
              const config = metricConfig[metricId]
              if (!config) return null

              if (config.type === 'area') {
                return (
                  <Area
                    key={metricId}
                    type="monotone"
                    dataKey={config.dataKey}
                    stroke={config.color}
                    strokeWidth={config.strokeWidth || 2}
                    fill={config.fillGradient ? `url(#${config.fillGradient})` : config.color}
                    yAxisId={config.yAxisId || 'left'}
                    name={metricId.charAt(0).toUpperCase() + metricId.slice(1).replace(/([A-Z])/g, ' $1')}
                  />
                )
              }

              if (config.type === 'line') {
                return (
                  <Line
                    key={metricId}
                    type="monotone"
                    dataKey={config.dataKey}
                    stroke={config.color}
                    strokeWidth={config.strokeWidth || 2}
                    dot={{ fill: config.color, r: 4 }}
                    yAxisId={config.yAxisId || 'left'}
                    name={metricId.charAt(0).toUpperCase() + metricId.slice(1).replace(/([A-Z])/g, ' $1')}
                  />
                )
              }

              if (config.type === 'bar') {
                return (
                  <Bar
                    key={metricId}
                    dataKey={config.dataKey}
                    fill={config.color}
                    opacity={config.opacity || 0.8}
                    radius={[8, 8, 0, 0]}
                    yAxisId={config.yAxisId || 'left'}
                    name={metricId.charAt(0).toUpperCase() + metricId.slice(1).replace(/([A-Z])/g, ' $1')}
                  />
                )
              }

              return null
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
