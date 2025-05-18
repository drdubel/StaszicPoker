import { useEffect, useRef, useState } from 'react'

export function useWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)

  useEffect(() => {
    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      setIsConnected(true)
    }

    ws.current.onclose = () => {
      setIsConnected(false)
    }

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
      } catch (e) {
        setLastMessage(event.data)
      }
    }

    return () => {
      ws.current?.close()
    }
  }, [url])

  const sendMessage = (message: string | object) => {
    if (typeof message === 'object') {
      message = JSON.stringify(message)
    }
    ws.current?.send(message)
  }

  return { isConnected, lastMessage, sendMessage }
}