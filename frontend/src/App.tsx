import { useEffect, useState } from 'react'

import { Landing } from './Landing'
import { Workspace } from './Workspace'
import { VaultProvider } from './context/VaultContext'

function currentPath(): string {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

export default function App() {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const onPop = () => setPath(currentPath())

    window.addEventListener('popstate', onPop)

    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function go(to: string) {
    window.history.pushState({}, '', to)
    setPath(to.replace(/\/+$/, '') || '/')
    window.scrollTo(0, 0)
  }

  return (
    <VaultProvider>
      {path === '/app' ? (
        <Workspace onHome={() => go('/')} />
      ) : (
        <Landing onOpen={() => go('/app')} />
      )}
    </VaultProvider>
  )
}