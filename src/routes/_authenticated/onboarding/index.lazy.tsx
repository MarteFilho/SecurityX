import OnboardingPage from '@/features/onboarding'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/onboarding/')({
  component: OnboardingPage,
})
