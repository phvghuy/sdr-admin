import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

export function useWebSocket() {
    const qc = useQueryClient()

    useEffect(() => {
        const token = localStorage.getItem("access_token")
        const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`)

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.event === "order.delivered") {
                qc.invalidateQueries({ queryKey: ['orders'] })
            }
        }

        return () => ws.close()
    }, [])
}
