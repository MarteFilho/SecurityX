import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormField, FormItem } from '@/components/ui/form'
import { API_BASE_URL } from '@/config/api'
import { useToast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { availableRules } from '../data/rules'

const scanFormSchema = z.object({
  enabledRules: z.array(z.string()),
})

interface NewScanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiId: string
}

export function NewScanDialog({ open, onOpenChange, apiId }: NewScanDialogProps) {
  const { toast } = useToast()
  const form = useForm<z.infer<typeof scanFormSchema>>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      enabledRules: ['xss', 'sql-injection', 'security-headers'],
    },
  })

  async function onSubmit(data: z.infer<typeof scanFormSchema>) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scans/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiId,
          enabledRules: data.enabledRules.join(','),
        }),
      })

      if (!response.ok) throw new Error('Failed to start scan')

      const result = await response.json()
      toast({
        title: 'Success',
        description: 'Scan started successfully',
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start scan',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>New Security Scan</DialogTitle>
          <DialogDescription>
            Select which security rules to enable for this scan.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="enabledRules"
              render={({ field }) => (
                <FormItem>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                    {availableRules.map((rule) => {
                      const checked = field.value.includes(rule.id)
                      return (
                        <div
                          key={rule.id}
                          role="button"
                          tabIndex={0}
                          className={`relative rounded-lg border p-4 transition-colors hover:bg-accent ${
                            checked ? 'border-primary' : ''
                          }`}
                          onClick={() => {
                            const newValue = checked
                              ? field.value.filter((v) => v !== rule.id)
                              : [...field.value, rule.id]
                            form.setValue('enabledRules', newValue)
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <rule.icon className="h-5 w-5 shrink-0" />
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                              <span className="font-medium truncate">{rule.label}</span>
                              <span
                                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap
                                  ${
                                    rule.severity === 'Critical'
                                      ? 'bg-red-100 text-red-700'
                                      : rule.severity === 'High'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }
                                `}
                              >
                                {rule.severity}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Start Scan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 