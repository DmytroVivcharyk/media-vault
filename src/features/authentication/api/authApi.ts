import { BaseApi } from '@/shared/api/baseApi'

const MockToken = 'mock-token'
const MockRefreshToken = 'mock-refresh-token'

type LoginResponse = {
  token: string
  refreshToken: string
}

class AuthApi extends BaseApi {
  private readonly baseUrl = '/api/auth'

  async login(username: string, password: string): Promise<LoginResponse> {
    // Simulate an API call with a timeout // TODO Replace with real API call
    const tokens = await new Promise<LoginResponse>((resolve) => {
      setTimeout(() => {
        resolve({ token: MockToken, refreshToken: MockRefreshToken })
      }, 1000)
    })

    return tokens
    return this.request(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    // Simulate an API call to refresh the token with a timeout // TODO Replace with real API call
    const tokens = await new Promise<LoginResponse>((resolve) => {
      setTimeout(() => {
        resolve({ token: MockToken, refreshToken: MockRefreshToken }) // For demo purposes, we return the same mock token
      }, 3000)
    })

    return tokens

    return this.request(`${this.baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  }
}

export const authApi = new AuthApi()
