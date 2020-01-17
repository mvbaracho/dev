/**
 * Action types
 */
export enum AuthTypes {
  SIGN_IN_REQUEST = '@auth/SIGN_IN_REQUEST',
  SIGN_IN_SUCCESS = '@auth/SIGN_IN_SUCCESS'
}

/**
 * Data types
 */
export interface Auth {
  email: string
  password: string
}

/**
 * State type
 */
export interface AuthState {
  readonly signedIn: boolean
  readonly token: string
}