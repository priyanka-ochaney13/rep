import { useState } from 'react'
import { signIn } from '../authService'

export default function Signin({ onSignedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const user = await signIn(email, password)
      alert('Signed in successfully!')
      onSignedIn(user)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  )
}
