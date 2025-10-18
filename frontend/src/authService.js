import { signIn as amplifySignIn, signUp as amplifySignUp, signOut as amplifySignOut, getCurrentUser as amplifyGetCurrentUser, confirmSignUp as amplifyConfirmSignUp } from 'aws-amplify/auth'

export async function signUp({ username, password, email }) {
  return amplifySignUp({
    username,
    password,
    options: {
      userAttributes: { email }
    }
  })
}

export async function confirmSignUp(username, code) {
  return amplifyConfirmSignUp({ username, confirmationCode: code })
}

export async function signIn(username, password) {
  return amplifySignIn({ username, password })
}

export async function signOut() {
  return amplifySignOut()
}

export async function getCurrentUser() {
  return amplifyGetCurrentUser()
}
