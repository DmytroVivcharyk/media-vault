import type { AythStateType, AuthDispatchActionType } from '../types/modelTypes'

export const initialState: AythStateType = {
  isAuthenticated: false,
  logoutTimerID: null,
  error: null,
  loading: false,
}

export function authReducer(state: AythStateType, action: AuthDispatchActionType): AythStateType {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { ...state, isAuthenticated: true, loading: false }
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload }
    case 'LOGOUT':
      return { ...state, isAuthenticated: false }
    case 'SET_LOGOUT_TIMER_ID':
      return { ...state, logoutTimerID: action.payload }
    case 'CLEAR_LOGOUT_TIMER_ID':
      return { ...state, logoutTimerID: null }
    default:
      return state
  }
}
