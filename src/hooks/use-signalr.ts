import { API_BASE_URL } from '@/config/api'
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr'
import { useEffect, useRef, useState } from 'react'

export function useSignalR(hubUrl: string) {
  const [isConnected, setIsConnected] = useState(false)
  const connection = useRef<HubConnection | null>(null)

  useEffect(() => {
    const connect = async () => {
      try {
        connection.current = new HubConnectionBuilder()
          .withUrl(`${API_BASE_URL}${hubUrl}`)
          .withAutomaticReconnect()
          .build()

        connection.current.onclose(() => setIsConnected(false))
        connection.current.onreconnecting(() => setIsConnected(false))
        connection.current.onreconnected(() => setIsConnected(true))

        await connection.current.start()
        setIsConnected(true)
        console.log('SignalR Connected')
      } catch (err) {
        console.error('Error starting SignalR:', err)
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      if (connection.current) {
        connection.current.stop()
      }
    }
  }, [hubUrl])

  return { connection: connection.current, isConnected }
} 