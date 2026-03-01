import type { AuthStateType, AuthDispatchActionType } from '../types/modelTypes'

export const initialState: AuthStateType = {
  isAuthenticated: false,
  error: null,
  loading: false,
}

export function authReducer(state: AuthStateType, action: AuthDispatchActionType): AuthStateType {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { ...state, isAuthenticated: true, loading: false }
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload }
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, loading: false, error: null }
    default:
      return state
  }
}
