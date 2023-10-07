# Reproduction of issues encountered integrating [Hono](https://github.com/honojs/hono) and [Pothos](https://github.com/hayes/pothos)
There are 3 tests in the repo which currently fail. Each of these is outlined after the Quick Start section.

## Quick Start

To install, run:

```bash
npm install
```

To build, run:

```bash
npm run build
```
To run tests:

```bash
npm run tests
```

To run locally in dev (http://localhost:8787/graphql):

```bash
npm run dev
```

## TEST: should return 200 and correct content if context propagated correctly

Mutation: `noContext`

The pipeline context (containing request details etc) isn't propagated down to resolvers. If I include a rootResolver, it does get propagated to that.

## TEST: should return 200 and correct content if authScopes handled correctly

Mutation: `authScopesIssue`

If I include `authScopes: { public: true }` on the resolver for authorization purposes Pothos gives this error, returned as a GraphQL error:
````
{"errors":[{"message":"Invalid value used as weak map key","locations":[{"line":1,"column":12}],"path":["authScopesIssue"]}]}
````

I raised an issue in the Pothos repo: https://github.com/hayes/pothos/issues/1064, and it's most likely caused by not receiving the context correctly in the resolver. So if the first issue is fixed, then hopefully this should be too.

## TEST: should directly return 401 if graphql errors handling can be bypassed

In some instances (e.g. a device authentication mutation I'm working on), it would be good to be able to return standard http codes, but everything seems to get returned as a GraphQL response.

## License

[MIT](LICENSE)
