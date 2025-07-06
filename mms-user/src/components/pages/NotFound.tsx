import { NavLinkss } from "../props/theLinks"


const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center p-10">
      <span>Sorry, pages you looking for not found!</span>
      <NavLinkss to="/"
        className="px-3 py-2 border hover:bg-black active:bg-black hover:text-white active:text-white rounded-xl"
      >Go Home</NavLinkss>
    </div>
  )
}

export default NotFound
