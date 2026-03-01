'use client'

import { createContext, useReducer, useMemo, useState } from 'react'
import { initialState, authReducer } from './reducer'
import { createAuthActions } from './actions'

import type { AuthStateType, AuthActionTypes } from '../types/modelTypes'

export const AuthContext = createContext<{
  state: AuthStateType
  actions: AuthActionTypes
} | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  // Plain mutable container for timer ID (avoids react-hooks/refs lint with useRef)
  const [timerRef] = useState(() => ({ current: null as number | null }))

  const actions = useMemo<AuthActionTypes>(
    () => createAuthActions(dispatch, timerRef),
    [dispatch, timerRef],
  )

  return <AuthContext.Provider value={{ state, actions }}>{children}</AuthContext.Provider>
}
