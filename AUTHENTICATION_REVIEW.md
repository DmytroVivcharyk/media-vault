# Authentication Feature — Comprehensive Code Review

**Project:** media-vault (Next.js 16 / React 19 / TypeScript)  
**Architecture:** Feature-Sliced Design (FSD) + MVVM  
**Date:** March 1, 2026

---

## Table of Contents

1. [Structure & FSD/MVVM Compliance](#1-structure--fsdmvvm-compliance)
2. [Critical Bugs](#2-critical-bugs)
3. [Redundant Re-Renders & Performance](#3-redundant-re-renders--performance)
4. [Code Quality Issues](#4-code-quality-issues)
5. [Type Safety Issues](#5-type-safety-issues)
6. [Security Concerns](#6-security-concerns)
7. [Best Practices Recommendations](#7-best-practices-recommendations)
8. [File-by-File Summary](#8-file-by-file-summary)
9. [Suggested Refactored Architecture](#9-suggested-refactored-architecture)
10. [Priority Action Items](#10-priority-action-items)

---

## 1. Structure & FSD/MVVM Compliance

### Current Structure

```
authentication/
├── api/
│   └── authApi.ts          # API layer (class-based)
├── lib/
│   ├── localStorage.manager.ts  # Token persistence
│   └── token.manager.ts         # Token parsing
├── model/
│   ├── actions.ts          # Business logic (imperative functions)
│   ├── AuthProvider.tsx     # Context provider (Model layer)
│   ├── reducer.ts          # State reducer
│   └── useAuth.ts          # Context consumer hook
├── types/
│   └── modelTypes.ts       # Type definitions
├── view/
│   └── gate/
│       └── AuthGate.tsx    # Side-effect runner (view layer)
└── index.ts                # Public API
```

### FSD Compliance Assessment

| Aspect                                | Status   | Notes                                                           |
| ------------------------------------- | -------- | --------------------------------------------------------------- |
| Layer separation (api/lib/model/view) | ✅ Good  | Clean separation of concerns                                    |
| Public API via `index.ts`             | ✅ Good  | Only exports what consumers need                                |
| No cross-feature imports              | ✅ Good  | Doesn't import from other features                              |
| Segment naming conventions            | ⚠️ Fair  | `types/` is non-standard in FSD — usually lives inside `model/` |
| View layer responsibility             | ❌ Issue | `AuthGate.tsx` contains a business logic hook (`useAuthState`)  |

### MVVM Compliance Assessment

| Aspect                         | Status     | Notes                                                                                            |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| Model (state + business logic) | ✅ Present | `reducer.ts` + `actions.ts`                                                                      |
| ViewModel                      | ❌ Missing | No ViewModel layer exists (compare with `media-gallery` which has `useMediaGalleryViewModel.ts`) |
| View                           | ⚠️ Partial | `AuthGate` is more of a side-effect initializer than a view                                      |

**Key structural inconsistency:** Your other features (`media-gallery`, `media-upload`) use the `createXxxActions(dispatch)` factory pattern where actions only receive `dispatch`. The authentication feature breaks this pattern by passing **both** `dispatch` AND `state` to every action function. This architectural inconsistency causes the critical performance bug described in Section 3.

---

## 2. Critical Bugs

### 🔴 BUG #1: Stale State Closure in Timer Callback (`actions.ts:72-88`)

```typescript
// actions.ts — setLogoutTimerImpl
export function setLogoutTimerImpl(
  dispatch: React.Dispatch<AuthDispatchActionType>,
  state: AythStateType, // ← THIS state is captured at call time
): void {
  const tokenExpirationTime = 60 * 60 * 1000

  const timerID = window.setTimeout(() => {
    try {
      refreshTokenImpl(dispatch, state) // ← When this fires in 1 hour,
      //    `state` is STALE
    } catch {
      dispatch({ type: 'LOGOUT' })
    }
  }, tokenExpirationTime)
  // ...
}
```

**Problem:** When `setTimeout` fires after 1 hour, the `state` variable still points to the state object from when the timer was created. By that time, `state.logoutTimerID` and other fields will be completely outdated. This means `clearLogoutTimerImpl` inside `refreshTokenImpl` will try to clear a potentially wrong or already-cleared timer.

**Impact:** Silent token refresh failures, zombie timers, potential memory leaks.

### 🔴 BUG #2: Unhandled Exception in `AuthGate.tsx` (line 27)

```typescript
// AuthGate.tsx
useEffect(() => {
  const authToken = getTokenFromLocalStorage()
  if (authToken) {
    /* ... */ return
  }

  const refreshToken = getRefreshTokenFromLocalStorage() // ← THROWS if no token!

  if (!refreshToken) {
    // ← Never reached, error already thrown
    actions.logout()
    return
  }
  // ...
}, [])
```

**Problem:** `getRefreshTokenFromLocalStorage()` throws an `Error('No refresh token available')` when no token exists. But the calling code in `AuthGate` has no `try-catch`. The `if (!refreshToken)` guard on line 29 is unreachable.

**Impact:** Unhandled error crashes the app when a user visits with no stored tokens (e.g., first visit or after clearing storage).

### 🔴 BUG #3: Unreachable Code in `authApi.ts` (lines 23-27, 40-44)

```typescript
async login(username: string, password: string): Promise<LoginResponse> {
  const tokens = await new Promise<LoginResponse>((resolve) => {
    setTimeout(() => {
      resolve({ token: MockToken, refreshToken: MockRefreshToken })
    }, 1000)
  })
  return tokens                               // ← Returns here
  return this.request(`${this.baseUrl}/login`, {  // ← DEAD CODE (unreachable)
    method: 'POST',
    // ...
  })
}
```

**Problem:** Both `login()` and `refreshToken()` have two return statements. The second `return this.request(...)` is dead code. This is likely from testing with mock data but the dead code should be removed or properly handled with a flag/environment variable.

### 🔴 BUG #4: Missing `'use client'` Directive in `AuthProvider.tsx`

```typescript
// AuthProvider.tsx — NO 'use client' at the top!
import { createContext, useReducer, useMemo } from 'react'
```

**Problem:** `AuthProvider` uses React hooks (`useReducer`, `useMemo`, `createContext`) which require client-side rendering in Next.js App Router. The `'use client'` directive is missing. Compare with `MediaGalleryProvider.tsx` and `UploadProvider.tsx` which correctly include it.

**Impact:** This works only because it's imported in `page.tsx` which is itself a client component chain, but it violates Next.js conventions and will break if the import tree changes.

---

## 3. Redundant Re-Renders & Performance

### 🔴 CRITICAL: `useMemo` Dependency on `state` Defeats Memoization

```typescript
// AuthProvider.tsx
const actions = useMemo<AuthActionTypes>(
  () => ({
    login: (email, password) => loginImpl(dispatch, state, email, password),
    logout: () => logoutImpl(dispatch, state),
    refreshToken: () => refreshTokenImpl(dispatch, state),
    setLogoutTimer: () => setLogoutTimerImpl(dispatch, state),
    clearLogoutTimer: () => clearLogoutTimerImpl(dispatch, state.logoutTimerID),
    setLogedInState: () => setLogedInStateImpl(dispatch),
  }),
  [dispatch, state], // ← state changes on EVERY dispatch → useMemo recomputes EVERY TIME
)
```

**This is the single biggest performance issue in the feature.**

#### Why This Causes Redundant Renders

1. User calls `actions.login()` → dispatches `LOGIN_START`
2. Reducer produces new `state` → `state` reference changes
3. `useMemo` dependency `[dispatch, state]` detects change → **creates entirely new `actions` object**
4. Context value `{ state, actions }` is now a new object (both fields are new references)
5. **Every component using `useAuth()` re-renders**, even components that only read `actions`
6. `LOGIN_SUCCESS` dispatches → repeat steps 2-5 again

**Each login causes at minimum 3 full re-render cascades** (LOGIN_START, LOGIN_SUCCESS, SET_LOGOUT_TIMER_ID).

#### Comparison with Your Other Features

Your `MediaGalleryProvider` does it correctly:

```typescript
// MediaGalleryProvider.tsx — CORRECT pattern
const actions = useMemo(
  (): MediaGalleryHandlers => createMediaGalleryActions(dispatch),
  [dispatch], // ← Only depends on dispatch (stable reference from useReducer)
)
```

`dispatch` from `useReducer` is **referentially stable** (React guarantees this). So actions are computed **once** and never change. This means components consuming only `actions` never re-render unnecessarily.

### Re-Render Chain Analysis

```
Login Flow Re-renders:
────────────────────────────────────────────────
Action             │ State Change       │ Re-renders
────────────────────────────────────────────────
login() called     │ LOGIN_START         │ All useAuth() consumers (×1)
                   │ (loading: true)     │ + new actions object created
────────────────────────────────────────────────
API responds       │ LOGIN_SUCCESS       │ All useAuth() consumers (×2)
                   │ (isAuth: true)      │ + new actions object created
────────────────────────────────────────────────
Timer set          │ SET_LOGOUT_TIMER_ID │ All useAuth() consumers (×3)
                   │ (timerID: 123)      │ + new actions object created
────────────────────────────────────────────────
Total: 3 cascading re-renders for a single login
```

### Fix: Decouple Actions from State

Actions should only depend on `dispatch`. State should be read inside the action functions via a ref or by restructuring the logic:

```typescript
// SOLUTION: Use a ref to always have fresh state
const stateRef = useRef(state)
stateRef.current = state

const actions = useMemo<AuthActionTypes>(
  () => ({
    login: (email, password) => loginImpl(dispatch, stateRef, email, password),
    logout: () => logoutImpl(dispatch, stateRef),
    // ... etc
  }),
  [dispatch], // Now truly stable!
)
```

Or better yet, follow the `createMediaGalleryActions` factory pattern and have actions only need `dispatch`.

---

## 4. Code Quality Issues

### 4.1 Typos

| Location                             | Typo                                      | Correct                                     |
| ------------------------------------ | ----------------------------------------- | ------------------------------------------- |
| `modelTypes.ts:1`                    | `AythStateType`                           | `AuthStateType`                             |
| `modelTypes.ts:22`, `actions.ts:100` | `setLogedInState` / `setLogedInStateImpl` | `setLoggedInState` / `setLoggedInStateImpl` |

### 4.2 ESLint Suppression in `AuthGate.tsx`

```typescript
//eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

This suppression hides a real issue: `actions` is not stable (see Section 3). If `actions` were included in the dependency array as the rule requires, the effect would re-run on every state change, creating infinite loops. The suppression is a band-aid for the architectural problem.

**Fix the root cause** (stable actions) and the eslint suppression becomes unnecessary.

### 4.3 `calculateTokenExpirationTime` Is Defined but Underused

`token.manager.ts` defines `calculateTokenExpirationTime()`, and `AuthGate.tsx` uses it, but `setLogoutTimerImpl` in `actions.ts` has a hardcoded `60 * 60 * 1000` instead of using the actual token expiration:

```typescript
// actions.ts:77
const tokenExpirationTime = 60 * 60 * 1000 // 1 hour for demo
// Should use: calculateTokenExpirationTime(getTokenFromLocalStorage())
```

### 4.4 Inconsistent Error Handling

- `loginImpl` — catches errors and dispatches `LOGIN_FAILURE` ✅
- `refreshTokenImpl` — catches errors and dispatches `LOGOUT` ✅
- `setLogoutTimerImpl` — catches errors in timer callback but silently ignores if `refreshTokenImpl` rejects ⚠️
- `AuthGate.useAuthState` — no error handling for thrown exceptions ❌

### 4.5 `logoutTimerID` Stored in React State

Timer IDs are implementation details that don't need to trigger re-renders. Storing them in reducer state causes unnecessary renders (see Section 3). A `useRef` is more appropriate.

### 4.6 `AuthGate` Returns `null` But Gets No Loading/Error UI

`AuthGate` is a pure side-effect component. Consider whether it should:

- Show a loading state while restoring the session
- Show an error if session restoration fails
- Block rendering of children until auth state is resolved

Currently, child components render immediately even before `useAuthState` finishes, potentially showing a flash of unauthenticated content.

---

## 5. Type Safety Issues

### 5.1 Type Signature Mismatch: `refreshToken`

```typescript
// modelTypes.ts — declared signature
refreshToken: (refreshToken: string) => Promise<void>

// AuthProvider.tsx — actual implementation
refreshToken: () => refreshTokenImpl(dispatch, state) // No argument!
```

The type says it accepts a `refreshToken` string parameter, but the implementation ignores it and reads from localStorage internally. The type should match the actual usage:

```typescript
refreshToken: () => Promise<void> // No argument needed
```

### 5.2 Type Signature Mismatch: `setLogoutTimer`

```typescript
// modelTypes.ts — declared signature
setLogoutTimer: (timerID: number) => void

// AuthProvider.tsx — actual implementation
setLogoutTimer: () => setLogoutTimerImpl(dispatch, state)  // Ignores timerID
```

### 5.3 `clearLogoutTimerImpl` Truthy Check

```typescript
// actions.ts:94
if (timerID) {
  // ← Truthy check: timer ID of 0 would be skipped!
  clearTimeout(timerID)
}
```

`setTimeout` can return `0` on some platforms. A `!== null` check is safer:

```typescript
if (timerID !== null) {
  clearTimeout(timerID)
}
```

---

## 6. Security Concerns

### 6.1 Tokens in `localStorage` (XSS Vulnerability)

```typescript
// localStorage.manager.ts
localStorage.setItem('authToken', token)
localStorage.setItem('authRefreshToken', refreshToken)
```

**Risk:** Any XSS attack can read `localStorage`. Auth tokens should be stored in `httpOnly` cookies which are inaccessible to JavaScript.

**Recommendation:** Use `httpOnly` secure cookies set by the server, or at minimum use `sessionStorage` (cleared on tab close) with appropriate CSP headers.

### 6.2 JWT Parsing Without Validation

```typescript
// token.manager.ts
const payload = JSON.parse(atob(token.split('.')[1]))
```

This only decodes the JWT payload — it does NOT verify the signature. A malicious token with a faked `exp` claim would be accepted. Token validation should happen server-side.

### 6.3 Mock Tokens in Production Code

```typescript
// authApi.ts
const MockToken = 'mock-token'
const MockRefreshToken = 'mock-refresh-token'
```

These mock tokens are embedded in production code without environment guards. `calculateTokenExpirationTime('mock-token')` would crash (the mock tokens aren't real JWTs) and fall through to the `catch` block returning `0`.

---

## 7. Best Practices Recommendations

### 7.1 Add a ViewModel Layer (Consistency with Other Features)

Create `useAuthViewModel.ts` to separate presentation logic from raw model access:

```typescript
// model/useAuthViewModel.ts
export function useAuthViewModel() {
  const { state, actions } = useAuth()

  return {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.loading,
    error: state.error,
    login: actions.login,
    logout: actions.logout,
  } as const
}
```

### 7.2 Use Factory Pattern for Actions (Consistency)

Follow the pattern established in `media-gallery` and `media-upload`:

```typescript
// model/actions.ts
export function createAuthActions(
  dispatch: React.Dispatch<AuthDispatchActionType>,
  stateRef: React.RefObject<AythStateType>,
) {
  return {
    login: (email: string, password: string) => loginImpl(dispatch, email, password),
    logout: () => logoutImpl(dispatch, stateRef),
    // ...
  }
}
```

### 7.3 Move Timer Logic to a Dedicated Hook or Service

Timer management (setTimeout/clearTimeout) interleaved with auth state creates complexity. Extract it:

```typescript
// lib/autoRefresh.ts or hooks/useTokenAutoRefresh.ts
export function useTokenAutoRefresh(onExpired: () => void) {
  const timerRef = useRef<number | null>(null)
  // ... manages timer lifecycle via refs, not state
}
```

### 7.4 Use Enum or Constants for Action Types

```typescript
// Instead of string literals:
export const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOGOUT_TIMER_ID: 'SET_LOGOUT_TIMER_ID',
  CLEAR_LOGOUT_TIMER_ID: 'CLEAR_LOGOUT_TIMER_ID',
} as const
```

### 7.5 Add `'use client'` Where Required

Files that use React hooks must have `'use client'` at the top in Next.js App Router:

- `AuthProvider.tsx` — **missing** ❌
- `useAuth.ts` — **missing** ❌ (uses `useContext`)

### 7.6 Move `useAuthState` Out of the View Layer

The `useAuthState` hook in `AuthGate.tsx` performs business logic (token validation, session restoration). It belongs in the `model/` layer, not `view/`.

### 7.7 Consider `useReducer` + `useRef` for Timer IDs

Timer IDs don't need to trigger re-renders. Remove `logoutTimerID` from state and manage it via `useRef`:

```typescript
// This removes 2 action types (SET_LOGOUT_TIMER_ID, CLEAR_LOGOUT_TIMER_ID)
// and prevents 2 unnecessary re-renders per login/refresh cycle
const timerRef = useRef<number | null>(null)
```

---

## 8. File-by-File Summary

### `index.ts` ✅ Good

- Clean public API, exports only what's needed.

### `types/modelTypes.ts` ⚠️ Issues

- Typo: `AythStateType` → `AuthStateType`
- Typo: `setLogedInState` → `setLoggedInState`
- Type signatures for `refreshToken` and `setLogoutTimer` don't match implementation
- `logoutTimerID` shouldn't be part of the state type (use ref)

### `api/authApi.ts` ⚠️ Issues

- Dead code (unreachable return statements)
- Mock data without environment guards
- Good: class-based API extending `BaseApi`, consistent with project patterns

### `lib/localStorage.manager.ts` ⚠️ Fair

- `getRefreshTokenFromLocalStorage` throws instead of returning null — inconsistent with `getTokenFromLocalStorage` which returns null
- Security concern: `localStorage` for tokens

### `lib/token.manager.ts` ✅ Acceptable

- JWT decoding without signature verification (expected for client-side expiry checks)
- Good error handling with try-catch

### `model/reducer.ts` ✅ Good

- Clean, pure reducer function
- Good use of discriminated unions
- Minor: `LOGOUT` should also clear `error` and `loading` state

### `model/actions.ts` ❌ Major Issues

- Stale closure bug in timer callback
- State passed as argument creates tight coupling and re-render issues
- Hardcoded token expiration time
- Should follow `createXxxActions` factory pattern

### `model/AuthProvider.tsx` ❌ Major Issues

- Missing `'use client'` directive
- `useMemo` depends on `state` — defeats memoization entirely
- Creates new context value on every state change (could split into separate contexts for state vs actions)

### `model/useAuth.ts` ✅ Good

- Clean context consumer with proper error handling
- Missing `'use client'`

### `view/gate/AuthGate.tsx` ⚠️ Issues

- `useAuthState` hook contains business logic that belongs in `model/`
- Unhandled exception from `getRefreshTokenFromLocalStorage()`
- ESLint rule suppressed to hide dependency issue
- Returns null — no loading/error UI

---

## 9. Suggested Refactored Architecture

```
authentication/
├── api/
│   └── authApi.ts              # Pure API calls (remove mock data or env-guard it)
├── lib/
│   ├── tokenStorage.ts         # Token persistence (renamed for clarity)
│   ├── tokenParser.ts          # Token decoding/validation
│   └── autoRefreshManager.ts   # Timer logic extracted here
├── model/
│   ├── authActions.ts          # createAuthActions(dispatch) factory — NO state arg
│   ├── AuthProvider.tsx        # Context provider (add 'use client')
│   ├── authReducer.ts          # Pure reducer (remove timerID from state)
│   ├── useAuth.ts              # Context consumer hook
│   ├── useAuthViewModel.ts     # NEW: ViewModel for consumers
│   └── useSessionRestore.ts    # Moved from AuthGate — session init logic
├── types/
│   └── auth.types.ts           # Fixed types
├── view/
│   └── AuthGate.tsx            # Thin wrapper, just calls useSessionRestore()
└── index.ts                    # Public API
```

---

## 10. Priority Action Items

### P0 — Must Fix (Bugs)

| #   | Issue                             | File                     | Line(s)      |
| --- | --------------------------------- | ------------------------ | ------------ |
| 1   | Stale state closure in setTimeout | `model/actions.ts`       | 72-88        |
| 2   | Unhandled throw in useAuthState   | `view/gate/AuthGate.tsx` | 27           |
| 3   | Missing `'use client'` directive  | `model/AuthProvider.tsx` | 1            |
| 4   | Unreachable dead code             | `api/authApi.ts`         | 23-27, 40-44 |

### P1 — Should Fix (Performance)

| #   | Issue                                                    | File                     | Line(s) |
| --- | -------------------------------------------------------- | ------------------------ | ------- |
| 5   | `useMemo` depends on `state` — causes cascade re-renders | `model/AuthProvider.tsx` | 26-36   |
| 6   | `logoutTimerID` in state causes unnecessary renders      | `model/reducer.ts`       | 3       |
| 7   | Type mismatches in `AuthActionTypes`                     | `types/modelTypes.ts`    | 16-23   |

### P2 — Nice to Have (Quality)

| #   | Issue                                                    | File                          |
| --- | -------------------------------------------------------- | ----------------------------- |
| 8   | Fix typos (`AythStateType`, `setLogedInState`)           | `types/modelTypes.ts`         |
| 9   | Add ViewModel layer for MVVM consistency                 | `model/`                      |
| 10  | Move `useAuthState` to model layer                       | `view/gate/AuthGate.tsx`      |
| 11  | Use `createAuthActions` factory pattern                  | `model/actions.ts`            |
| 12  | Add loading/error UI to AuthGate                         | `view/gate/AuthGate.tsx`      |
| 13  | Consistent error return vs throw in localStorage manager | `lib/localStorage.manager.ts` |
| 14  | Remove ESLint suppression by fixing root cause           | `view/gate/AuthGate.tsx`      |
| 15  | Use env variables for mock vs real API                   | `api/authApi.ts`              |

### P3 — Future Consideration

| #   | Issue                                                                                |
| --- | ------------------------------------------------------------------------------------ |
| 16  | Move token storage to `httpOnly` cookies                                             |
| 17  | Add CSRF protection                                                                  |
| 18  | Add proper JWT validation on the server side                                         |
| 19  | Consider using a state management library (Zustand) if auth state grows more complex |

---

## Summary

The authentication feature has a **solid structural foundation** — the FSD layer separation, public API boundaries, and general pattern are correct. However, there are **4 real bugs** (stale closure, unhandled throw, missing directive, dead code) and **1 critical performance issue** (actions recreated on every state change) that need immediate attention.

The biggest architectural gap compared to your other features is that `actions` depend on `state`, which breaks the memoization pattern and causes cascading re-renders. Fixing this single issue (by using a ref for state access, or restructuring to use the factory pattern) would resolve both the performance problem and the stale closure bug simultaneously.

**Overall Assessment: 5.5/10** — Good architecture, meaningful bugs that need fixing before production.
