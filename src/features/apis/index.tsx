import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  IconAdjustmentsHorizontal,
  IconApi,
  IconBug,
  IconEdit,
  IconLoader,
  IconShieldSearch,
  IconSortAscendingLetters,
  IconSortDescendingLetters,
  IconTrash,
} from '@tabler/icons-react'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { EditApiDialog } from './components/edit-api-dialog'

const apiText = new Map<string, string>([
  ['all', 'All APIs'],
  ['active', 'Active'],
  ['inactive', 'Inactive'],
  ['deprecated', 'Deprecated'],
])

const API_BASE_URL = 'https://localhost:7001'

interface Api {
  id: string
  name: string
  description: string
  environment: number // 0 = Development, 1 = Staging, 2 = Production
  status: number // 0 = Active, 1 = Inactive, 2 = Deprecated
  baseUrl: string
  swaggerUrl: string
  version: string
  owner: string
  createdAt: string
  lastScanAt?: string
  tags: string[]
  metadata: Record<string, string>
  authentication?: {
    type: 'None' | 'FormBased' | 'BasicAuth' | 'BearerToken' | 'OAuth2' | 'ApiKey' | 'Custom'
    apiKey?: {
      key: string
      headerName: string
      location: 'Header' | 'QueryString'
    }
    loginUrl?: string
    username?: string
    password?: string
  }
}

interface ApiStats {
  totalScans: number
  totalVulnerabilities: number
  criticalVulnerabilities: number
  highVulnerabilities: number
}

