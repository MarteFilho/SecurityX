import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    IconApiApp,
    IconBug,
    IconCertificate,
    IconEyeExclamation,
    IconLoader2,
    IconLock,
    IconShieldCheck,
    IconShieldLock,
    IconSpeedboat,
    IconTerminal2,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Adicionar enum para Environment
enum ApiEnvironment {
  Development = 0,
  Staging = 1,
  Production = 2
}

enum ApiStatus {
  Active = 0,
  Inactive = 1,
  Deprecated = 2
}

enum AuthType {
  None = 0,
  FormBased = 1,
  BasicAuth = 2,
  BearerToken = 3,
  OAuth2 = 4,
  ApiKey = 5,
  Custom = 6
}

enum ApiKeyLocation {
  Header = 0,
  QueryString = 1
}

enum ScanScope {
  FullScan = 0,
  QuickScan = 1,
  CustomScan = 2
}

enum ScanType {
  DAST = 0,
  SAST = 1,
  Container = 2
}

const scanFormSchema = z.object({
  target: z.string().url('Please enter a valid URL'),
  swaggerUrl: z.string().url('Please enter a valid Swagger URL'),
  scanScope: z.nativeEnum(ScanScope),
  enabledRules: z.array(z.string()),
  apiInfo: z.object({
    name: z.string().min(1, 'Name is required'),
    environment: z.nativeEnum(ApiEnvironment),
    version: z.string().optional().or(z.literal('')),
    owner: z.string().optional().or(z.literal('')),
    tags: z.array(z.string()).default([]),
  }),
  authentication: z.object({
    type: z.nativeEnum(AuthType),
    loginUrl: z.string().url().optional(),
    usernameField: z.string().optional(),
    passwordField: z.string().optional(),
    tokenPath: z.string().optional(),
    tokenPrefix: z.string().optional(),
    credentials: z.object({
      username: z.string(),
      password: z.string()
    }).optional(),
    apiKey: z.object({
      key: z.string(),
      headerName: z.string(),
      location: z.nativeEnum(ApiKeyLocation)
    }).optional(),
  }).optional().default({ type: AuthType.None }),
})

const availableRules = [
  {
    id: 'xss',
    label: 'Cross-Site Scripting (XSS)',
    description: 'Detects malicious scripts that could steal data or hijack sessions.',
    icon: IconBug,
    severity: 'High',
  },
  {
    id: 'sql-injection',
    label: 'SQL Injection',
    description: 'Identifies vulnerabilities that could allow unauthorized database access.',
    icon: IconTerminal2,
    severity: 'Critical',
  },
  {
    id: 'command-injection',
    label: 'Command Injection',
    description: 'Scans for vulnerabilities that could allow system command execution.',
    icon: IconTerminal2,
    severity: 'Critical',
  },
  {
    id: 'security-headers',
    label: 'Security Headers',
    description: 'Checks HTTP security headers like HSTS, CSP, and X-Frame-Options.',
    icon: IconShieldLock,
    severity: 'Medium',
  },
  {
    id: 'weak-tls',
    label: 'Weak TLS',
    description: 'Evaluates TLS configuration for outdated protocols and weak ciphers.',
    icon: IconCertificate,
    severity: 'High',
  },
  {
    id: 'rate-limit',
    label: 'Rate Limiting',
    description: 'Verifies protection against automated attacks and DoS attempts.',
    icon: IconSpeedboat,
    severity: 'Medium',
  },
  {
    id: 'sensitive-data',
    label: 'Sensitive Data Exposure',
    description: 'Detects exposed sensitive information in API responses.',
    icon: IconEyeExclamation,
    severity: 'High',
  },
  {
    id: 'cors',
    label: 'CORS Misconfiguration',
    description: 'Examines Cross-Origin Resource Sharing security settings.',
    icon: IconShieldLock,
    severity: 'Medium',
  },
]

// Função para ordenar por severidade
const severityOrder = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
} as const

const sortedRules = [...availableRules].sort(
  (a, b) =>
    severityOrder[a.severity as keyof typeof severityOrder] -
    severityOrder[b.severity as keyof typeof severityOrder]
)

function StepNumber({ number }: { number: number }) {
  return (
    <div className='flex h-6 w-6 items-center justify-center rounded-full border bg-background'>
      <span className='text-xs font-medium'>{number}</span>
    </div>
  )
}

// Constante para URL base da API
const API_BASE_URL = 'https://localhost:7001'

