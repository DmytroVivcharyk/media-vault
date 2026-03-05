import { getTokenFromLocalStorage } from '../lib/localStorage.manager'
import type { BaseApi } from '@/shared/api/baseApi'

type BaseApiRequest = BaseApi['request']

/**
 * TC39 Stage 3 method decorator that injects the Authorization header
 * into all `this.request()` calls made by the decorated method.
 *
 * Usage:
 *   class MyApi extends BaseApi {
 *     @withAuth
 *     async getProtectedData() {
 *       return this.request('/api/data') // ← automatically gets Bearer token
 *     }
 *   }
 */
export function withAuth<This extends BaseApi, Args extends unknown[], Return>(
  originalMethod: (this: This, ...args: Args) => Promise<Return>,
  context: ClassMethodDecoratorContext<This>,
): (this: This, ...args: Args) => Promise<Return> {
  if (context.kind !== 'method') {
    throw new Error('withAuth can only be applied to methods')
  }

  return async function (this: This, ...args: Args): Promise<Return> {
    const token = getTokenFromLocalStorage()
    const originalRequest: BaseApiRequest = this.request.bind(this)

    // Temporarily override this.request to inject auth header
    const self = this as unknown as { request: BaseApiRequest }
    self.request = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
      return originalRequest(input, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
    }

    try {
      return await originalMethod.call(this, ...args)
    } finally {
      // Restore original request even if the method throws
      self.request = originalRequest
    }
  }
}