export default function Apis() {
  const router = useRouter()
  const { toast } = useToast()
  const [sort, setSort] = useState('ascending')
  const [apiStatus, setApiStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [apis, setApis] = useState<Api[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiStats, setApiStats] = useState<Record<string, ApiStats>>({})
  const [editingApi, setEditingApi] = useState<Api | null>(null)

  useEffect(() => {
    fetchApis()
  }, [])

  async function fetchApiStats(apiId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scans?apiId=${apiId}`)
      if (!response.ok) throw new Error('Failed to fetch scans')
      const scans = await response.json()
      
      const stats: ApiStats = {
        totalScans: scans.length,
        totalVulnerabilities: 0,
        criticalVulnerabilities: 0,
        highVulnerabilities: 0
      }

      scans.forEach((scan: any) => {
        stats.totalVulnerabilities += scan.vulnerabilities.length
        stats.criticalVulnerabilities += scan.vulnerabilities.filter(
          (v: any) => v.severity === 'Critical'
        ).length
        stats.highVulnerabilities += scan.vulnerabilities.filter(
          (v: any) => v.severity === 'High'
        ).length
      })

      setApiStats(prev => ({ ...prev, [apiId]: stats }))
    } catch (error) {
      console.error('Failed to fetch API stats:', error)
    }
  }

  async function fetchApis() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/apis`)
      if (!response.ok) throw new Error('Failed to fetch APIs')
      const data = await response.json()
      setApis(data)
      
      // Buscar estatísticas para cada API
      data.forEach((api: Api) => {
        fetchApiStats(api.id)
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load APIs'
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteApi(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/apis/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete API')
      
      toast({
        title: 'Success',
        description: 'API deleted successfully'
      })
      
      // Atualiza a lista
      setApis(apis.filter(api => api.id !== id))
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete API'
      })
    }
  }

  const getEnvironmentText = (env: number) => {
    switch (env) {
      case 0: return 'Development'
      case 1: return 'Staging'
      case 2: return 'Production'
      default: return 'Unknown'
    }
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Active'
      case 1: return 'Inactive'
      case 2: return 'Deprecated'
      default: return 'Unknown'
    }
  }

  const filteredApis = apis
    .sort((a, b) =>
      sort === 'ascending'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    )
    .filter((api) =>
      apiStatus === 'active'
        ? api.status === 0
        : apiStatus === 'inactive'
          ? api.status === 1
          : apiStatus === 'deprecated'
            ? api.status === 2
            : true
    )
    .filter((api) => 
      api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

  return (
    <>
      <Header>
        <Search />
        <div className='ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>APIs</h1>
          <p className='text-muted-foreground'>
            Manage and monitor your registered APIs
          </p>
        </div>

        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Input
              placeholder='Search APIs...'
              className='h-9 w-40 lg:w-[250px]'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={apiStatus} onValueChange={setApiStatus}>
              <SelectTrigger className='w-36'>
                <SelectValue>{apiText.get(apiStatus)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All APIs</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
                <SelectItem value='deprecated'>Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className='w-16'>
              <SelectValue>
                <IconAdjustmentsHorizontal size={18} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent align='end'>
              <SelectItem value='ascending'>
                <div className='flex items-center gap-4'>
                  <IconSortAscendingLetters size={16} />
                  <span>Ascending</span>
                </div>
              </SelectItem>
              <SelectItem value='descending'>
                <div className='flex items-center gap-4'>
                  <IconSortDescendingLetters size={16} />
                  <span>Descending</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className='shadow' />

        <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pb-16 pt-4 md:grid-cols-2 lg:grid-cols-3'>
          {isLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading APIs...</span>
              </div>
            </div>
          ) : filteredApis.map((api) => (
            <li
              key={api.id}
              className='group relative rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md'
            >
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                    <IconApi size={24} />
                  </div>
                  <div>
                    <h2 className='font-semibold'>{api.name}</h2>
                    <p className='text-sm text-muted-foreground'>{getEnvironmentText(api.environment)}</p>
                  </div>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  className={`
                    ${getStatusText(api.status) === 'Active' 
                      ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900'
                      : getStatusText(api.status) === 'Inactive'
                        ? 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 dark:hover:bg-yellow-900'
                        : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900'
                    }
                  `}
                >
                  {getStatusText(api.status)}
                </Button>
              </div>

              <p className='line-clamp-2 text-sm text-muted-foreground'>{api.description}</p>

              {apiStats[api.id] && (
                <div className="mt-4 rounded-lg border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Vulnerability Overview</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IconShieldSearch size={14} />
                      <span>{apiStats[api.id].totalScans} scans</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div 
                      className={`
                        relative overflow-hidden rounded-md border p-3
                        ${apiStats[api.id].criticalVulnerabilities > 0 
                          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                          : 'border-transparent bg-muted'
                        }
                      `}
                    >
                      {apiStats[api.id].criticalVulnerabilities > 0 && (
                        <div className="absolute right-1 top-1">
                          <span className="flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {apiStats[api.id].criticalVulnerabilities}
                        </span>
                        <IconBug 
                          size={16} 
                          className="text-red-500"
                        />
                      </div>
                      <span className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                        Critical
                      </span>
                    </div>

                    <div 
                      className={`
                        relative overflow-hidden rounded-md border p-3
                        ${apiStats[api.id].highVulnerabilities > 0 
                          ? 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'
                          : 'border-transparent bg-muted'
                        }
                      `}
                    >
                      {apiStats[api.id].highVulnerabilities > 0 && (
                        <div className="absolute right-1 top-1">
                          <span className="flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {apiStats[api.id].highVulnerabilities}
                        </span>
                        <IconBug 
                          size={16}
                          className="text-orange-500"
                        />
                      </div>
                      <span className="mt-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                        High
                      </span>
                    </div>

                    <div 
                      className={`
                        relative overflow-hidden rounded-md border p-3
                        ${apiStats[api.id].totalVulnerabilities > 0 
                          ? 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900'
                          : 'border-transparent bg-muted'
                        }
                      `}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-2xl font-bold">
                          {apiStats[api.id].totalVulnerabilities}
                        </span>
                        <IconBug size={16} />
                      </div>
                      <span className="mt-1 text-xs font-medium">
                        Total
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className='mt-4 flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className="flex-1"
                  onClick={() => router.navigate({ 
                    to: '/scans',
                    search: { apiId: api.id }
                  })}
                >
                  <IconShieldSearch className="mr-2 h-4 w-4" />
                  View Scans
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingApi(api)}
                >
                  <IconEdit className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
                    >
                      <IconTrash />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete API</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this API? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteApi(api.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      </Main>

      {editingApi && (
        <EditApiDialog
          open={!!editingApi}
          onOpenChange={(open) => !open && setEditingApi(null)}
          api={editingApi}
          onSuccess={fetchApis}
        />
      )}
    </>
  )
} 