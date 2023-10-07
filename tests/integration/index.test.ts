import httpStatus from 'http-status'
import { request } from '../utils/testRequest'

describe('Repro tests', () => {

  test('should return 200 and correct content if context propagated correctly', async () => {
    let requestString = 'mutation { noContext ( input: { hello: "Hello!" } ) { id }}'
    const res = await request('/graphql', {
      method: 'POST',
      headers: [['Content-Type', 'application/graphql']],
      body: requestString
    })
    let correctResponse = { data: { noContext: {id: "Done!"}} }
    const body = await res.text()
    console.debug(`Status: ${res.status}`)
    console.debug(`Body: ${body}`)
    expect(res.status).toBe(httpStatus.OK)
    expect(JSON.parse(body)).toMatchObject(correctResponse)
  })

  test('should return 200 and correct content if authScopes handled correctly', async () => {
    let requestString = 'mutation { authScopesIssue ( input: { hello: "Hello!" } ) { id }}'
    const res = await request('/graphql', {
      method: 'POST',
      headers: [['Content-Type', 'application/graphql']],
      body: requestString
    })
    let correctResponse = { data: { authScopesIssue: {id: "Done!"}} }
    const body = await res.text()
    console.debug(`Status: ${res.status}`)
    console.debug(`Body: ${body}`)
    expect(res.status).toBe(httpStatus.OK)
    expect(JSON.parse(body)).toMatchObject(correctResponse)
  })

  test('should directly return 401 if graphql errors handling can be bypassed', async () => {
    let requestString = 'mutation { errorHandling ( input: { hello: "Hello!" } ) { id }}'
    const res = await request('/graphql', {
      method: 'POST',
      headers: [['Content-Type', 'application/graphql']],
      body: requestString
    })
    const body = await res.text()
    console.debug(`Status: ${res.status}`)
    console.debug(`Body: ${body}`)
    expect(res.status).toBe(httpStatus.UNAUTHORIZED)
    expect(body).toMatchObject("Unauthorized")
  })

})
