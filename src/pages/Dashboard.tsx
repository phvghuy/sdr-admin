import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Upload, Zap, Map, ArrowRight, ChevronDown, ChevronUp, History } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useOptimizeStore, type OptimizeRun } from '@/store/optimizeStore'
import { listOrders } from '@/api/orders'
import type { KPI, VehicleKpi } from '@/types/api'
import { OrderStatusChart, OptimizationTrendChart, VehicleFillRateChart } from '@/components/charts/DashboardCharts'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({ latestRun }: { latestRun: OptimizeRun | null }) {
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

    const kpi = latestRun?.result.results[0]?.kpi

    const stats = [
        { label: 'Total Orders', value: total ?? '—', color: 'text-white' },
        { label: 'Pending', value: pending ?? '—', color: pending ? 'text-amber-400' : 'text-white' },
        { label: 'Delivered', value: delivered ?? '—', color: 'text-emerald-400' },
        {
            label: 'Last Distance',
            value: kpi ? `${kpi.total_distance_km.toFixed(1)} km` : '—',
            color: 'text-white',
            sub: latestRun ? timeAgo(latestRun.runAt) : undefined,
        },
        { label: 'Vehicles Used', value: kpi?.vehicles_used ?? '—', color: 'text-white' },
        {
            label: 'Unassigned',
            value: kpi?.unassigned_count ?? '—',
            color: kpi && kpi.unassigned_count > 0 ? 'text-amber-400' : 'text-white',
        },
    ]

    return (
        <div className="rounded-xl border border-white/10 bg-[#171717] flex flex-wrap sm:flex-nowrap divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
            {stats.map(({ label, value, color, sub }) => (
                <div key={label} className="flex-1 min-w-[33%] sm:min-w-0 px-5 py-4">
                    <p className="text-xs text-white/40 mb-1 whitespace-nowrap">{label}</p>
                    <p className={`text-xl font-semibold ${color}`}>{value}</p>
                    {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
                </div>
            ))}
        </div>
    )
}

// ── KPI section ───────────────────────────────────────────────────────────────

function KpiSection({ kpi }: { kpi: KPI }) {
    const items = [
        { label: 'Total Distance', value: `${kpi.total_distance_km.toFixed(1)} km` },
        { label: 'Vehicles Used', value: kpi.vehicles_used },
        { label: 'Unassigned', value: kpi.unassigned_count },
        { label: 'Fill Rate (Weight)', value: `${(kpi.average_fill_rate_weight * 100).toFixed(1)}%` },
        { label: 'Fill Rate (Volume)', value: `${(kpi.average_fill_rate_volume * 100).toFixed(1)}%` },
    ]
    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {items.map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                    <p className="text-xs text-white/40 mb-1">{label}</p>
                    <p className="text-lg font-semibold text-white">{value}</p>
                </div>
            ))}
        </div>
    )
}

// ── Vehicle table ─────────────────────────────────────────────────────────────

