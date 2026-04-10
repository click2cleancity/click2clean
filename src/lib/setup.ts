import {
  getLanguage,
  getOnboardingDone,
  getPendingPhone,
  getSplashDone,
  getVerified,
} from './storage'

/** Next route for incomplete setup (user is not verified). */
export function getResumeSetupPath(): string {
  if (!getSplashDone()) return '/splash'
  if (!getLanguage()) return '/language'
  if (!getOnboardingDone()) return '/onboarding'
  if (getVerified()) return '/'
  if (getPendingPhone()) return '/otp'
  return '/phone'
}
