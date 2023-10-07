import app from '../../src'

const devUrl = 'http://localhost:8787'
const env = getMiniflareBindings()

class Context implements ExecutionContext {
  passThroughOnException(): void {
    throw new Error('Method not implemented.')
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async waitUntil(promise: Promise<any>): Promise<void> {
    await promise
  }
}

const request = async (path: string, options: RequestInit) => {
  const formattedUrl = new URL(path, devUrl).href
  const request = new Request(formattedUrl, options)
  return app.fetch(request, env, new Context())
}

export { request }
