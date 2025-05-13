export interface Scan {
  id: string
  name: string
  type: string
  target: string
  status: string
  createdAt: string
  completedAt?: string
  apiId?: string
  api?: ApiDefinition
  vulnerabilityIds: string[]
} 