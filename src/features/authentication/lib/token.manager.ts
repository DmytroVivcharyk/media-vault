export function calculateTokenExpirationTime(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp
    const currentTime = Math.floor(Date.now() / 1000)
    return (exp - currentTime) * 1000 // Return time in milliseconds
  } catch (error) {
    console.error('Failed to calculate token expiration time:', error)
    return 0 // Default to 0 if token is invalid
  }
}
