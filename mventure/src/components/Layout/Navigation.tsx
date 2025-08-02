import { NavLink } from "react-router-dom"


const Navigation = () => {
  return (
    <div>
      <h1>Navigation</h1>
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </nav>
    </div>
  )
}

export default Navigation
