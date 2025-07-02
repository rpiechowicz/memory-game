export const FetchMethods = {
  GET: 'GET',
  POST: 'POST',
  HEAD: 'HEAD',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const

export interface FetchOptions {
  method: (typeof FetchMethods)[keyof typeof FetchMethods]
  body?: string | FormData | Blob | ArrayBufferView | ArrayBuffer | ReadableStream<Uint8Array> | Record<string, any> | null
}