function VehicleTable({ rows }: { rows: VehicleKpi[] }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                        {['Vehicle', 'Stops', 'Distance (km)', 'Fill Rate (Weight)', 'Fill Rate (Volume)'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/40 whitespace-nowrap">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((v, i) => (
                        <tr key={v.vehicle_id} className={`border-b border-white/5 ${i % 2 !== 0 ? 'bg-white/[0.02]' : ''}`}>
                            <td className="px-4 py-3 font-medium text-white">{v.vehicle_id}</td>
                            <td className="px-4 py-3 text-white/60">{v.stops_count}</td>
                            <td className="px-4 py-3 text-white/60">{v.distance_km.toFixed(1)}</td>
                            <td className="px-4 py-3 text-white/60">{(v.fill_rate_weight * 100).toFixed(1)}%</td>
                            <td className="px-4 py-3 text-white/60">{(v.fill_rate_volume * 100).toFixed(1)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// ── Run card ──────────────────────────────────────────────────────────────────

function RunCard({ run, index }: { run: OptimizeRun; index: number }) {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const firstSolver = run.result.results[0]

    return (
        <div className="rounded-xl border border-white/10 bg-[#171717] overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
            >
                <div className="flex items-center gap-4 text-left">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                        <span className="text-xs font-semibold text-white/60">#{index}</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">
                            {run.result.results.map((r) => r.solver).join(' · ')}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                            {new Date(run.runAt).toLocaleString()} · Job {run.jobId}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                    {firstSolver && (
                        <div className="hidden sm:flex items-center gap-6 text-right">
                            <div>
                                <p className="text-xs text-white/30">Distance</p>
                                <p className="text-sm font-medium text-white">
                                    {firstSolver.kpi.total_distance_km.toFixed(1)} km
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-white/30">Vehicles</p>
                                <p className="text-sm font-medium text-white">{firstSolver.kpi.vehicles_used}</p>
                            </div>
                            <div>
                                <p className="text-xs text-white/30">Unassigned</p>
                                <p className="text-sm font-medium text-white">{firstSolver.kpi.unassigned_count}</p>
                            </div>
                        </div>
                    )}
                    {open ? (
                        <ChevronUp className="size-4 text-white/30" />
                    ) : (
                        <ChevronDown className="size-4 text-white/30" />
                    )}
                </div>
            </button>

            {open && (
                <div className="px-5 pb-5 space-y-5 border-t border-white/10 pt-5">
                    {run.result.results.map((r) => (
                        <div key={r.solver} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide">{r.solver}</h3>
                                    <span className="text-xs text-white/30">
                                        {r.routes.length} routes · {r.unassigned_orders.length} unassigned
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/routes?job=${run.jobId}`) }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    <Map className="size-4" />
                                    View Map
                                </button>
                            </div>
                            <KpiSection kpi={r.kpi} />
                            {r.kpi.per_vehicle.length > 0 && <VehicleTable rows={r.kpi.per_vehicle} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
    const steps = [
        { icon: Upload, label: 'Import Data', desc: 'Upload orders, vehicles and warehouses CSV files', to: '/import' },
        { icon: Zap, label: 'Run Optimization', desc: 'Run the routing engine on imported data', to: '/optimize' },
        { icon: Map, label: 'View Routes', desc: 'Inspect optimized routes and delivery stops', to: '/routes' },
    ]
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {steps.map(({ icon: Icon, label, desc, to }, i) => (
                <Link
                    key={to}
                    to={to}
                    className="group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/5 hover:border-white/20 p-5 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                            <Icon className="size-4 text-white/60" />
                        </div>
                        <span className="text-xs font-medium text-white/30">Step {i + 1}</span>
                    </div>
                    <p className="text-sm font-medium text-white mb-1">{label}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs text-white/30 group-hover:text-white/60 transition-colors">
                        Go <ArrowRight className="size-3" />
                    </div>
                </Link>
            ))}
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const runs = useOptimizeStore((s) => s.runs)
    const latestRun = runs[0] ?? null

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Dashboard</h1>
                    <p className="text-sm text-white/40 mt-1">
                        {latestRun
                            ? `Last optimized ${timeAgo(latestRun.runAt)}`
                            : 'No optimization has been run yet.'}
                    </p>
                </div>
                <Link
                    to="/optimize"
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
                >
                    <Zap className="size-3.5" />
                    Run Optimization
                </Link>
            </div>

            {/* Stats strip */}
            <StatsStrip latestRun={latestRun} />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <OrderStatusChart />
                <div className="lg:col-span-2">
                    <OptimizationTrendChart />
                </div>
            </div>

            <VehicleFillRateChart />

            {/* Optimization history */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <History className="size-3.5 text-white/30" />
                    <h2 className="text-xs font-medium text-white/40 uppercase tracking-wide">
                        Optimization History
                    </h2>
                    {runs.length > 0 && (
                        <span className="text-xs text-white/20">{runs.length} run{runs.length > 1 ? 's' : ''}</span>
                    )}
                </div>

                {runs.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-2">
                        {runs.map((run, i) => (
                            <RunCard
                                key={run.jobId}
                                run={run}
                                index={runs.length - i}
                            />
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}
