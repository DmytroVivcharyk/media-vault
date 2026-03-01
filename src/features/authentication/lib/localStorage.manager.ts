export function saveTokensToLocalStorage(token: string, refreshToken: string): void {
  localStorage.setItem('authToken', token)
  localStorage.setItem('authRefreshToken', refreshToken)
}

export function clearTokensFromLocalStorage(): void {
  localStorage.removeItem('authToken')
  localStorage.removeItem('authRefreshToken')
}

export function getTokenFromLocalStorage(): string | null {
  return localStorage.getItem('authToken')
}

export function getRefreshTokenFromLocalStorage(): string | null {
  return localStorage.getItem('authRefreshToken')
}
