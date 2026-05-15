import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useQuery } from '@tanstack/react-query'
import 'leaflet/dist/leaflet.css'
import { useOptimizeStore, type OptimizeRun } from '@/store/optimizeStore'
import { listOrders } from '@/api/orders'
import { listWarehouses } from '@/api/warehouses'
import type { Route, Order, Warehouse } from '@/types/api'

// ── Colors ────────────────────────────────────────────────────────────────────

const ROUTE_COLORS = [
    '#2563eb', '#ea580c', '#9333ea', '#16a34a', '#dc2626',
    '#ca8a04', '#0891b2', '#db2777', '#65a30d', '#e11d48',
    '#7c3aed', '#0d9488', '#c2410c', '#4f46e5', '#059669',
    '#d97706', '#0284c7', '#c026d3', '#0f766e', '#b45309',
    '#1d4ed8', '#15803d', '#b91c1c', '#7e22ce', '#0369a1',
]

// ── Fit bounds ────────────────────────────────────────────────────────────────

function FitBounds({ points }: { points: [number, number][] }) {
    const map = useMap()
    useEffect(() => {
        if (points.length > 0) map.fitBounds(points, { padding: [40, 40] })
    }, [points, map])
    return null
}

// ── Map ───────────────────────────────────────────────────────────────────────

