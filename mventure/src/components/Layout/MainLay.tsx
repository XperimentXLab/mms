import { Outlet } from "react-router-dom"
import Navigation from "./Navigation"
import Footer from "./Footer"


const MainLay = () => {
  return (
    <div className="relative min-h-full text-lg">

      <Navigation />

      <div className="min-h-screen p-2 pt-9">
        <Outlet />
      </div>

      <Footer />

    </div>
  )
}

export default MainLay
