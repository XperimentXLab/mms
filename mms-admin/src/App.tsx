import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import MainLayout from "./components/layout/MainLayout"
import Login from "./components/auth/Login"
import Operation from "./components/pages/Operation"
import Dashboard from "./components/pages/Dashboard"
import Setup from "./components/pages/Setup"
import AssetRequest from "./components/pages/AssetRequest"
import User from "./components/pages/User"
import Verifications from "./components/pages/Verifications"
import Transactionss from "./components/pages/Transactionss"



const router = createBrowserRouter(createRoutesFromElements(
  <Route>
    <Route path="/login" element={<Login />} />

    <Route element={<ProtectedRoute />} >
      <Route element={<MainLayout />}>

        <Route path="/" element={<Dashboard />}/>
        <Route path="/setup" element={<Setup />} /> 
        <Route path="/operation" element={<Operation />}/> 
        <Route path="/users" element={<User />} />
        <Route path="/verification" element={<Verifications />} />
        <Route path="/asset/requests" element={<AssetRequest />}/> 
        <Route path="/withdraw/requests" /> 
        <Route path="/transaction" element={<Transactionss />} /> 

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
