import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import MainLayout from "./components/layout/MainLayout"
import Login from "./components/auth/Login"
import Operation from "./components/pages/Operation"
import Dashboard from "./components/pages/Dashboard"
import Setup from "./components/pages/Setup"
import Requests from "./components/pages/Requests"


const router = createBrowserRouter(createRoutesFromElements(
  <Route>
    <Route path="/login" element={<Login />} />

    <Route element={<ProtectedRoute />} >
      <Route element={<MainLayout />}>

        <Route path="/" element={<Dashboard />}/>
        <Route path="/setup" element={<Setup />} /> 
        <Route path="/operation" element={<Operation />}/> 
        <Route path="/users" />
        <Route path="/verification" />
        <Route path="/requests" element={<Requests />}/> 
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
