import { useEffect, useState } from 'react'
import { Landing } from './Landing'
import { Workspace } from './Workspace'

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

  if (path === '/app') {
    return <Workspace onHome={() => go('/')} />
  }

  return <Landing onOpen={() => go('/app')} />
}
