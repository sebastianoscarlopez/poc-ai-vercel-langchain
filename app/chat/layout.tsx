import { PropsWithChildren } from 'react'

const Layout = ({ children }: PropsWithChildren) => (
  <div className="p-16 bg-slate-700 h-screen">{children}</div>
)

export default Layout
