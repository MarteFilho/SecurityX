import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBug,
  IconCheck,
  IconClock,
  IconLoader2,
  IconPlus,
  IconShieldCheck,
  IconShieldX,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react'
import { useRouter, useSearch } from '@tanstack/react-router'
import React, { useEffect, useState } from 'react'
import { NewScanDialog } from './components/new-scan-dialog'
import { ScanStream } from './components/scan-stream'

const API_BASE_URL = 'https://localhost:7001'

interface Vulnerability {
  id: string
  ruleId: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  description: string
  details: string
}

interface Scan {
  id: string
  name: string
  type: string
  target: string
  status: string
  createdAt: string
  completedAt?: string
  vulnerabilities: Vulnerability[]
}

interface Api {
  id: string
  name: string
  baseUrl: string
}

interface SearchParams {
  apiId: string
}

const severityColors = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}

const statusColors = {
  Initializing: 'bg-blue-500',
  Running: 'bg-yellow-500',
  Completed: 'bg-green-500',
  Failed: 'bg-red-500',
}

const statusIcons = {
  Initializing: IconClock,
  Running: IconLoader2,
  Completed: IconCheck,
  Failed: IconShieldX,
}

export default function Scans() {
  const { toast } = useToast()
  const [sort, setSort] = useState('ascending')
  const router = useRouter()
  const search = useSearch({})
  const [api, setApi] = useState<Api | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeScans, setActiveScans] = useState<string[]>([])
  const [openNewScan, setOpenNewScan] = useState(false)

  // Buscar detalhes da API
  useEffect(() => {
    if (search.apiId) {
      fetchApi(search.apiId)
    } else {
      router.navigate({ to: '/apis' })
    }
  }, [search.apiId])

  async function fetchApi(apiId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/apis/${apiId}`)
      if (!response.ok) throw new Error('Failed to fetch API')
      const data = await response.json()
      setApi(data)
      fetchScans(apiId)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load API',
      })
    }
  }

  async function fetchScans(apiId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scans?apiId=${apiId}`)
      if (!response.ok) throw new Error('Failed to fetch scans')
      const data = await response.json()
      setScans(data)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load scans',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Conecta aos streams de todos os scans ativos
  useEffect(() => {
    scans
      ?.filter((scan) => scan.status === 'Running')
      ?.forEach((scan) => {
        if (!activeScans.includes(scan.id)) {
          setActiveScans((prev) => [...prev, scan.id])
        }
      })
  }, [scans])

  const handleScanUpdate = (updatedScan: Scan) => {
    setScans((prev) =>
      prev.map((s) => (s.id === updatedScan.id ? updatedScan : s))
    )
  }

  const handleScanComplete = (scanId: string) => {
    setActiveScans((prev) => prev?.filter((id) => id !== scanId))
  }

  // Dados para o gráfico de severidade
  const severityData = scans.reduce(
    (acc, scan) => {
      scan?.vulnerabilities?.forEach((vuln) => {
        acc[vuln.severity] = (acc[vuln.severity] || 0) + 1
      })
      return acc
    },
    {} as Record<string, number>
  )



  // Função para calcular a variação percentual
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  // Pegar o scan anterior para comparação
  const previousScan = scans[1] // O índice 1 porque o scan mais recente está no índice 0

  const vulnerabilitiesChange = calculatePercentageChange(
    scans.reduce((acc, scan) => acc + scan?.vulnerabilities?.length, 0),
    previousScan ? previousScan?.vulnerabilities?.length : 0
  )

  const criticalIssuesChange = calculatePercentageChange(
    scans.reduce(
      (acc, scan) =>
        acc +
        scan?.vulnerabilities?.filter((v) => v.severity === 'Critical').length,
      0
    ),
    previousScan
      ? previousScan?.vulnerabilities?.filter((v) => v.severity === 'Critical')
          .length
      : 0
  )

  const activeScansChange = calculatePercentageChange(
    scans?.filter((scan) => scan.status === 'Running').length,
    previousScan ? (previousScan.status === 'Running' ? 1 : 0) : 0
  )

  // Preparar dados para o timeline
  const timelineData = scans
    .slice() // Criar cópia para não modificar o array original
    .reverse() // Reverter para ordem cronológica
    .map((scan) => ({
      count: scan.vulnerabilities?.length,
      date: scan.createdAt,
    }))

  return (
    <>
      <Header sticky>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.navigate({ to: '/apis' })}
          >
            <IconArrowLeft className='mr-2 h-4 w-4' />
            Back to APIs
          </Button>
          {api && (
            <div>
              <h1 className='text-xl font-semibold'>{api.name}</h1>
              <p className='text-sm text-muted-foreground'>{api.baseUrl}</p>
            </div>
          )}
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Scans</h1>
          <p className='text-muted-foreground'>Manage and monitor your scans</p>
        </div>

        <div className='flex justify-end mb-4'>
          <Button onClick={() => setOpenNewScan(true)}>
            <IconPlus className='mr-2 h-4 w-4' />
            New Scan
          </Button>
        </div>

        

        <Separator className='shadow mt-4' />

        {/* Stats Cards */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6 mt-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-2x1 font-medium'>Total Scans</CardTitle>
              <IconShieldCheck className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-2'>
                <div className='text-4xl font-bold'>{scans?.length}</div>
              </div>
              <p className='text-xs text-muted-foreground'>
                Total security assessments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-2x1 font-medium'>
                Total Vulnerabilities
              </CardTitle>
              <IconBug className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <div className='text-4xl font-bold'>
                    {scans.reduce(
                      (acc, scan) => acc + scan?.vulnerabilities?.length,
                      0
                    )}
                  </div>
                  {vulnerabilitiesChange !== 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div
                            className={cn(
                              'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-sm font-medium transition-colors',
                              vulnerabilitiesChange < 0
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                            )}
                          >
                            {vulnerabilitiesChange < 0 ? (
                              <IconTrendingDown className='h-3.5 w-3.5' />
                            ) : (
                              <IconTrendingUp className='h-3.5 w-3.5' />
                            )}
                            <span>
                              {Math.abs(vulnerabilitiesChange).toFixed(1)}%
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {vulnerabilitiesChange < 0
                              ? 'Decreased'
                              : 'Increased'}{' '}
                            by {Math.abs(vulnerabilitiesChange).toFixed(1)}%
                            compared to last scan
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <p className='text-xs text-muted-foreground'>
                Found in all scans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-2x1 font-medium'>
                Critical Issues
              </CardTitle>
              <IconAlertTriangle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-2'>
                <div className='text-4xl font-bold'>
                  {scans.reduce(
                    (acc, scan) =>
                      acc +
                      scan?.vulnerabilities?.filter(
                        (v) => v.severity === 'Critical'
                      )?.length,
                    0
                  )}
                </div>
                {criticalIssuesChange !== 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-sm font-medium transition-colors',
                            criticalIssuesChange < 0
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                          )}
                        >
                          {criticalIssuesChange < 0 ? (
                            <IconTrendingDown className='h-3.5 w-3.5' />
                          ) : (
                            <IconTrendingUp className='h-3.5 w-3.5' />
                          )}
                          <span>
                            {Math.abs(criticalIssuesChange).toFixed(1)}%
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {criticalIssuesChange < 0 ? 'Decreased' : 'Increased'}{' '}
                          by {Math.abs(criticalIssuesChange).toFixed(1)}%
                          compared to last scan
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className='text-xs text-muted-foreground'>
                High priority fixes needed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-2x1 font-medium'>
                Active Scans
              </CardTitle>
              <IconLoader2 className='h-4 w-4 text-muted-foreground animate-spin' />
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-2'>
                <div className='text-4xl font-bold'>
                  {scans?.filter((scan) => scan.status === 'Running')?.length}
                </div>
                {activeScansChange !== 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-colors',
                            activeScansChange < 0
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                          )}
                        >
                          {activeScansChange < 0 ? (
                            <IconTrendingDown className='h-3.5 w-3.5' />
                          ) : (
                            <IconTrendingUp className='h-3.5 w-3.5' />
                          )}
                          <span>{Math.abs(activeScansChange).toFixed(1)}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {activeScansChange < 0 ? 'Decreased' : 'Increased'} by{' '}
                          {Math.abs(activeScansChange).toFixed(1)}% compared to
                          last scan
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className='text-xs text-muted-foreground'>Currently running</p>
            </CardContent>
          </Card>
        </div>


        {/* Lista de scans */}
        <Card>
          <div className='p-6'>
            <h3 className='font-semibold mb-4'>Recent Scans</h3>
            <div className='space-y-4'>
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className='flex items-center justify-between p-4 rounded-lg border'
                >
                  <div className='flex items-center gap-4'>
                    {/* Status Icon */}
                    <div
                      className={`p-2 rounded-full ${statusColors[scan.status as keyof typeof statusColors]}`}
                    >
                      {React.createElement(
                        statusIcons[scan.status as keyof typeof statusIcons],
                        {
                          className: 'h-5 w-5 text-white',
                        }
                      )}
                    </div>

                    {/* Scan Info */}
                    <div>
                      <h4 className='font-medium'>{scan.name}</h4>
                      <p className='text-sm text-muted-foreground'>
                        {new Date(scan.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Vulnerabilities Count */}
                  <div className='flex items-center gap-4'>
                    {Object.entries(severityColors).map(([severity, color]) => {
                      const count = scan?.vulnerabilities?.filter(
                        (v) => v.severity === severity
                      )?.length
                      if (count === 0) return null
                      return (
                        <div
                          key={severity}
                          className='flex items-center gap-1'
                          style={{ color }}
                        >
                          <IconBug size={16} />
                          <span className='text-sm font-medium'>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Main>

      <NewScanDialog
        open={openNewScan}
        onOpenChange={setOpenNewScan}
        apiId={search.apiId}
      />

      {activeScans.map((scanId) => (
        <ScanStream
          key={scanId}
          scanId={scanId}
          onUpdate={handleScanUpdate}
          onComplete={handleScanComplete}
        />
      ))}
    </>
  )
}
