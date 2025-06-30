export enum FetchMethods {
  GET = 'GET',
  POST = 'POST',
  HEAD = 'HEAD',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface FetchOptions {
  method: FetchMethods
  body?: string | FormData | Blob | ArrayBufferView | ArrayBuffer | ReadableStream<Uint8Array> | Record<string, any> | null
}
