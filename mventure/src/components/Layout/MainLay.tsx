import { Outlet } from "react-router-dom"
import Navigation from "./Navigation"


const MainLay = () => {
  return (
    <div>
      <h1>Main Layout</h1>

      <Navigation />

      <Outlet />
    </div>
  )
}

export default MainLay
