import { BaseApi } from '@/shared/api/baseApi'

// TODO: Remove mock data and use real API calls
const MockToken = 'mock-token'
const MockRefreshToken = 'mock-refresh-token'

type LoginResponse = {
  token: string
  refreshToken: string
}

class AuthApi extends BaseApi {
  private readonly baseUrl = '/api/auth'

  async login(username: string, password: string): Promise<LoginResponse> {
    // TODO: Replace with: return this.request(`${this.baseUrl}/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username, password }),
    // })
    return new Promise<LoginResponse>((resolve) => {
      setTimeout(() => {
        resolve({ token: MockToken, refreshToken: MockRefreshToken })
      }, 1000)
    })
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    // TODO: Replace with: return this.request(`${this.baseUrl}/refresh`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ refreshToken }),
    // })
    return new Promise<LoginResponse>((resolve) => {
      setTimeout(() => {
        resolve({ token: MockToken, refreshToken: MockRefreshToken })
      }, 3000)
    })
  }
}

export const authApi = new AuthApi()
