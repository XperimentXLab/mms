import { NavLinkss } from "../props/theLinks"


const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <span>Sorry, pages you looking for not found!</span>
      <NavLinkss to="/">Go Home</NavLinkss>
    </div>
  )
}

export default NotFound
