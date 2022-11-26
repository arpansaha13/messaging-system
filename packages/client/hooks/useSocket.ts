import { useEffect, useState } from 'react'
import io from 'socket.io-client'

const socket = io('http://localhost:4000', { autoConnect: true })

export function useSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected)

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('pong', () => {
      console.log('pong')
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('pong')
    }
  }, [])

  return { isConnected, socket }
}
