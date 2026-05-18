import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Upload, Zap, Map, Package, LogOut, Truck, Car, Warehouse } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { logout as logoutApi } from '@/api/auth'
import { useJobPoller } from '@/hooks/useJobPoller'
import { useWebSocket } from '@/hooks/useWebSocket'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/import', icon: Upload, label: 'Import CSV' },
    { to: '/optimize', icon: Zap, label: 'Optimize' },
    { to: '/routes', icon: Map, label: 'Routes' },
    { to: '/orders', icon: Package, label: 'Orders' },
    { to: '/vehicles', icon: Car, label: 'Vehicles' },
    { to: '/warehouses', icon: Warehouse, label: 'Warehouses' },
]

export default function AppLayout() {
    useJobPoller()
    useWebSocket()
    const logout = useAuthStore((s) => s.logout)
    const navigate = useNavigate()

    async function handleLogout() {
        try { await logoutApi() } catch { /* ignore api errors on logout */ }
        logout()
        navigate('/login', { replace: true })
    }

    return (
        <div className='flex min-h-screen'>
            <aside className='w-64 shrink-0 bg-[#171717] flex flex-col sticky top-0 h-screen'>
                <div className='flex items-center gap-2.5 px-5 py-5 border-b border-white/10'>
                    <div className='flex size-7 items-center justify-center rounded-md bg-white shrink-0'>
                        <Truck className='size-4 text-[#171717]' />
                    </div>
                    <span className='text-sm font-semibold text-white'>Smart Delivery</span>
                </div>

                <nav className='flex-1 px-3 py-4 space-y-0.5'>
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={label}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            <Icon className='size-4 shrink-0' />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className='px-3 py-4 border-t border-white/10'>
                    <button
                        onClick={handleLogout}
                        className='flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors'
                    >
                        <LogOut className='size-4 shrink-0' />
                        Logout
                    </button>
                </div>
            </aside>

            <div className='flex-1 bg-[#1c1c1c] min-h-screen'>
                <main className='px-8 py-8'>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
