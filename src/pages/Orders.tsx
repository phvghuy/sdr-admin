import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { listOrders, createOrder, updateOrder, deleteOrder } from '@/api/orders'
import { listWarehouses } from '@/api/warehouses'
import type { Order } from '@/types/api'
import { Button } from '@/components/ui/button'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    pending:   'bg-amber-500/15 text-amber-400',
    assigned:  'bg-blue-500/15 text-blue-400',
    delivered: 'bg-emerald-500/15 text-emerald-400',
    cancelled: 'bg-red-500/15 text-red-400',
}

function StatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLES[status] ?? 'bg-white/10 text-white/50'
    return (
        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${style}`}>
            {status}
        </span>
    )
}

// ── Order form ────────────────────────────────────────────────────────────────

type FormValues = {
    order_id: string
    warehouse_id: string
    lat: string
    lng: string
    weight: string
    volume: string
    status: string
}

const EMPTY_FORM: FormValues = {
    order_id: '', warehouse_id: '', lat: '', lng: '',
    weight: '', volume: '', status: 'pending',
}

function orderToForm(o: Order): FormValues {
    return {
        order_id: o.order_id,
        warehouse_id: o.warehouse_id,
        lat: String(o.lat),
        lng: String(o.lng),
        weight: String(o.weight),
        volume: String(o.volume),
        status: o.status,
    }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50">{label}</label>
            {children}
        </div>
    )
}

function TextInput({ value, onChange, placeholder, disabled, type = 'text' }: {
    value: string; onChange: (v: string) => void
    placeholder?: string; disabled?: boolean; type?: string
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 disabled:opacity-40 transition-colors"
        />
    )
}

function OrderModal({ mode, initial, warehouses, onClose, onSubmit, loading }: {
    mode: 'create' | 'edit'
    initial: FormValues
    warehouses: { warehouse_id: string; name: string }[]
    onClose: () => void
    onSubmit: (values: FormValues) => void
    loading: boolean
}) {
    const [form, setForm] = useState<FormValues>(initial)
    const set = (key: keyof FormValues) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-white">
                        {mode === 'create' ? 'New Order' : 'Edit Order'}
                    </h2>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <Field label="Order ID">
                        <TextInput
                            value={form.order_id}
                            onChange={set('order_id')}
                            placeholder="ORD-001"
                            disabled={mode === 'edit'}
                        />
                    </Field>

                    <Field label="Warehouse">
                        <select
                            value={form.warehouse_id}
                            onChange={(e) => set('warehouse_id')(e.target.value)}
                            className="w-full h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                        >
                            <option value="" className="bg-[#1a1a1a]">Select warehouse...</option>
                            {warehouses.map((w) => (
                                <option key={w.warehouse_id} value={w.warehouse_id} className="bg-[#1a1a1a]">
                                    {w.name} ({w.warehouse_id})
                                </option>
                            ))}
                        </select>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Latitude">
                            <TextInput value={form.lat} onChange={set('lat')} placeholder="10.776" type="number" />
                        </Field>
                        <Field label="Longitude">
                            <TextInput value={form.lng} onChange={set('lng')} placeholder="106.700" type="number" />
                        </Field>
                        <Field label="Weight (kg)">
                            <TextInput value={form.weight} onChange={set('weight')} placeholder="0.0" type="number" />
                        </Field>
                        <Field label="Volume (m³)">
                            <TextInput value={form.volume} onChange={set('volume')} placeholder="0.0" type="number" />
                        </Field>
                    </div>

                    {mode === 'edit' && (
                        <Field label="Status">
                            <select
                                value={form.status}
                                onChange={(e) => set('status')(e.target.value)}
                                className="w-full h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                            >
                                {['pending', 'assigned', 'delivered', 'cancelled'].map((s) => (
                                    <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>
                                ))}
                            </select>
                        </Field>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        onClick={onClose}
                        className="h-9 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-0"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSubmit(form)}
                        disabled={loading}
                        className="h-9 bg-white text-[#1a1a1a] hover:bg-white/90 disabled:opacity-40"
                    >
                        {loading && <Loader2 className="size-3.5 animate-spin" />}
                        {mode === 'create' ? 'Create' : 'Save'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ orderId, onCancel, onConfirm, loading }: {
    orderId: string; onCancel: () => void; onConfirm: () => void; loading: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-sm rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-2">Delete Order</h2>
                <p className="text-sm text-white/50 mb-6">
                    Are you sure you want to delete <span className="text-white font-mono">{orderId}</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                    <Button onClick={onCancel} className="h-9 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-0">
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={loading} className="h-9 bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-40 border-0">
                        {loading && <Loader2 className="size-3.5 animate-spin" />}
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ModalState =
    | { type: 'create' }
    | { type: 'edit'; order: Order }
    | { type: 'delete'; order: Order }
    | null

export default function Orders() {
    const qc = useQueryClient()
    const [modal, setModal] = useState<ModalState>(null)

    const { data: orders = [], isLoading } = useQuery({ queryKey: ['orders'], queryFn: listOrders })
    const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses })

    const invalidate = () => qc.invalidateQueries({ queryKey: ['orders'] })

    const createMut = useMutation({
        mutationFn: createOrder,
        onSuccess: () => { invalidate(); setModal(null) },
    })

    const updateMut = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateOrder>[1] }) =>
            updateOrder(id, payload),
        onSuccess: () => { invalidate(); setModal(null) },
    })

    const deleteMut = useMutation({
        mutationFn: deleteOrder,
        onSuccess: () => { invalidate(); setModal(null) },
    })

    function handleSubmit(values: FormValues) {
        if (modal?.type === 'create') {
            createMut.mutate({
                order_id: values.order_id,
                warehouse_id: values.warehouse_id,
                lat: Number(values.lat),
                lng: Number(values.lng),
                weight: Number(values.weight),
                volume: Number(values.volume),
            })
        } else if (modal?.type === 'edit') {
            updateMut.mutate({
                id: modal.order.order_id,
                payload: {
                    warehouse_id: values.warehouse_id,
                    lat: Number(values.lat),
                    lng: Number(values.lng),
                    weight: Number(values.weight),
                    volume: Number(values.volume),
                    status: values.status,
                },
            })
        }
    }

    const mutLoading = createMut.isPending || updateMut.isPending

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Orders</h1>
                    <p className="text-sm text-white/40 mt-1">
                        {isLoading ? 'Loading...' : `${orders.length} orders`}
                    </p>
                </div>
                <Button
                    onClick={() => setModal({ type: 'create' })}
                    className="h-9 bg-white text-[#1a1a1a] hover:bg-white/90"
                >
                    <Plus className="size-4" />
                    New Order
                </Button>
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.03]">
                                {['Order ID', 'Warehouse', 'Weight', 'Volume', 'Status', 'Lat', 'Lng', ''].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/40 whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-white/30 text-sm">
                                        <Loader2 className="size-5 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-white/30 text-sm">
                                        No orders found. Import a CSV or create one manually.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order, i) => (
                                    <tr key={order.order_id} className={`border-b border-white/5 ${i % 2 !== 0 ? 'bg-white/[0.02]' : ''}`}>
                                        <td className="px-4 py-3 font-mono text-xs text-white">{order.order_id}</td>
                                        <td className="px-4 py-3 text-white/60">{order.warehouse_id}</td>
                                        <td className="px-4 py-3 text-white/60">{order.weight}</td>
                                        <td className="px-4 py-3 text-white/60">{order.volume}</td>
                                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                                        <td className="px-4 py-3 text-white/40 font-mono text-xs">{order.lat.toFixed(5)}</td>
                                        <td className="px-4 py-3 text-white/40 font-mono text-xs">{order.lng.toFixed(5)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                <button
                                                    onClick={() => setModal({ type: 'edit', order })}
                                                    className="flex size-7 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setModal({ type: 'delete', order })}
                                                    className="flex size-7 items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {(modal?.type === 'create' || modal?.type === 'edit') && (
                <OrderModal
                    mode={modal.type}
                    initial={modal.type === 'edit' ? orderToForm(modal.order) : EMPTY_FORM}
                    warehouses={warehouses}
                    onClose={() => setModal(null)}
                    onSubmit={handleSubmit}
                    loading={mutLoading}
                />
            )}

            {modal?.type === 'delete' && (
                <DeleteConfirm
                    orderId={modal.order.order_id}
                    onCancel={() => setModal(null)}
                    onConfirm={() => deleteMut.mutate(modal.order.order_id)}
                    loading={deleteMut.isPending}
                />
            )}
        </div>
    )
}
