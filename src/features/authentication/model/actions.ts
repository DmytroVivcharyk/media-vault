import { authApi } from '../api/authApi'
import {
  saveTokensToLocalStorage,
  clearTokensFromLocalStorage,
  getRefreshTokenFromLocalStorage,
} from '../lib/localStorage.manager'
import type { AuthDispatchActionType, AythStateType } from '../types/modelTypes'

export async function loginImpl(
  dispatch: React.Dispatch<AuthDispatchActionType>,
  state: AythStateType,
  email: string,
  password: string,
): Promise<void> {
  dispatch({ type: 'LOGIN_START' })

  try {
    // Call the login API
    const { token, refreshToken } = await authApi.login(email, password)

    // Store the token in localStorage (or any secure storage) // TODO Temporary solution use lib utill
    saveTokensToLocalStorage(token, refreshToken)

    setLogoutTimerImpl(dispatch, state)

    dispatch({ type: 'LOGIN_SUCCESS' })
  } catch (error) {
    dispatch({
      type: 'LOGIN_FAILURE',
      payload: error instanceof Error ? error.message : 'Login failed',
    })
  }
}

export function logoutImpl(
  dispatch: React.Dispatch<AuthDispatchActionType>,
  state: AythStateType,
): void {
  // Clear token from localStorage
  clearTokensFromLocalStorage()

  clearLogoutTimerImpl(dispatch, state.logoutTimerID)

  // Dispatch logout action
  dispatch({ type: 'LOGOUT' })
}

export async function refreshTokenImpl(
  dispatch: React.Dispatch<AuthDispatchActionType>,
  state: AythStateType,
): Promise<void> {
  try {
    // Clear existing timer before refreshing token
    clearLogoutTimerImpl(dispatch, state.logoutTimerID)

    // Get the refresh token from localStorage
    const refreshToken = getRefreshTokenFromLocalStorage()

    // Call the refresh token API
    const { token: newToken, refreshToken: newRefreshToken } =
      await authApi.refreshToken(refreshToken)
    saveTokensToLocalStorage(newToken, newRefreshToken)

    // Set a new timer for the next token refresh
    setLogoutTimerImpl(dispatch, state)
  } catch {
    // If token refresh fails, log the user out
    dispatch({ type: 'LOGOUT' })
  }
}

export function setLogoutTimerImpl(
  dispatch: React.Dispatch<AuthDispatchActionType>,
  state: AythStateType,
): void {
  // TODO Replace with actual token expiration time
  const tokenExpirationTime = 60 * 60 * 1000 // 1 hour for demo

  const timerID = window.setTimeout(() => {
    try {
      refreshTokenImpl(dispatch, state)
    } catch {
      dispatch({ type: 'LOGOUT' })
    }
  }, tokenExpirationTime)

  dispatch({ type: 'SET_LOGOUT_TIMER_ID', payload: timerID })
}

export function clearLogoutTimerImpl(
  dispatch: React.Dispatch<AuthDispatchActionType>,
  timerID: number | null,
): void {
  if (timerID) {
    clearTimeout(timerID)
    dispatch({ type: 'CLEAR_LOGOUT_TIMER_ID' })
  }
}

export function setLogedInStateImpl(dispatch: React.Dispatch<AuthDispatchActionType>): void {
  dispatch({ type: 'LOGIN_SUCCESS' })
}
