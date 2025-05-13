import ScansPage from '@/features/scans'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/scans/')({
  component: ScansPage,
})
