import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Zap, Loader2, CheckCircle2, XCircle, Clock, AlertCircle, Map, Info } from 'lucide-react'
import { runOptimizeAsync } from '@/api/optimize'
import { getJob } from '@/api/jobs'
import type { KPI, VehicleKpi } from '@/types/api'
import { useOptimizeStore } from '@/store/optimizeStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    pending: { icon: Loader2, label: 'Running...', color: 'text-amber-400', spin: true },
    success: { icon: CheckCircle2, label: 'Completed', color: 'text-emerald-400', spin: false },
    failure: { icon: XCircle, label: 'Failed', color: 'text-red-400', spin: false },
    expired: { icon: Clock, label: 'Expired', color: 'text-white/40', spin: false },
} as const

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
    const { icon: Icon, label, color, spin } = STATUS_CONFIG[status]
    return (
        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${color}`}>
            <Icon className={`size-4 ${spin ? 'animate-spin' : ''}`} />
            {label}
        </span>
    )
}

// ── KPI cards ─────────────────────────────────────────────────────────────────

function KpiCards({ kpi }: { kpi: KPI }) {
    const cards = [
        { label: 'Total Distance', value: `${kpi.total_distance_km.toFixed(1)} km` },
        { label: 'Vehicles Used', value: kpi.vehicles_used },
        { label: 'Unassigned Orders', value: kpi.unassigned_count },
        { label: 'Avg Fill Rate (Weight)', value: `${(kpi.average_fill_rate_weight * 100).toFixed(1)}%` },
        { label: 'Avg Fill Rate (Volume)', value: `${(kpi.average_fill_rate_volume * 100).toFixed(1)}%` },
    ]
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {cards.map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-4">
                    <p className="text-xs text-white/40 mb-1">{label}</p>
                    <p className="text-xl font-semibold text-white">{value}</p>
                </div>
            ))}
        </div>
    )
}

// ── Per-vehicle table ─────────────────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Optimize() {
    const navigate = useNavigate()
    const activeJobId = useOptimizeStore((s) => s.activeJobId)
    const runs = useOptimizeStore((s) => s.runs)
    const lastFailure = useOptimizeStore((s) => s.lastFailure)
    const setActiveJobId = useOptimizeStore((s) => s.setActiveJobId)
    const setLastFailure = useOptimizeStore((s) => s.setLastFailure)

    const latestRun = runs[0] ?? null

    const trigger = useMutation({
        mutationFn: runOptimizeAsync,
        onMutate: () => setLastFailure(null),
        onSuccess: (id) => setActiveJobId(id),
    })

    const { data: job } = useQuery({
        queryKey: ['job', activeJobId],
        queryFn: () => getJob(activeJobId!),
        enabled: !!activeJobId,
    })

    const isRunning = trigger.isPending || job?.status === 'pending'
    const currentStatus = isRunning ? 'pending' : latestRun ? 'success' : null

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-white">Optimize</h1>
                <p className="text-sm text-white/40 mt-1">
                    Run the routing optimization engine on imported data.
                </p>
            </div>

            <Card className="bg-[#171717] border-white/10">
                <CardContent className="flex items-center justify-between gap-4 py-5">
                    <div className="space-y-1">
                        {currentStatus ? (
                            <>
                                <StatusBadge status={currentStatus} />
                                <p className="text-xs text-white/30 font-mono">
                                    Job {job?.job_id ?? latestRun?.jobId}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-white/60">No optimization has been run yet.</p>
                        )}
                    </div>

                    <Button
                        onClick={() => trigger.mutate()}
                        disabled={isRunning}
                        className="h-9 bg-white text-[#171717] hover:bg-white/90 disabled:opacity-40 shrink-0"
                    >
                        <Zap className="size-4" />
                        {isRunning ? 'Running...' : 'Run Optimization'}
                    </Button>
                </CardContent>
            </Card>

            {trigger.isError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <AlertCircle className="size-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-400">Failed to start optimization. Please try again.</p>
                </div>
            )}

            {lastFailure?.status === 'expired' && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <Clock className="size-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-400">The job timed out before completing. Try running again.</p>
                </div>
            )}

            {lastFailure?.status === 'failure' && (
                lastFailure.error === 'No pending orders left' ? (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                        <Info className="size-4 text-amber-400 shrink-0" />
                        <p className="text-sm text-amber-400">
                            No pending orders to optimize. All orders may have already been delivered.
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                        <AlertCircle className="size-4 text-red-400 shrink-0" />
                        <p className="text-sm text-red-400">{lastFailure.error ?? 'Optimization failed. Please try again.'}</p>
                    </div>
                )
            )}

            {latestRun && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-white/30">
                                {new Date(latestRun.runAt).toLocaleString()} · Job {latestRun.jobId}
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate('/routes')}
                            className="h-9 bg-white/10 text-white hover:bg-white/15 border border-white/10"
                        >
                            <Map className="size-4" />
                            View Routes Map
                        </Button>
                    </div>

                    {latestRun.result.results.map((r) => (
                        <div key={r.solver} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                                    {r.solver}
                                </h2>
                                <span className="text-xs text-white/30">
                                    {r.routes.length} routes · {r.unassigned_orders.length} unassigned
                                </span>
                            </div>

                            <KpiCards kpi={r.kpi} />

                            {r.kpi.per_vehicle.length > 0 && (
                                <VehicleTable rows={r.kpi.per_vehicle} />
                            )}

                            {r.unassigned_orders.length > 0 && (
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                                    <p className="text-xs font-medium text-amber-400 mb-1">
                                        Unassigned orders ({r.unassigned_orders.length})
                                    </p>
                                    <p className="text-xs text-white/40 font-mono">
                                        {r.unassigned_orders.join(', ')}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
