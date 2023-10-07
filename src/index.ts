import { Context, Hono } from 'hono'
import { Environment } from '../bindings'
import { RootResolver, graphqlServer } from '@hono/graphql-server'
import SchemaBuilder from '@pothos/core'
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects'
import ScopeAuthPlugin from '@pothos/plugin-scope-auth'
import { ApiError } from './utils/errorHandling'
import { errorHandler } from './utils/errorHandling'

const app = new Hono<Environment>()

const rootResolver: RootResolver = (ctx?: Context) => {
  return { ctx }
}

interface Root<T> {
  Context: T
}

export interface BuilderContext {
  ctx: Context
}

const builder = new SchemaBuilder<
  Root<BuilderContext> & 
  {
    Scalars: {
      Date: {
        Input: Date
        Output: Date
      }
    }
  } &
  {
    AuthScopes: {
      public: boolean
    }
  }
>({
  plugins: [ScopeAuthPlugin, SimpleObjectsPlugin],
  authScopes: async (context) => ({
    public: false, 
  }),
  scopeAuthOptions: {
    authorizeOnSubscribe: true
  }  
})

builder.queryType({})
builder.mutationType({})

// Needs to be one query, or schema building fails
builder.queryField('hello', (t) =>
  t.string({
    resolve: () => 'hello, world!',
  }),
)

export const SimpleRequest = builder.inputType('SimpleRequest', {
  fields: (t) => ({
    hello: t.string({ required: true })
  })
})

export const SimpleResponse = builder.simpleObject('SimpleResponse', {
  fields: (t) => ({
    id: t.string()
  })
})

builder.mutationField('noContext', (t) =>
  t.field({
    type: SimpleResponse,
    args: {
      input: t.arg({
        type: SimpleRequest,
        required: true
      })
    },
    resolve: async (root, args, ctx) => {
      //console.log("Made it!", root, args, ctx)
      // The resolver should receive the pipeline context here
      if (!ctx) {
        throw Error("No context 😞")
      }
      return { id: "Done!"}
    }
  })
)

builder.mutationField('authScopesIssue', (t) =>
  t.field({
    type: SimpleResponse,
    args: {
      input: t.arg({
        type: SimpleRequest,
        required: true
      })
    },
    authScopes: { public: true }, // Comment this out and the authScopesIssue test will work
    resolve: async (root, args, ctx) => {
      //console.log("Made it!", root, args, ctx)
      return { id: "Done!"}
    }
  })
)

builder.mutationField('errorHandling', (t) =>
  t.field({
    type: SimpleResponse,
    args: {
      input: t.arg({
        type: SimpleRequest,
        required: true
      })
    },
    resolve: async (root, args, ctx) => {
      throw new ApiError(401, "Unauthorized")
    }
  })
)

app.onError(errorHandler)

let schema = builder.toSchema({})

app.use(
  '/graphql',
  graphqlServer({
    schema,
    rootResolver
  })
)

export default app
