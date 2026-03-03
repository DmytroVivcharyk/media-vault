'use client'

import { createContext, useReducer, useMemo, useState } from 'react'
import { initialState, authReducer, createAuthInternals } from './reducer'
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
  const [internals] = useState(createAuthInternals)

  const actions = useMemo<AuthActionTypes>(
    () => createAuthActions(dispatch, internals),
    [dispatch, internals],
  )

  return <AuthContext.Provider value={{ state, actions }}>{children}</AuthContext.Provider>
}
