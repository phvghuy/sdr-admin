import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { listVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/api/vehicles'
import { listWarehouses } from '@/api/warehouses'
import type { Vehicle } from '@/types/api'
import { Button } from '@/components/ui/button'

// ── Form ──────────────────────────────────────────────────────────────────────

type FormValues = {
    vehicle_id: string
    current_warehouse_id: string
    max_weight: string
    max_volume: string
}

const EMPTY_FORM: FormValues = {
    vehicle_id: '', current_warehouse_id: '', max_weight: '', max_volume: '',
}

function vehicleToForm(v: Vehicle): FormValues {
    return {
        vehicle_id: v.vehicle_id,
        current_warehouse_id: v.current_warehouse_id,
        max_weight: String(v.max_weight),
        max_volume: String(v.max_volume),
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

function VehicleModal({ mode, initial, warehouses, onClose, onSubmit, loading }: {
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
                        {mode === 'create' ? 'New Vehicle' : 'Edit Vehicle'}
                    </h2>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <Field label="Vehicle ID">
                        <TextInput
                            value={form.vehicle_id}
                            onChange={set('vehicle_id')}
                            placeholder="VEH-001"
                            disabled={mode === 'edit'}
                        />
                    </Field>

                    <Field label="Home Warehouse">
                        <select
                            value={form.current_warehouse_id}
                            onChange={(e) => set('current_warehouse_id')(e.target.value)}
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
                        <Field label="Max Weight (kg)">
                            <TextInput value={form.max_weight} onChange={set('max_weight')} placeholder="0.0" type="number" />
                        </Field>
                        <Field label="Max Volume (m³)">
                            <TextInput value={form.max_volume} onChange={set('max_volume')} placeholder="0.0" type="number" />
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

function DeleteConfirm({ vehicleId, onCancel, onConfirm, loading }: {
    vehicleId: string; onCancel: () => void; onConfirm: () => void; loading: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-sm rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-2">Delete Vehicle</h2>
                <p className="text-sm text-white/50 mb-6">
                    Are you sure you want to delete <span className="text-white font-mono">{vehicleId}</span>? This action cannot be undone.
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
    | { type: 'edit'; vehicle: Vehicle }
    | { type: 'delete'; vehicle: Vehicle }
    | null

export default function Vehicles() {
    const qc = useQueryClient()
    const [modal, setModal] = useState<ModalState>(null)

    const { data: vehicles = [], isLoading } = useQuery({ queryKey: ['vehicles'], queryFn: listVehicles })
    const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: listWarehouses })

    const invalidate = () => qc.invalidateQueries({ queryKey: ['vehicles'] })

    const createMut = useMutation({
        mutationFn: createVehicle,
        onSuccess: () => { invalidate(); setModal(null) },
    })

    const updateMut = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateVehicle>[1] }) =>
            updateVehicle(id, payload),
        onSuccess: () => { invalidate(); setModal(null) },
    })

    const deleteMut = useMutation({
        mutationFn: deleteVehicle,
        onSuccess: () => { invalidate(); setModal(null) },
    })

    function handleSubmit(values: FormValues) {
        if (modal?.type === 'create') {
            createMut.mutate({
                vehicle_id: values.vehicle_id,
                current_warehouse_id: values.current_warehouse_id,
                max_weight: Number(values.max_weight),
                max_volume: Number(values.max_volume),
            })
        } else if (modal?.type === 'edit') {
            updateMut.mutate({
                id: modal.vehicle.vehicle_id,
                payload: {
                    current_warehouse_id: values.current_warehouse_id,
                    max_weight: Number(values.max_weight),
                    max_volume: Number(values.max_volume),
                },
            })
        }
    }

    const mutLoading = createMut.isPending || updateMut.isPending

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Vehicles</h1>
                    <p className="text-sm text-white/40 mt-1">
                        {isLoading ? 'Loading...' : `${vehicles.length} vehicles`}
                    </p>
                </div>
                <Button
                    onClick={() => setModal({ type: 'create' })}
                    className="h-9 bg-white text-[#1a1a1a] hover:bg-white/90"
                >
                    <Plus className="size-4" />
                    New Vehicle
                </Button>
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.03]">
                                {['Vehicle ID', 'Home Warehouse', 'Max Weight (kg)', 'Max Volume (m³)', ''].map((h) => (
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
                            ) : vehicles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-white/30 text-sm">
                                        No vehicles found. Import a CSV or create one manually.
                                    </td>
                                </tr>
                            ) : (
                                vehicles.map((v, i) => (
                                    <tr key={v.vehicle_id} className={`border-b border-white/5 ${i % 2 !== 0 ? 'bg-white/[0.02]' : ''}`}>
                                        <td className="px-4 py-3 font-mono text-xs text-white">{v.vehicle_id}</td>
                                        <td className="px-4 py-3 text-white/60">{v.current_warehouse_id}</td>
                                        <td className="px-4 py-3 text-white/60">{v.max_weight}</td>
                                        <td className="px-4 py-3 text-white/60">{v.max_volume}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                <button
                                                    onClick={() => setModal({ type: 'edit', vehicle: v })}
                                                    className="flex size-7 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setModal({ type: 'delete', vehicle: v })}
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
                <VehicleModal
                    mode={modal.type}
                    initial={modal.type === 'edit' ? vehicleToForm(modal.vehicle) : EMPTY_FORM}
                    warehouses={warehouses}
                    onClose={() => setModal(null)}
                    onSubmit={handleSubmit}
                    loading={mutLoading}
                />
            )}

            {modal?.type === 'delete' && (
                <DeleteConfirm
                    vehicleId={modal.vehicle.vehicle_id}
                    onCancel={() => setModal(null)}
                    onConfirm={() => deleteMut.mutate(modal.vehicle.vehicle_id)}
                    loading={deleteMut.isPending}
                />
            )}
        </div>
    )
}
