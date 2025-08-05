import { Outlet } from "react-router-dom"
import Navigation from "./Navigation"
import Footer from "./Footer"


const MainLay = () => {
  return (
    <div className="relative min-h-screen">

      <Navigation />

      <Outlet />


      <Footer />

    </div>
  )
}

export default MainLay
