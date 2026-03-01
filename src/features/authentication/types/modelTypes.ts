export type AuthStateType = {
  isAuthenticated: boolean
  error: string | null
  loading: boolean
}

export type AuthDispatchActionType =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS' }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }

export type AuthActionTypes = {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  setLogoutTimer: (expirationMs: number) => void
  clearLogoutTimer: () => void
  setLoggedInState: () => void
}
