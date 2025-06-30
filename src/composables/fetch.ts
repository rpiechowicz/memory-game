import type { FetchOptions, FetchRequest } from 'ofetch'
import { ofetch } from 'ofetch'

export default async function fetchData<T>(
  request: FetchRequest,
  options?: FetchOptions<'json', any>,
): Promise<T> {
  return ofetch<T>(request, { ...options, responseType: 'json' })
}
