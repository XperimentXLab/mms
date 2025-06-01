import { NavLinkss } from "../props/theLinks"


const NotFound = () => {
  return (
    <div>
      <span>Sorry, pages you looking for not found!</span>
      <NavLinkss to="/">Go Home</NavLinkss>
    </div>
  )
}

export default NotFound