export default function OnboardingPage() {
  const { toast } = useToast()
  const [isTestingAuth, setIsTestingAuth] = useState(false)
  const [lastToken, setLastToken] = useState<string | null>(null)
  const form = useForm<z.infer<typeof scanFormSchema>>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      scanScope: ScanScope.FullScan,
      enabledRules: ['xss', 'sql-injection', 'security-headers'],
      apiInfo: {
        tags: [],
        environment: ApiEnvironment.Development,
      },
      authentication: {
        type: AuthType.None
      }
    },
  })

  async function onSubmit(data: z.infer<typeof scanFormSchema>) {
    try {
      // Se marcou para salvar a API, salva primeiro
      let apiId: string | undefined

      if (data.apiInfo) {
        const apiResponse = await fetch(`${API_BASE_URL}/api/apis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.apiInfo.name,
            description: data.apiInfo.description,
            baseUrl: data.target,
            swaggerUrl: data.swaggerUrl,
            environment: data.apiInfo.environment,
            status: ApiStatus.Active,
            version: data.apiInfo.version,
            owner: data.apiInfo.owner,
            authentication: data.authentication,
            tags: data.apiInfo.tags,
          }),
        })

        if (!apiResponse.ok) {
          throw new Error('Failed to save API')
        }

        const apiResult = await apiResponse.json()
        apiId = apiResult.id
      }

      // Inicia o scan com referência à API se foi salva
      const scanPayload = {
        target: data.target,
        scanType: ScanType.DAST,
        options: {
          targetUrl: data.target,
          swaggerUrl: data.swaggerUrl,
          scanScope: data.scanScope,
          enabledRules: data.enabledRules.join(','),
          apiId,
          ...(data.authentication?.type !== AuthType.None && {
            authType: data.authentication?.type,
            loginUrl: data.authentication?.loginUrl,
            usernameField: data.authentication?.usernameField,
            passwordField: data.authentication?.passwordField,
            tokenPath: data.authentication?.tokenPath,
            tokenPrefix: data.authentication?.tokenPrefix,
            // API Key
            ...(data.authentication?.apiKey && {
              apiKeyLocation: data.authentication.apiKey.location,
              apiKeyName: data.authentication.apiKey.headerName,
              apiKeyValue: data.authentication.apiKey.key,
            }),
            // Credentials
            ...(data.authentication?.credentials && {
              username: data.authentication.credentials.username,
              password: data.authentication.credentials.password,
            }),
          }),
        },
      }

      const response = await fetch(`${API_BASE_URL}/api/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanPayload),
      })

      if (!response.ok) {
        throw new Error('Failed to start scan')
      }

      const result = await response.json()

      toast({
        title: 'Scan Started',
        description: (
          <div className='flex flex-col gap-2'>
            <p>Scan iniciado com sucesso!</p>
            <code className='p-2 bg-secondary rounded'>ID: {result.id}</code>
          </div>
        ),
      })

      // Limpar formulário após sucesso
      form.reset()
    } catch (error) {
      console.error('Error starting scan:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to start scan',
      })
    }
  }

  async function testAuthentication() {
    setIsTestingAuth(true)
    try {
      const authData = form.getValues('authentication')
      if (!authData?.loginUrl || !authData.credentials) {
        toast({
          variant: 'destructive',
          title: 'Missing Data',
          description: 'Please fill in all authentication fields',
        })
        return
      }

      const requestBody = {
        [authData.usernameField || 'username']: authData.credentials.username,
        [authData.passwordField || 'password']: authData.credentials.password,
      }

      const response = await fetch(authData.loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error('Authentication failed')
      }

      const data = await response.json()
      const tokenPath = authData.tokenPath || '$.data.token.accessToken'
      console.log(tokenPath)
      const token = tokenPath
        .split('.')
        .reduce((obj, key) => obj?.[key] ?? null, data)
      console.log(token)

      if (!token) {
        throw new Error('Token not found in response')
      }

      // Salvar parte do token para exibição
      setLastToken(token.slice(0, 20) + '...')

      toast({
        title: 'Authentication Successful',
        description: (
          <div className='space-y-2'>
            <p>Token retrieved successfully</p>
            <code className='block p-2 bg-secondary rounded text-xs font-mono break-all'>
              {token.slice(0, 20)}...
            </code>
          </div>
        ),
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description:
          error instanceof Error ? error.message : 'Failed to authenticate',
      })
    } finally {
      setIsTestingAuth(false)
    }
  }

  return (
    <>
      <Header>
        <div className='ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='container max-w-[1200px] py-6'>
          <div className='mb-6'>
            <h1 className='text-2xl font-bold tracking-tight'>API Scanner</h1>
            <p className='text-muted-foreground'>
              Configure and start a security scan for your API
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <div className='space-y-6'>
                {/* Step 1: Basic Info */}
                <div className='flex gap-4'>
                  <div className='flex flex-col items-center'>
                    <StepNumber number={1} />
                    <div className="flex-1 w-px bg-border my-2" />
                  </div>
                  <div className='flex-1 space-y-4'>
                    <div className='flex items-center gap-2'>
                      <IconApiApp size={20} className='text-primary' />
                      <h2 className='text-lg font-semibold'>API Information</h2>
                    </div>
                    <Card>
                      <CardContent className='pt-6'>
                        <div className='grid gap-6'>
                          <div className='grid gap-4 sm:grid-cols-2'>
                            <FormField
                              control={form.control}
                              name='target'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>API URL</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder='https://api.example.com'
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    The base URL of the API to scan
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name='swaggerUrl'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Swagger/OpenAPI URL</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder='https://api.example.com/swagger/v1/swagger.json'
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    URL to the OpenAPI/Swagger specification
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className='grid gap-4 sm:grid-cols-3'>
                            <FormField
                              control={form.control}
                              name='apiInfo.name'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>API Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder='My API' />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name='apiInfo.version'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Version</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder='1.0.0' />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name='apiInfo.owner'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Owner</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder='Team or person responsible'
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className='grid gap-4 sm:grid-cols-3'>
                            <FormField
                              control={form.control}
                              name='apiInfo.environment'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Environment</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select environment" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value={ApiEnvironment.Development.toString()}>Development</SelectItem>
                                      <SelectItem value={ApiEnvironment.Staging.toString()}>Staging</SelectItem>
                                      <SelectItem value={ApiEnvironment.Production.toString()}>Production</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Step 2: Authentication */}
                <div className='flex gap-4'>
                  <div className='flex flex-col items-center'>
                    <StepNumber number={2} />
                    <div className="flex-1 w-px bg-border my-2" />
                  </div>
                  <div className='flex-1 space-y-4'>
                    <div className='flex items-center gap-2'>
                      <IconLock size={20} className='text-primary' />
                      <h2 className='text-lg font-semibold'>Authentication</h2>
                    </div>
                    <Card>
                      <CardContent className='pt-6'>
                        <div className='space-y-6'>
                          <FormField
                            control={form.control}
                            name='authentication.type'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Authentication Type</FormLabel>
                                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select authentication type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={AuthType.None.toString()}>None</SelectItem>
                                    <SelectItem value={AuthType.FormBased.toString()}>Form Based</SelectItem>
                                    <SelectItem value={AuthType.BasicAuth.toString()}>Basic Auth</SelectItem>
                                    <SelectItem value={AuthType.BearerToken.toString()}>Bearer Token</SelectItem>
                                    <SelectItem value={AuthType.OAuth2.toString()}>OAuth 2.0</SelectItem>
                                    <SelectItem value={AuthType.ApiKey.toString()}>API Key</SelectItem>
                                    <SelectItem value={AuthType.Custom.toString()}>Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Form Based Auth Fields */}
                          {form.watch('authentication.type') === AuthType.FormBased && (
                            <div className='grid gap-6 sm:grid-cols-2'>
                              <FormField
                                control={form.control}
                                name='authentication.loginUrl'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Authentication URL</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder='https://api.example.com/auth/login'
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='authentication.tokenPath'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Token Path</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder='$.token' />
                                    </FormControl>
                                    <FormDescription>
                                      JSON Path to extract token from response
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='authentication.tokenPrefix'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Token Prefix</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder='Bearer' />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          {/* Basic Auth Fields */}
                          {form.watch('authentication.type') === AuthType.BasicAuth && (
                            <div className='grid gap-6 sm:grid-cols-2'>
                              <FormField
                                control={form.control}
                                name='authentication.credentials.username'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='authentication.credentials.password'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                      <Input {...field} type='password' />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          {/* Bearer Token Fields */}
                          {form.watch('authentication.type') === AuthType.BearerToken && (
                            <div className='grid gap-6 sm:grid-cols-2'>
                              <FormField
                                control={form.control}
                                name='authentication.loginUrl'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Authentication URL</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder='https://api.example.com/token'
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='authentication.tokenPath'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Token Path</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder='$.access_token'
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      JSON Path to extract token from response
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='authentication.usernameField'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username Field Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder='email' />
                                    </FormControl>
                                    <FormDescription>
                                      Field name used in the request (e.g.,
                                      email, username, login)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='authentication.passwordField'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password Field Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder='password'
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Field name used in the request (e.g.,
                                      password, pass, secret)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='authentication.credentials.username'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name='authentication.credentials.password'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                      <Input {...field} type='password' />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className='col-span-2 space-y-2'>
                                <div className='flex justify-start'>
                                  <Button
                                    type='button'
                                    variant='outline'
                                    onClick={testAuthentication}
                                    disabled={isTestingAuth}
                                    className='w-[200px]'
                                  >
                                    {isTestingAuth ? (
                                      <>
                                        <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                                        Testing...
                                      </>
                                    ) : (
                                      'Test Authentication'
                                    )}
                                  </Button>
                                </div>
                                {lastToken && (
                                  <div className='flex justify-end'>
                                    <div className='bg-secondary rounded p-2 text-xs font-mono'>
                                      <span className='text-muted-foreground mr-2'>
                                        Last token:
                                      </span>
                                      {lastToken}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {form.watch('authentication.type') === AuthType.ApiKey && (
                            <div className='grid gap-6 sm:grid-cols-2'>
                              <FormField
                                control={form.control}
                                name='authentication.apiKey.key'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>API Key</FormLabel>
                                    <FormControl>
                                      <Input {...field} type='password' />
                                    </FormControl>
                                    <FormDescription>
                                      The API key value
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name='authentication.apiKey.headerName'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Header/Parameter Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder='X-API-Key'
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Name of the header or query parameter
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name='authentication.apiKey.location'
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <Select
                                      onValueChange={(value) => field.onChange(Number(value))}
                                      defaultValue={field.value?.toString()}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select location" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value={ApiKeyLocation.Header.toString()}>Header</SelectItem>
                                        <SelectItem value={ApiKeyLocation.QueryString.toString()}>Query String</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Where to send the API key
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className='col-span-2 flex justify-end'>
                                <Button
                                  type='button'
                                  variant='outline'
                                  onClick={() => {
                                    // TODO: Implementar teste de API Key
                                    toast({
                                      title: 'Not Implemented',
                                      description:
                                        'API Key testing will be added soon',
                                    })
                                  }}
                                  className='w-[200px]'
                                >
                                  Test API Key
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Step 3: Security Rules */}
                <div className='flex gap-4'>
                  <div className='flex flex-col items-center'>
                    <StepNumber number={3} />
                    <div className="flex-1 w-px bg-border my-2" />
                  </div>
                  <div className='flex-1 space-y-4'>
                    <div className='flex items-center gap-2'>
                      <IconShieldCheck size={20} className='text-primary' />
                      <h2 className='text-lg font-semibold'>Security Rules</h2>
                    </div>
                    <Card>
                      <CardContent className='pt-6'>
                        <FormField
                          control={form.control}
                          name='enabledRules'
                          render={({ field }) => (
                            <FormItem>
                              <FormDescription className='mb-4'>
                                Select which security rules to enable
                              </FormDescription>
                              <ul className='no-scrollbar grid gap-3 overflow-auto pb-6 sm:grid-cols-2 lg:grid-cols-3'>
                                {sortedRules.map((rule) => {
                                  const checked = field.value.includes(rule.id)
                                  return (
                                    <li key={rule.id} className='w-full'>
                                      <div
                                        role='button'
                                        tabIndex={0}
                                        className={`relative h-[120px] rounded-lg border transition-colors hover:bg-accent ${
                                          checked ? 'border-primary' : ''
                                        }`}
                                        onClick={() => {
                                          const newValue = checked
                                            ? field.value.filter(
                                                (v) => v !== rule.id
                                              )
                                            : [...field.value, rule.id]
                                          form.setValue(
                                            'enabledRules',
                                            newValue
                                          )
                                        }}
                                      >
                                        <div className='flex h-full flex-col p-4'>
                                          <div className='mb-2 flex items-center justify-between'>
                                            <div className='flex items-center gap-3'>
                                              <rule.icon
                                                className='h-8 w-8'
                                                strokeWidth={1.5}
                                              />
                                              <h3 className='text-base font-semibold'>
                                                {rule.label}
                                              </h3>
                                            </div>
                                            <span
                                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                                                ${
                                                  rule.severity === 'Critical'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                    : rule.severity === 'High'
                                                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                                }
                                              `}
                                            >
                                              {rule.severity}
                                            </span>
                                          </div>
                                          <p className='flex-1 text-sm text-muted-foreground'>
                                            {rule.description}
                                          </p>
                                        </div>
                                      </div>
                                    </li>
                                  )
                                })}
                              </ul>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <div className='flex justify-start'>
                <Button type='submit' size='lg'>
                  Start Scan
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Main>
    </>
  )
}