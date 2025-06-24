import { NavLink } from "react-router-dom"

interface NavLinkssProps {
  children: React.ReactNode
  to: string
  className?: string
  onClick?: () => void
}

export const NavLinkss: React.FC<NavLinkssProps> = ({
  to, className, children, onClick
}) => {
  return (
    <NavLink end to={to} onClick={onClick} className={({isActive}) => isActive ? `hover:bg-black hover:text-white active:bg-black active:text-white py-1 px-3 rounded-lg bg-black text-white ${className}` : `hover:bg-black  hover:text-white active:bg-black active:text-white py-1 px-3 rounded-lg ${className}`}>{children}</NavLink>
  )
}