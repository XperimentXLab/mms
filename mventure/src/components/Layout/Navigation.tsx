import { NavLink } from "react-router-dom"


const Navigation = () => {
  return (
    <div className="fixed w-full z-30 bg-amber-50">
      <div className="flex justify-between py-1 px-3 bg-blue-500 m-1 rounded-xl">
        <h1>Logo</h1>
        <nav className="flex gap-3 items-center justify-center">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/join">Join Us</NavLink>
          <NavLink to="/performance">Performance</NavLink>
          
        </nav>
      </div>
    </div>
  )
}

export default Navigation
