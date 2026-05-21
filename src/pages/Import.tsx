import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Upload, FileText, CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react'
import { importCSV } from '@/api/import'
import type { ImportResponse } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type FileSlot = {
    key: 'orders' | 'vehicles' | 'warehouses'
    label: string
    description: string
}

const FILE_SLOTS: FileSlot[] = [
    { key: 'orders', label: 'Orders', description: 'order_id, lat, lng, weight, volume, ...' },
    { key: 'vehicles', label: 'Vehicles', description: 'vehicle_id, capacity_weight, capacity_volume, ...' },
    { key: 'warehouses', label: 'Warehouses', description: 'warehouse_id, lat, lng, ...' },
]

function FilePicker({
    label,
    description,
    file,
    onChange,
}: {
    label: string
    description: string
    file: File | null
    onChange: (f: File | null) => void
}) {
    const ref = useRef<HTMLInputElement>(null)

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        const dropped = e.dataTransfer.files[0]
        if (dropped?.name.endsWith('.csv')) onChange(dropped)
    }

    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !file && ref.current?.click()}
            className={`relative rounded-xl border transition-colors ${
                file
                    ? 'border-white/20 bg-white/5 cursor-default'
                    : 'border-dashed border-white/20 bg-white/[0.03] hover:border-white/30 hover:bg-white/5 cursor-pointer'
            } p-5`}
        >
            <input
                ref={ref}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />

            {file ? (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                            <FileText className="size-4 text-white/70" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{file.name}</p>
                            <p className="text-xs text-white/40 mt-0.5">
                                {(file.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onChange(null) }}
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                        <Upload className="size-4 text-white/30" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white/60">
                            {label} <span className="text-white/30 font-normal">.csv</span>
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">{description}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

function ResultCard({ result, onOptimize }: { result: ImportResponse; onOptimize: () => void }) {
    const stats = [
        { label: 'Orders', value: result.imported_orders },
        { label: 'Vehicles', value: result.imported_vehicles },
        { label: 'Warehouses', value: result.imported_warehouses },
    ]

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Import successful</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
                {stats.map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-white/5 px-4 py-3 text-center">
                        <p className="text-2xl font-semibold text-white">{value}</p>
                        <p className="text-xs text-white/40 mt-1">{label}</p>
                    </div>
                ))}
            </div>
            <Button
                onClick={onOptimize}
                className="w-full h-10 bg-emerald-500 text-white hover:bg-emerald-400"
            >
                Go to Optimize
                <ArrowRight className="size-4 ml-2" />
            </Button>
        </div>
    )
}

export default function Import() {
    const navigate = useNavigate()
    const [files, setFiles] = useState<Record<string, File | null>>({
        orders: null,
        vehicles: null,
        warehouses: null,
    })

    const mutation = useMutation({
        mutationFn: () => importCSV(files.orders!, files.vehicles!, files.warehouses!),
    })

    const allSelected = FILE_SLOTS.every((s) => files[s.key] !== null)

    function handleChange(key: string, file: File | null) {
        setFiles((prev) => ({ ...prev, [key]: file }))
        if (mutation.isSuccess || mutation.isError) mutation.reset()
    }

    return (
        <div className="max-w-lg mx-auto">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-white">Import CSV</h1>
                <p className="text-sm text-white/40 mt-1">
                    Upload 3 CSV files to import data into the system.
                </p>
            </div>

            <Card className="bg-[#171717] border-white/10">
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-medium text-white/60">Select files</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {FILE_SLOTS.map((slot) => (
                        <FilePicker
                            key={slot.key}
                            label={slot.label}
                            description={slot.description}
                            file={files[slot.key]}
                            onChange={(f) => handleChange(slot.key, f)}
                        />
                    ))}

                    {mutation.isError && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
                            <AlertCircle className="size-4 text-red-400 shrink-0" />
                            <p className="text-sm text-red-400">
                                Import failed. Please check your files and try again.
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={!allSelected || mutation.isPending}
                        className="w-full h-10 bg-white text-[#171717] hover:bg-white/90 disabled:opacity-40 mt-1"
                    >
                        {mutation.isPending ? 'Importing...' : 'Import'}
                    </Button>
                </CardContent>
            </Card>

            {mutation.isSuccess && mutation.data && (
                <div className="mt-4">
                    <ResultCard result={mutation.data} onOptimize={() => navigate('/optimize')} />
                </div>
            )}
        </div>
    )
}
