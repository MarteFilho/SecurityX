import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from '@/config/api'
import { useToast } from '@/hooks/use-toast'
import { IconArrowLeft } from '@tabler/icons-react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { VulnerabilityList } from './vulnerability-list'

export function ScanDetails() {
  const { scanId } = useParams({ from: '/_authenticated/scans/$scanId' })
  const navigate = useNavigate()
  const { toast } = useToast()
  const [scan, setScan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchScan()
  }, [scanId])

  async function fetchScan() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scans/${scanId}`)
      if (!response.ok) throw new Error('Failed to fetch scan')
      const data = await response.json()
      setScan(data)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load scan details'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header sticky>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => navigate({ to: '/scans' })}
          >
            <IconArrowLeft size={16} />
            <span>Back to Scans</span>
          </Button>
          {scan && (
            <div>
              <h1 className="text-xl font-semibold">{scan.name}</h1>
              <p className="text-sm text-muted-foreground">{scan.target}</p>
            </div>
          )}
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        {isLoading ? (
          <div>Loading...</div>
        ) : scan ? (
          <VulnerabilityList vulnerabilities={scan.vulnerabilities} />
        ) : (
          <div>Scan not found</div>
        )}
      </Main>
    </>
  )
} 