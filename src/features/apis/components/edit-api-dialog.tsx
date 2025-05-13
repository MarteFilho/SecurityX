import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectNoScroll } from '@/components/ui/select-no-scroll'
import { API_BASE_URL } from '@/config/api'
import { useToast } from '@/hooks/use-toast'
import { ApiDefinition } from '@/types/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const apiFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  baseUrl: z.string().url('Must be a valid URL'),
  swaggerUrl: z.string().url('Must be a valid URL'),
  environment: z.enum(['Development', 'Staging', 'Production']),
  status: z.enum(['Active', 'Inactive', 'Deprecated']),
  authentication: z.object({
    type: z.enum(['None', 'FormBased', 'BasicAuth', 'BearerToken', 'OAuth2', 'ApiKey', 'Custom']),
    apiKey: z.object({
      key: z.string(),
      headerName: z.string(),
      location: z.enum(['Header', 'QueryString'])
    }).optional(),
    loginUrl: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    tokenPath: z.string().optional(),
    tokenPrefix: z.string().optional(),
  }).optional(),
})

interface EditApiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  api: ApiDefinition
  onSuccess: () => void
}

function mapEnvironmentToString(env: number): 'Development' | 'Staging' | 'Production' {
  const map = {
    0: 'Development',
    1: 'Staging',
    2: 'Production'
  }
  return map[env as keyof typeof map] as 'Development' | 'Staging' | 'Production'
}

function mapStatusToString(status: number): 'Active' | 'Inactive' | 'Deprecated' {
  const map = {
    0: 'Active',
    1: 'Inactive',
    2: 'Deprecated'
  }
  return map[status as keyof typeof map] as 'Active' | 'Inactive' | 'Deprecated'
}

export function EditApiDialog({ open, onOpenChange, api, onSuccess }: EditApiDialogProps) {
  const { toast } = useToast()
  const form = useForm<z.infer<typeof apiFormSchema>>({
    resolver: zodResolver(apiFormSchema),
    defaultValues: {
      name: api.name,
      baseUrl: api.baseUrl,
      swaggerUrl: api.swaggerUrl,
      environment: mapEnvironmentToString(api.environment),
      status: mapStatusToString(api.status),
      authentication: {
        type: api.authentication?.type || 'None',
        apiKey: api.authentication?.apiKey ? {
          key: api.authentication.apiKey.key || '',
          headerName: api.authentication.apiKey.headerName || '',
          location: api.authentication.apiKey.location || 'Header'
        } : undefined,
        loginUrl: api.authentication?.loginUrl,
        username: api.authentication?.username,
        password: api.authentication?.password,
        tokenPath: api.authentication?.tokenPath,
        tokenPrefix: api.authentication?.tokenPrefix,
      },
    },
  })

  async function onSubmit(data: z.infer<typeof apiFormSchema>) {
    try {
      const environmentMap = { Development: 0, Staging: 1, Production: 2 }
      const statusMap = { Active: 0, Inactive: 1, Deprecated: 2 }

      const response = await fetch(`${API_BASE_URL}/api/apis/${api.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          id: api.id,
          environment: environmentMap[data.environment as keyof typeof environmentMap],
          status: statusMap[data.status as keyof typeof statusMap],
          createdAt: api.createdAt,
          lastScanAt: api.lastScanAt,
          tags: api.tags,
          metadata: api.metadata,
        }),
      })

      if (!response.ok) throw new Error('Failed to update API')

      toast({
        title: 'Success',
        description: 'API updated successfully',
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update API',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit API</DialogTitle>
          <DialogDescription>
            Make changes to your API configuration.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="swaggerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Swagger URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment</FormLabel>
                    <SelectNoScroll
                      value={field.value}
                      onValueChange={field.onChange}
                      options={[
                        { value: 'Development', label: 'Development' },
                        { value: 'Staging', label: 'Staging' },
                        { value: 'Production', label: 'Production' },
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <SelectNoScroll
                      value={field.value}
                      onValueChange={field.onChange}
                      options={[
                        { value: 'Active', label: 'Active' },
                        { value: 'Inactive', label: 'Inactive' },
                        { value: 'Deprecated', label: 'Deprecated' },
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="authentication.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authentication Type</FormLabel>
                  <SelectNoScroll
                    value={field.value}
                    onValueChange={field.onChange}
                    options={[
                      { value: 'None', label: 'None' },
                      { value: 'ApiKey', label: 'API Key' },
                      { value: 'BearerToken', label: 'Bearer Token' },
                      { value: 'BasicAuth', label: 'Basic Auth' },
                      { value: 'OAuth2', label: 'OAuth 2.0' },
                      { value: 'FormBased', label: 'Form Based' },
                      { value: 'Custom', label: 'Custom' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('authentication.type') === 'ApiKey' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="authentication.apiKey.headerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key Header Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="X-API-Key" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authentication.apiKey.key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authentication.apiKey.location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key Location</FormLabel>
                      <SelectNoScroll
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                          { value: 'Header', label: 'Header' },
                          { value: 'QueryString', label: 'Query String' },
                        ]}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {form.watch('authentication.type') === 'BearerToken' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="authentication.loginUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://api.example.com/auth/login" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="authentication.username"
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
                    name="authentication.password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="authentication.tokenPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Path</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="$.token" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="authentication.tokenPrefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Prefix</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Bearer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {form.watch('authentication.type') === 'BasicAuth' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="authentication.username"
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
                  name="authentication.password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {form.watch('authentication.type') === 'FormBased' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="authentication.loginUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://api.example.com/auth/login" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="authentication.username"
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
                    name="authentication.password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 