export type AythStateType = {
  isAuthenticated: boolean
  logoutTimerID: number | null
  error: string | null
  loading: boolean
}

export type AuthDispatchActionType =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS' }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOGOUT_TIMER_ID'; payload: number }
  | { type: 'CLEAR_LOGOUT_TIMER_ID' }

export type AuthActionTypes = {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: (refreshToken: string) => Promise<void>
  setLogoutTimer: (timerID: number) => void
  clearLogoutTimer: () => void
  setLogedInState: () => void
}
