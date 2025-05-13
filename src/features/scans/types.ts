export interface Scan {
  id: string
  name: string
  type: string
  target: string
  status: string
  createdAt: string
  completedAt?: string
  vulnerabilities: Vulnerability[]
}

export interface Vulnerability {
  id: string
  ruleId: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  description: string
  details: string
} 