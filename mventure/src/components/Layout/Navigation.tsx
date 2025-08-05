import { NavLink } from "react-router-dom"


const Navigation = () => {
  return (
    <div className="flex justify-between py-1 px-3 bg-blue-500 m-1 rounded-xl">
      <h1>Logo</h1>
      <nav className="flex gap-3">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/services">Services</NavLink>
        <NavLink to="/performance">Performance</NavLink>
        
      </nav>
    </div>
  )
}

export default Navigation
