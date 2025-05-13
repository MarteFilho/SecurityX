import { useSignalR } from '@/hooks/use-signalr'
import { useCallback, useEffect } from 'react'
import { Scan } from '../types'

interface ScanStreamProps {
  scanId: string
  onUpdate: (scan: Scan) => void
  onComplete: (scanId: string) => void
}

export function ScanStream({ scanId, onUpdate, onComplete }: ScanStreamProps) {
  const { connection, isConnected } = useSignalR('/hubs/scan')

  const handleUpdate = useCallback((scan: Scan) => {
    console.log('Received scan update:', scan)
    onUpdate(scan)
    if (scan.status === 'Completed' || scan.status === 'Failed') {
      onComplete(scanId)
    }
  }, [onUpdate, onComplete, scanId])

  useEffect(() => {
    if (!connection || !isConnected) return

    const setupConnection = async () => {
      try {
        // Entrar no grupo do scan
        await connection.invoke('JoinScanGroup', scanId)
        console.log('Joined scan group:', scanId)

        // Configurar handlers
        connection.on('ScanUpdated', handleUpdate)
        connection.on('ScanError', () => {
          console.log('Scan error received')
          onComplete(scanId)
        })

        console.log('SignalR handlers configured')
      } catch (err) {
        console.error('Error setting up SignalR connection:', err)
      }
    }

    setupConnection()

    return () => {
      if (connection && isConnected) {
        connection.off('ScanUpdated')
        connection.off('ScanError')
        connection.invoke('LeaveScanGroup', scanId)
          .catch(err => console.error('Error leaving scan group:', err))
      }
    }
  }, [connection, isConnected, scanId, handleUpdate, onComplete])

  return null
} 