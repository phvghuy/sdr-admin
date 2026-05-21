import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { VITE_API_URL } from "@/lib/config"

export function useWebSocket() {
    const qc = useQueryClient()

    useEffect(() => {
        const token = localStorage.getItem("access_token")
        const wsProtocol = VITE_API_URL.startsWith('https') ? 'wss' : 'ws'
        const wsHost = VITE_API_URL.replace(/^https?:\/\//, '')
        const ws = new WebSocket(`${wsProtocol}://${wsHost}/ws?token=${token}`)

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.event === "order.delivered") {
                qc.invalidateQueries({ queryKey: ['orders'] })
            }
        }

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close()
            } else if (ws.readyState === WebSocket.CONNECTING) {
                ws.onopen = () => ws.close()
            }
        }
    }, [])
}
