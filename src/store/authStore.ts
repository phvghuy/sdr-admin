import { create } from 'zustand'

interface AuthStore {
    token: string | null
    role: string | null
    setAuth: (token: string, role: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
    token: localStorage.getItem('access_token'),
    role: localStorage.getItem('user_role'),
    setAuth: (token, role) => {
        localStorage.setItem('access_token', token)
        localStorage.setItem('user_role', role)
        set({ token, role })
    },
    logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_role')
        set({ token: null, role: null })
    },
}))