function RouteMap({ routes, warehouses, unassignedOrders, orderMap, activeVehicle }: {
    routes: Route[]
    warehouses: Warehouse[]
    unassignedOrders: string[]
    orderMap: Map<string, Order>
    activeVehicle: string | null
}) {
    const allPoints = useMemo<[number, number][]>(() => [
        ...routes.flatMap((r) => r.stops.map((s) => [s.lat, s.lng] as [number, number])),
        ...warehouses.map((w) => [w.lat, w.lng] as [number, number]),
        ...unassignedOrders.flatMap((id) => {
            const o = orderMap.get(id)
            return o ? [[o.lat, o.lng] as [number, number]] : []
        }),
    ], [routes, warehouses, unassignedOrders, orderMap])

    return (
        <MapContainer center={[10.8231, 106.6297]} zoom={11} className="w-full h-full">
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            {/* Routes */}
            {routes.map((route, i) => {
                const color = ROUTE_COLORS[i % ROUTE_COLORS.length]
                const dimmed = activeVehicle !== null && activeVehicle !== route.vehicle_id
                const opacity = dimmed ? 0.12 : 1

                return (
                    <React.Fragment key={route.vehicle_id}>
                        <Polyline
                            positions={route.geometry}
                            pathOptions={{ color, weight: 2.5, opacity }}
                        />
                        {route.stops.map((stop, j) => {
                            const order = orderMap.get(stop.order_id)
                            return (
                                <CircleMarker
                                    key={stop.order_id}
                                    center={[stop.lat, stop.lng]}
                                    radius={j === 0 ? 7 : 5}
                                    pathOptions={{
                                        color,
                                        fillColor: j === 0 ? color : '#fff',
                                        fillOpacity: dimmed ? 0.12 : 1,
                                        opacity,
                                        weight: 2,
                                    }}
                                >
                                    <Popup>
                                        <div className="text-xs space-y-0.5 min-w-[120px]">
                                            <p className="font-semibold text-sm">{stop.order_id}</p>
                                            <p className="text-gray-500">Stop #{j + 1} · {route.vehicle_id}</p>
                                            {order && (
                                                <>
                                                    <p className="text-gray-500">Weight: {order.weight}</p>
                                                    <p className="text-gray-500">Volume: {order.volume}</p>
                                                </>
                                            )}
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            )
                        })}
                    </React.Fragment>
                )
            })}

            {/* Warehouses */}
            {warehouses.map((w) => (
                <CircleMarker
                    key={w.warehouse_id}
                    center={[w.lat, w.lng]}
                    radius={10}
                    pathOptions={{ color: '#1e293b', fillColor: '#1e293b', fillOpacity: 1, weight: 2 }}
                >
                    <Popup>
                        <div className="text-xs space-y-0.5">
                            <p className="font-semibold text-sm">{w.name}</p>
                            <p className="text-gray-500">{w.warehouse_id}</p>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}

            {/* Unassigned orders */}
            {unassignedOrders.map((id) => {
                const order = orderMap.get(id)
                if (!order) return null
                return (
                    <CircleMarker
                        key={id}
                        center={[order.lat, order.lng]}
                        radius={5}
                        pathOptions={{ color: '#9ca3af', fillColor: '#9ca3af', fillOpacity: 0.8, weight: 1.5 }}
                    >
                        <Popup>
                            <div className="text-xs space-y-0.5 min-w-[120px]">
                                <p className="font-semibold text-sm">{order.order_id}</p>
                                <p className="text-red-500 font-medium">Unassigned</p>
                                <p className="text-gray-500">Weight: {order.weight}</p>
                                <p className="text-gray-500">Volume: {order.volume}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                )
            })}

            <FitBounds points={allPoints} />
        </MapContainer>
    )
}

// ── Vehicle panel ─────────────────────────────────────────────────────────────

function VehiclePanel({ routes, unassignedCount, activeVehicle, onSelect }: {
    routes: Route[]
    unassignedCount: number
    activeVehicle: string | null
    onSelect: (id: string | null) => void
}) {
    return (
        <div className="flex flex-col gap-0.5 overflow-y-auto">
            <button
                onClick={() => onSelect(null)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${activeVehicle === null
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
                All vehicles
            </button>

            {routes.map((route, i) => {
                const color = ROUTE_COLORS[i % ROUTE_COLORS.length]
                const isActive = activeVehicle === route.vehicle_id
                return (
                    <button
                        key={route.vehicle_id}
                        onClick={() => onSelect(isActive ? null : route.vehicle_id)}
                        className={`text-left px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="size-2.5 rounded-full shrink-0" style={{ background: color }} />
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{route.vehicle_id}</p>
                                <p className="text-xs text-white/30 mt-0.5">
                                    {route.stops.length} stops · {route.total_distance_km.toFixed(1)} km
                                </p>
                            </div>
                        </div>
                    </button>
                )
            })}

            {unassignedCount > 0 && (
                <div className="mt-2 px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                        <span className="size-2.5 rounded-full shrink-0 bg-gray-500" />
                        <div>
                            <p className="text-sm font-medium text-white/50">Unassigned</p>
                            <p className="text-xs text-white/30 mt-0.5">{unassignedCount} orders</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Selectors ─────────────────────────────────────────────────────────────────

function RunSelector({ runs, selectedIndex, onChange }: {
    runs: OptimizeRun[]
    selectedIndex: number
    onChange: (i: number) => void
}) {
    return (
        <select
            value={selectedIndex}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
        >
            {runs.map((run, i) => (
                <option key={run.jobId} value={i} className="bg-[#1c1c1c]">
                    Run #{runs.length - i} — {run.runAt.toLocaleString()}
                </option>
            ))}
        </select>
    )
}

function SolverTabs({ solvers, active, onChange }: {
    solvers: string[]
    active: string
    onChange: (s: string) => void
}) {
    if (solvers.length <= 1) return null
    return (
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
            {solvers.map((s) => (
                <button
                    key={s}
                    onClick={() => onChange(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${active === s ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'}`}
                >
                    {s}
                </button>
            ))}
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RoutesPage() {
    const runs = useOptimizeStore((s) => s.runs)
    const [runIndex, setRunIndex] = useState(0)
    const [activeSolver, setActiveSolver] = useState('')
    const [activeVehicle, setActiveVehicle] = useState<string | null>(null)

    const { data: allOrders = [] } = useQuery({ queryKey: ['orders'], queryFn: listOrders })
    const { data: allWarehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses })

    const orderMap = useMemo(
        () => new Map(allOrders.map((o) => [o.order_id, o])),
        [allOrders]
    )

    const selectedRun = runs[runIndex]
    const solvers = selectedRun?.result.results.map((r) => r.solver) ?? []

    useEffect(() => {
        if (solvers.length > 0 && (!activeSolver || !solvers.includes(activeSolver))) {
            setActiveSolver(solvers[0])
        }
    }, [runIndex, solvers, activeSolver])

    const currentResult = selectedRun?.result.results.find((r) => r.solver === activeSolver)
    const routes = currentResult?.routes ?? []
    const unassignedOrders = currentResult?.unassigned_orders ?? []

    if (runs.length === 0) return (
        <div>
            <h1 className="text-xl font-semibold text-white mb-4">Routes</h1>
            <div className="flex flex-col items-center justify-center h-[500px]">
                <p className="text-white/40 text-sm">No optimization results yet.</p>
                <p className="text-white/20 text-xs mt-1">Run an optimization first to view routes here.</p>
            </div>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold text-white">Routes</h1>
                <div className="flex items-center gap-2">
                    <SolverTabs solvers={solvers} active={activeSolver} onChange={setActiveSolver} />
                    <RunSelector
                        runs={runs}
                        selectedIndex={runIndex}
                        onChange={(i) => { setRunIndex(i); setActiveVehicle(null) }}
                    />
                </div>
            </div>

            <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[500px]">
                <div className="w-56 shrink-0 rounded-xl border border-white/10 bg-[#171717] p-2 overflow-y-auto">
                    <VehiclePanel
                        routes={routes}
                        unassignedCount={unassignedOrders.length}
                        activeVehicle={activeVehicle}
                        onSelect={setActiveVehicle}
                    />
                </div>

                <div className="flex-1 rounded-xl overflow-hidden border border-white/10">
                    <RouteMap
                        routes={routes}
                        warehouses={allWarehouses}
                        unassignedOrders={unassignedOrders}
                        orderMap={orderMap}
                        activeVehicle={activeVehicle}
                    />
                </div>
            </div>
        </div>
    )
}
