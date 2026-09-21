import { useEffect, useState } from 'react'
import JoinedAsModal from '../pages/handoff/JoinedAsModal'
import { consumeJoinedAs, JOINED_AS_EVENT, JOINED_AS_KEY } from '../lib/returnWorkflow'

export default function JoinedAsHost() {
  const [userId, setUserId] = useState<string | null>(() => sessionStorage.getItem(JOINED_AS_KEY))

  useEffect(() => {
    const onJoined = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      setUserId(detail || sessionStorage.getItem(JOINED_AS_KEY))
    }
    window.addEventListener(JOINED_AS_EVENT, onJoined)
    return () => window.removeEventListener(JOINED_AS_EVENT, onJoined)
  }, [])

  const handleContinue = () => {
    consumeJoinedAs()
    setUserId(null)
  }

  return <JoinedAsModal userId={userId} onContinue={handleContinue} />
}
