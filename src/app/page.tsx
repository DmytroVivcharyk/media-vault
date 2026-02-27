import MediaVaultPage from '@/pages/MediaVaultPage'
import { AuthProvider, AuthGate } from '@/features/authentication'

export default function Home() {
  return (
    <AuthProvider>
      <AuthGate />
      <MediaVaultPage />
    </AuthProvider>
  )
}
