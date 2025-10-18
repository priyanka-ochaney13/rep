import { useEffect, useState } from 'react'
import { getCurrentUser, signOut } from '../authService'

export default function Profile() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null))
  }, [])

  if (!user) return <p>Please sign in.</p>

  return (
    <div>
      <p>Welcome, {user.username || user.attributes?.email}!</p>
      <button onClick={() => signOut().then(() => window.location.reload())}>Sign Out</button>
    </div>
  )
}
