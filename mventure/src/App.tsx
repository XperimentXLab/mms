import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom"
import { lazy } from "react"


const MainLay = lazy(()=> import("./components/Layout/MainLay"))
const Home = lazy(()=> import("./components/Home/Home"))
const PerformP = lazy(()=> import("./components/Perfomance/PerformP"))
const JoinUs = lazy(()=> import("./components/Join/JoinUs"))
const ContactUs = lazy(()=> import("./components/Contact/ContactUs"))
const FAQs = lazy(()=> import("./components/FAQ/FAQs"))
const AboutUs = lazy(()=> import("./components/About/AboutUs"))


const router = createBrowserRouter(createRoutesFromElements(
    <Route>
      <Route path="/" element={<MainLay />}>
        <Route index element={<Home />} />
        <Route path="join" element={<JoinUs />} />
        <Route path="performance" element={<PerformP />} />
        <Route path="about" element={<AboutUs />} />
        <Route path="contact" element={<ContactUs />} />
        <Route path="faqs" element={<FAQs />} />
      </Route>
    </Route>
))


function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App
