import { createContext, useReducer, useMemo } from 'react'
import { initialState, authReducer } from './reducer'
import {
  loginImpl,
  logoutImpl,
  refreshTokenImpl,
  clearLogoutTimerImpl,
  setLogoutTimerImpl,
  setLogedInStateImpl,
} from './actions'

import type { AythStateType, AuthActionTypes } from '../types/modelTypes'

export const AuthContext = createContext<{
  state: AythStateType
  actions: AuthActionTypes
} | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const actions = useMemo<AuthActionTypes>(
    () => ({
      login: (email: string, password: string) => loginImpl(dispatch, state, email, password),
      logout: () => logoutImpl(dispatch, state),
      refreshToken: () => refreshTokenImpl(dispatch, state),
      setLogoutTimer: () => setLogoutTimerImpl(dispatch, state),
      clearLogoutTimer: () => clearLogoutTimerImpl(dispatch, state.logoutTimerID),
      setLogedInState: () => setLogedInStateImpl(dispatch),
    }),
    [dispatch, state],
  )

  return <AuthContext.Provider value={{ state, actions }}>{children}</AuthContext.Provider>
}
