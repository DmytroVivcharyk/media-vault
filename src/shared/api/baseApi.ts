interface IBaseApi {
  request: <T>(input: RequestInfo, options?: RequestInit) => Promise<T>
}

export class BaseApi implements IBaseApi {
  async request<T>(input: RequestInfo, options?: RequestInit): Promise<T> {
    const response = await fetch(input, options)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }
}
