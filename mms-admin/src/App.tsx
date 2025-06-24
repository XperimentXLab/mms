import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import MainLayout from "./components/layout/MainLayout"
import Login from "./components/auth/Login"
import Operation from "./components/pages/Operation"


const router = createBrowserRouter(createRoutesFromElements(
  <Route>
    <Route path="/login" element={<Login />} />

    <Route element={<ProtectedRoute />} >
      <Route element={<MainLayout />}>

        <Route path="/" /> {/*Dashboard*/ }
        <Route path="/setup" /> 
        <Route path="/operation" element={<Operation />}/> 
        <Route path="/users" />
        <Route path="/verification" />
        <Route path="/requests" /> 
        <Route path="/transaction" /> 

      </Route>

    </Route>

  </Route>
))

function App() {

  return (
    <RouterProvider router={router} />
  )
}

export default App
