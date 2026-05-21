import { useQuery } from '@tanstack/react-query'
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    BarChart, Bar, Legend,
} from 'recharts'
import { listOrders } from '@/api/orders'
import { useOptimizeStore } from '@/store/optimizeStore'

// ── Shared tooltip style ──────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
    contentStyle: {
        background: '#1c1c1c',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        fontSize: '12px',
    },
    labelStyle: { color: 'rgba(255,255,255,0.5)' },
    itemStyle: { color: '#fff' },
}

// ── Order Status Donut ────────────────────────────────────────────────────────

export function OrderStatusChart() {
    const { data: total } = useQuery({
        queryKey: ['orders-count', 'all'],
        queryFn: () => listOrders(1, 1),
        select: (d) => d.total,
        staleTime: 30_000,
    })
    const { data: pending } = useQuery({
        queryKey: ['orders-count', 'pending'],
        queryFn: () => listOrders(1, 1, { status: 'pending' }),
        select: (d) => d.total,
        staleTime: 30_000,
    })
    const { data: delivered } = useQuery({
        queryKey: ['orders-count', 'delivered'],
        queryFn: () => listOrders(1, 1, { status: 'delivered' }),
        select: (d) => d.total,
        staleTime: 30_000,
    })

    const other = Math.max(0, (total ?? 0) - (pending ?? 0) - (delivered ?? 0))

    const data = [
        { name: 'Pending', value: pending ?? 0, color: '#f59e0b' },
        { name: 'Delivered', value: delivered ?? 0, color: '#34d399' },
        ...(other > 0 ? [{ name: 'Other', value: other, color: '#374151' }] : []),
    ]

    const isLoading = total === undefined

    return (
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 flex flex-col">
            <p className="text-xs font-medium text-white/40 mb-4">Order Status</p>
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center h-[180px]">
                    <p className="text-xs text-white/20">Loading...</p>
                </div>
            ) : (
                <>
                    <div className="relative">
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={2}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {data.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip {...TOOLTIP_STYLE} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-2xl font-semibold text-white">{total ?? 0}</p>
                            <p className="text-xs text-white/30">total</p>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-3">
                        {data.map((d) => (
                            <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                                <span className="size-2 rounded-full shrink-0" style={{ background: d.color }} />
                                {d.name}: <span className="text-white font-medium">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

// ── Optimization Trend ────────────────────────────────────────────────────────

export function OptimizationTrendChart() {
    const runs = useOptimizeStore((s) => s.runs)

    if (runs.length < 2) return null

    const data = [...runs].reverse().map((run, i) => {
        const kpi = run.result.results[0]?.kpi
        return {
            name: `#${i + 1}`,
            'Distance (km)': kpi ? parseFloat(kpi.total_distance_km.toFixed(1)) : 0,
            'Unassigned': kpi?.unassigned_count ?? 0,
            'Vehicles': kpi?.vehicles_used ?? 0,
        }
    })

    return (
        <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <p className="text-xs font-medium text-white/40 mb-4">Optimization Trend</p>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gradDistance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradUnassigned" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="name"
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend
                        wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', paddingTop: '8px' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="Distance (km)"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        fill="url(#gradDistance)"
                        dot={{ r: 3, fill: '#60a5fa', strokeWidth: 0 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="Unassigned"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#gradUnassigned)"
                        dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

// ── Vehicle Fill Rate ─────────────────────────────────────────────────────────

export function VehicleFillRateChart() {
    const runs = useOptimizeStore((s) => s.runs)
    const latestRun = runs[0]

    const perVehicle = latestRun?.result.results[0]?.kpi.per_vehicle ?? []

    if (perVehicle.length === 0) return null

    const data = perVehicle.map((v) => ({
        vehicle: v.vehicle_id.length > 10 ? v.vehicle_id.slice(0, 10) + '…' : v.vehicle_id,
        'Weight (%)': parseFloat((v.fill_rate_weight * 100).toFixed(1)),
        'Volume (%)': parseFloat((v.fill_rate_volume * 100).toFixed(1)),
    }))

    const barHeight = 40
    const chartHeight = Math.max(160, data.length * barHeight + 60)

    return (
        <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <p className="text-xs font-medium text-white/40 mb-4">
                Vehicle Fill Rate — Latest Run
            </p>
            <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                    barSize={10}
                    barGap={3}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="vehicle"
                        width={90}
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        {...TOOLTIP_STYLE}
                        formatter={(value: number) => `${value}%`}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', paddingTop: '8px' }}
                    />
                    <Bar dataKey="Weight (%)" fill="#60a5fa" radius={[0, 3, 3, 0]} />
                    <Bar dataKey="Volume (%)" fill="#a78bfa" radius={[0, 3, 3, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
