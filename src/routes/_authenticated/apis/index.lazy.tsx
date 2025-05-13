import ApisPage from '@/features/apis'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/apis/')({
  component: ApisPage,
}) 