import type { JwtPayload } from '@tsndr/cloudflare-worker-jwt'
import type { Toucan } from 'toucan-js'

type Environment = {
  Bindings: {
    ENV: string
  }
}
