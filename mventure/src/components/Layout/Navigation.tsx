import { NavLink } from "react-router-dom"


const Navigation = () => {
  return (
    <div className="fixed max-w-screen z-30 bg-amber-50">
      <div className="flex justify-between py-2 md:py-3 px-3 bg-gradient-to-tl from-red-500 to-purple-400 via-black text-white bg- m-1 rounded-xl text-md md:text-xl">
        <h1>Logo</h1>
        <nav className="flex gap-4 items-center justify-center font-['Montserrat_Alternates'] ">
          <NavLink to="/" className={"hover:text-amber-500"}>Home</NavLink>
          <NavLink to="/join" className={"hover:text-amber-500"}>Join Us</NavLink>
          <NavLink to="/performance" className={"hover:text-amber-500"}>Performance</NavLink>
          
        </nav>
      </div>
    </div>
  )
}

export default Navigation
