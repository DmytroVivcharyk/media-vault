import { authApi } from '../api/authApi'
import {
  saveTokensToLocalStorage,
  clearTokensFromLocalStorage,
  getRefreshTokenFromLocalStorage,
} from '../lib/localStorage.manager'
import type { AuthDispatchActionType, AuthActionTypes, AuthInternals } from '../types/modelTypes'

export function createAuthActions(
  dispatch: React.Dispatch<AuthDispatchActionType>,
  internals: AuthInternals,
): AuthActionTypes {
  function clearLogoutTimer(): void {
    if (internals.logoutTimerId !== null) {
      clearTimeout(internals.logoutTimerId)
      internals.logoutTimerId = null
    }
  }

  function setLogoutTimer(expirationMs: number): void {
    clearLogoutTimer()

    internals.logoutTimerId = window.setTimeout(() => {
      refreshToken()
    }, expirationMs)
  }

  async function login(email: string, password: string): Promise<void> {
    dispatch({ type: 'LOGIN_START' })

    try {
      const { token, refreshToken } = await authApi.login(email, password)

      saveTokensToLocalStorage(token, refreshToken)

      // TODO: Replace with actual token expiration time from token
      const tokenExpirationTime = 60 * 60 * 1000 // 1 hour for demo
      setLogoutTimer(tokenExpirationTime)

      dispatch({ type: 'LOGIN_SUCCESS' })
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : 'Login failed',
      })
    }
  }

  function logout(): void {
    clearTokensFromLocalStorage()
    clearLogoutTimer()
    dispatch({ type: 'LOGOUT' })
  }

  async function refreshToken(): Promise<void> {
    try {
      clearLogoutTimer()

      const storedRefreshToken = getRefreshTokenFromLocalStorage()

      if (!storedRefreshToken) {
        dispatch({ type: 'LOGOUT' })
        return
      }

      const { token: newToken, refreshToken: newRefreshToken } =
        await authApi.refreshToken(storedRefreshToken)
      saveTokensToLocalStorage(newToken, newRefreshToken)

      // TODO: Replace with actual token expiration time from token
      const tokenExpirationTime = 60 * 60 * 1000 // 1 hour for demo
      setLogoutTimer(tokenExpirationTime)
    } catch {
      dispatch({ type: 'LOGOUT' })
    }
  }

  function setLoggedInState(): void {
    dispatch({ type: 'LOGIN_SUCCESS' })
  }

  return {
    login,
    logout,
    refreshToken,
    setLogoutTimer,
    clearLogoutTimer,
    setLoggedInState,
  }
}
