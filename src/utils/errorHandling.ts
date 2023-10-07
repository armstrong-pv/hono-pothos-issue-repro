import { getSentry } from '@hono/sentry'
import type { ErrorHandler } from 'hono'
import { StatusCode } from 'hono/utils/http-status'
import { Environment } from '../../bindings'
import { getConfig } from '../config/config'
import httpStatus from 'http-status'
import type { Toucan } from 'toucan-js'
import { ZodError } from 'zod'
import { generateErrorMessage, ErrorMessageOptions } from 'zod-error'


export const errorHandler: ErrorHandler<Environment> = (err, c) => {
  console.log(err)
  const config = getConfig(c.env)
  const sentry = getSentry(c)
  const error = errorConverter(err, sentry)
  if (config.env === 'production' && !error.isOperational) {
    error.statusCode = httpStatus.INTERNAL_SERVER_ERROR
    error.message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR].toString()
  }

  const response = {
    code: error.statusCode,
    message: error.message,
    ...(config.env === 'development' && { stack: err.stack })
  }
  delete c.error // Don't pass to sentry middleware as it is either logged or already handled
  return c.json(response, error.statusCode as StatusCode)
}

export class ApiError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
  }
}

const zodErrorOptions: ErrorMessageOptions = {
  transform: ({ errorMessage, index }) => `Error #${index + 1}: ${errorMessage}`
}

export const errorConverter = (err: unknown, sentry: Toucan): ApiError => {
  let error = err
  if (error instanceof ZodError) {
    const errorMessage = generateErrorMessage(error.issues, zodErrorOptions)
    error = new ApiError(httpStatus.BAD_REQUEST, errorMessage)
  } else if (error instanceof SyntaxError) {
    // Request body parsing error should not be 500
    error = new ApiError(httpStatus.BAD_REQUEST, error.message)
  } else if (!(error instanceof ApiError)) {
    const castedErr = (typeof error === 'object' ? error : {}) as Record<string, unknown>
    const statusCode: number =
      typeof castedErr.statusCode === 'number'
        ? castedErr.statusCode
        : httpStatus.INTERNAL_SERVER_ERROR
    const message = (castedErr.description || castedErr.message || httpStatus[statusCode]) as string
    if (statusCode >= 500) {
      // Log any unhandled application error
      sentry.captureException(error)
    }
    error = new ApiError(statusCode, message, false)
  }
  return error as ApiError
}
