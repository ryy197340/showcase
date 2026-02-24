import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAppCheck } from 'firebase-admin/app-check'

// Initialize Firebase Admin SDK (only once)
let isInitialized = false

export const initializeFirebase = () => {
  if (!isInitialized && getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    })
    isInitialized = true
  }
}

export interface AppCheckVerificationResult {
  isValid: boolean
  error?: string
  code?: string
}

/**
 * Verify Firebase App Check token
 */
export const verifyAppCheckToken = async (token: string | undefined): Promise<AppCheckVerificationResult> => {
  if (!token) {
    return {
      isValid: false,
      error: 'Missing App Check token',
      code: 'MISSING_APP_CHECK_TOKEN'
    }
  }

  try {
    initializeFirebase()
    await getAppCheck().verifyToken(token)
    return { isValid: true }
  } catch (error) {
    console.error('App Check token verification failed:', error)
    return {
      isValid: false,
      error: 'Invalid App Check token',
      code: 'INVALID_APP_CHECK_TOKEN'
    }
  }
}

/**
 * Standard error responses for API routes
 */
export const createErrorResponse = (status: number, error: string, code: string) => ({
  status,
  body: { error, code }
})

export const APP_CHECK_ERRORS = {
  MISSING_TOKEN: createErrorResponse(401, 'Missing App Check token', 'MISSING_APP_CHECK_TOKEN'),
  INVALID_TOKEN: createErrorResponse(401, 'Invalid App Check token', 'INVALID_APP_CHECK_TOKEN'),
  INTERNAL_ERROR: createErrorResponse(500, 'Internal server error', 'INTERNAL_ERROR')
}
