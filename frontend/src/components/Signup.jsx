import { useState } from 'react'
import { signUp } from '../authService'

export default function Signup({ onSignedUp }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await signUp({ username: email, password, email })
      alert('Signup successful! Check your email for the verification code.')
      onSignedUp(email)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit">Sign Up</button>
    </form>
  )
}
