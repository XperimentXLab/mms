import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom"
import { lazy } from "react"


const MainLay = lazy(()=> import("./components/Layout/MainLay"))
const Home = lazy(()=> import("./components/Home/Home"))


const router = createBrowserRouter(createRoutesFromElements(
    <Route>
      <Route path="/" element={<MainLay />}>
        <Route index element={<Home />} />
      </Route>
    </Route>
))


function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App
