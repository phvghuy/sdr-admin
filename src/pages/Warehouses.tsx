import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { listWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '@/api/warehouses'
import type { Warehouse } from '@/types/api'
import { Button } from '@/components/ui/button'

// ── Form ──────────────────────────────────────────────────────────────────────

type FormValues = {
    warehouse_id: string
    name: string
    lat: string
    lng: string
}

const EMPTY_FORM: FormValues = {
    warehouse_id: '', name: '', lat: '', lng: '',
}

function warehouseToForm(w: Warehouse): FormValues {
    return {
        warehouse_id: w.warehouse_id,
        name: w.name,
        lat: String(w.lat),
        lng: String(w.lng),
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

function WarehouseModal({ mode, initial, onClose, onSubmit, loading }: {
    mode: 'create' | 'edit'
    initial: FormValues
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
                        {mode === 'create' ? 'New Warehouse' : 'Edit Warehouse'}
                    </h2>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <Field label="Warehouse ID">
                        <TextInput
                            value={form.warehouse_id}
                            onChange={set('warehouse_id')}
                            placeholder="WH-001"
                            disabled={mode === 'edit'}
                        />
                    </Field>

                    <Field label="Name">
                        <TextInput
                            value={form.name}
                            onChange={set('name')}
                            placeholder="Warehouse name"
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Latitude">
                            <TextInput value={form.lat} onChange={set('lat')} placeholder="10.776" type="number" />
                        </Field>
                        <Field label="Longitude">
                            <TextInput value={form.lng} onChange={set('lng')} placeholder="106.700" type="number" />
                        </Field>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button onClick={onClose} className="h-9 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-0">
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

function DeleteConfirm({ warehouseId, onCancel, onConfirm, loading }: {
    warehouseId: string; onCancel: () => void; onConfirm: () => void; loading: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-sm rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-2">Delete Warehouse</h2>
                <p className="text-sm text-white/50 mb-6">
                    Are you sure you want to delete <span className="text-white font-mono">{warehouseId}</span>? This action cannot be undone.
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
    | { type: 'edit'; warehouse: Warehouse }
    | { type: 'delete'; warehouse: Warehouse }
    | null

export default function Warehouses() {
    const qc = useQueryClient()
    const [modal, setModal] = useState<ModalState>(null)

    const { data: warehouses = [], isLoading } = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses })

    const invalidate = () => qc.invalidateQueries({ queryKey: ['warehouses'] })

    const createMut = useMutation({
        mutationFn: createWarehouse,
        onSuccess: () => { invalidate(); setModal(null) },
    })

    const updateMut = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateWarehouse>[1] }) =>
            updateWarehouse(id, payload),
        onSuccess: () => { invalidate(); setModal(null) },
    })

    const deleteMut = useMutation({
        mutationFn: deleteWarehouse,
        onSuccess: () => { invalidate(); setModal(null) },
    })

    function handleSubmit(values: FormValues) {
        if (modal?.type === 'create') {
            createMut.mutate({
                warehouse_id: values.warehouse_id,
                name: values.name,
                lat: Number(values.lat),
                lng: Number(values.lng),
            })
        } else if (modal?.type === 'edit') {
            updateMut.mutate({
                id: modal.warehouse.warehouse_id,
                payload: {
                    name: values.name,
                    lat: Number(values.lat),
                    lng: Number(values.lng),
                },
            })
        }
    }

    const mutLoading = createMut.isPending || updateMut.isPending

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Warehouses</h1>
                    <p className="text-sm text-white/40 mt-1">
                        {isLoading ? 'Loading...' : `${warehouses.length} warehouses`}
                    </p>
                </div>
                <Button
                    onClick={() => setModal({ type: 'create' })}
                    className="h-9 bg-white text-[#1a1a1a] hover:bg-white/90"
                >
                    <Plus className="size-4" />
                    New Warehouse
                </Button>
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.03]">
                                {['Warehouse ID', 'Name', 'Latitude', 'Longitude', ''].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/40 whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center">
                                        <Loader2 className="size-5 animate-spin mx-auto text-white/30" />
                                    </td>
                                </tr>
                            ) : warehouses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-white/30 text-sm">
                                        No warehouses found. Import a CSV or create one manually.
                                    </td>
                                </tr>
                            ) : (
                                warehouses.map((w, i) => (
                                    <tr key={w.warehouse_id} className={`border-b border-white/5 ${i % 2 !== 0 ? 'bg-white/[0.02]' : ''}`}>
                                        <td className="px-4 py-3 font-mono text-xs text-white">{w.warehouse_id}</td>
                                        <td className="px-4 py-3 text-white/60">{w.name}</td>
                                        <td className="px-4 py-3 text-white/40 font-mono text-xs">{w.lat.toFixed(5)}</td>
                                        <td className="px-4 py-3 text-white/40 font-mono text-xs">{w.lng.toFixed(5)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                <button
                                                    onClick={() => setModal({ type: 'edit', warehouse: w })}
                                                    className="flex size-7 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setModal({ type: 'delete', warehouse: w })}
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
                <WarehouseModal
                    mode={modal.type}
                    initial={modal.type === 'edit' ? warehouseToForm(modal.warehouse) : EMPTY_FORM}
                    onClose={() => setModal(null)}
                    onSubmit={handleSubmit}
                    loading={mutLoading}
                />
            )}

            {modal?.type === 'delete' && (
                <DeleteConfirm
                    warehouseId={modal.warehouse.warehouse_id}
                    onCancel={() => setModal(null)}
                    onConfirm={() => deleteMut.mutate(modal.warehouse.warehouse_id)}
                    loading={deleteMut.isPending}
                />
            )}
        </div>
    )
}
