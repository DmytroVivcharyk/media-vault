'use client'

import { useEffect } from 'react'
import { useAuth } from '../../model/useAuth'
import {
  getRefreshTokenFromLocalStorage,
  getTokenFromLocalStorage,
} from '../../lib/localStorage.manager'
import { calculateTokenExpirationTime } from '../../lib/token.manager'

export function useAuthState() {
  const { actions } = useAuth()

  useEffect(() => {
    const authToken = getTokenFromLocalStorage()

    if (authToken) {
      const authTokenExpirationTime = calculateTokenExpirationTime(authToken)

      if (authTokenExpirationTime > 0) {
        actions.setLogoutTimer(authTokenExpirationTime)
        actions.setLogedInState()
        return // Just return, no need for null or undefined
      }
    }

    const refreshToken = getRefreshTokenFromLocalStorage()

    if (!refreshToken) {
      actions.logout()
      return
    }

    const refreshTokenExpirationTime = calculateTokenExpirationTime(refreshToken)

    if (refreshTokenExpirationTime > 0) {
      actions.refreshToken(refreshToken)
    } else {
      actions.logout()
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function AuthGate() {
  useAuthState()

  return null
}
