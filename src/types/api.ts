import { AuthenticationConfig } from './auth'

export interface ApiDefinition {
  id: string
  name: string
  description: string
  baseUrl: string
  swaggerUrl: string
  environment: 'Development' | 'Staging' | 'Production'
  status: 'Active' | 'Inactive' | 'Deprecated'
  version?: string
  owner?: string
  authentication?: AuthenticationConfig
  tags: string[]
  createdAt: string
  lastScanAt?: string
  metadata: Record<string, string>
  vulnerabilities: ApiVulnerability[]
}

export interface ApiVulnerability {
  id: string
  apiId: string
  title: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  description: string
  details: string
  location: string
  request?: string
  response?: string
  discoveredAt: string
  status: 'Open' | 'Fixed' | 'FalsePositive'
  scanId?: string
} 