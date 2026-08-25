import { AnchorHTMLAttributes, createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'

function normalize(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname || '/'
}

interface RouterValue { path: string; navigate: (to: string) => void }

const RouterContext = createContext<RouterValue | null>(null)

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => normalize(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setPath(normalize(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((to: string) => {
    const [pathPart, hash] = to.split('#')
    const targetPath = normalize(pathPart || '/')
    const sameRoute = targetPath === normalize(window.location.pathname)
    if (sameRoute) window.history.replaceState({}, '', to)
    else window.history.pushState({}, '', to)
    setPath(targetPath)
    requestAnimationFrame(() => {
      if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
      else window.scrollTo(0, 0)
    })
  }, [])

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('useRouter must be used within RouterProvider')
  return ctx
}

type LinkProps = { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>

export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter()
  return <a
    href={to}
    {...rest}
    onClick={event => {
      onClick?.(event)
      if (event.defaultPrevented) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
      event.preventDefault()
      navigate(to)
    }}
  >{children}</a>
}
