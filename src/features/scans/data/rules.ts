import {
    IconBug,
    IconCertificate,
    IconEyeExclamation,
    IconShieldLock,
    IconSpeedboat,
    IconTerminal2,
} from '@tabler/icons-react'

export const availableRules = [
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