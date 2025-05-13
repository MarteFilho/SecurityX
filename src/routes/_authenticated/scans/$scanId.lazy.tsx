import { ScanDetails } from '@/features/scans/components/scan-details'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/scans/$scanId')({
  component: ScanDetails,
}) 