import { NavLink } from "react-router-dom"


const Navigation = () => {
  return (
    <div className="fixed w-full z-30 bg-amber-50">
      <div className="flex justify-between py-1 px-3 bg-gradient-to-tr from-red-500 to-indigo-500 border border-blue-950 bg- m-1 rounded-xl text-md md:text-xl">
        <h1>Logo</h1>
        <nav className="flex gap-3 items-center justify-center ">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/join">Join Us</NavLink>
          <NavLink to="/performance">Performance</NavLink>
          
        </nav>
      </div>
    </div>
  )
}

export default Navigation
