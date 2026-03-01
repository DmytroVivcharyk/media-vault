'use client'

import { useEffect } from 'react'
import { useAuth } from '../../model/useAuth'
import {
  getRefreshTokenFromLocalStorage,
  getTokenFromLocalStorage,
} from '../../lib/localStorage.manager'
import { calculateTokenExpirationTime } from '../../lib/token.manager'

function useAuthState() {
  const { actions } = useAuth()

  useEffect(() => {
    const authToken = getTokenFromLocalStorage()

    if (authToken) {
      const authTokenExpirationTime = calculateTokenExpirationTime(authToken)

      if (authTokenExpirationTime > 0) {
        actions.setLogoutTimer(authTokenExpirationTime)
        actions.setLoggedInState()
        return
      }
    }

    const refreshToken = getRefreshTokenFromLocalStorage()

    if (!refreshToken) {
      actions.logout()
      return
    }

    const refreshTokenExpirationTime = calculateTokenExpirationTime(refreshToken)

    if (refreshTokenExpirationTime > 0) {
      actions.refreshToken()
    } else {
      actions.logout()
    }
  }, [actions])
}

export function AuthGate() {
  useAuthState()

  return null
}
