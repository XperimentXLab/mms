import { Link } from "react-router-dom"

interface NavLinkssProps {
  children: React.ReactNode
  to: string
  className?: string
}

export const NavLinkss: React.FC<NavLinkssProps> = ({
  to, className, children
}) => {
  return (
    <Link to={to} className={`hover:bg-black hover:text-white active:bg-black active:text-white py-1 px-3 rounded-lg ${className}`}>{children}</Link>
  )
}