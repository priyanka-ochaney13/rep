import { useState } from 'react'
import { confirmSignUp } from '../authService'

export default function ConfirmSignup({ username, onConfirmed }) {
  const [code, setCode] = useState('')

  async function handleConfirm(e) {
    e.preventDefault()
    try {
      await confirmSignUp(username, code)
      alert('Account confirmed! You can now sign in.')
      onConfirmed()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <form onSubmit={handleConfirm}>
      <input placeholder="Verification Code" value={code} onChange={e=>setCode(e.target.value)} />
      <button type="submit">Confirm</button>
    </form>
  )
}
