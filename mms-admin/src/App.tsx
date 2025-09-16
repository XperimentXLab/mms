import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import { lazy, Suspense } from "react"
import Loading from "./components/props/Loading"

const Login = lazy(() => import("./components/auth/Login"))
const MainLayout = lazy(() => import("./components/layout/MainLayout"))
const Operation = lazy(() => import("./components/pages/Operation"))
const Dashboard = lazy(() => import("./components/pages/Dashboard"))
const Setup = lazy(() => import("./components/pages/Setup"))
const AssetRequest = lazy(() => import("./components/pages/AssetRequest"))
const User = lazy(() => import("./components/pages/User"))
const Verifications = lazy(() => import("./components/pages/Verifications"))
const Transactionss = lazy(() => import("./components/pages/Transactionss"))
const WithdrawReq = lazy(() => import("./components/pages/WithdrawReq"))


const router = createBrowserRouter(createRoutesFromElements(
  <Route>
    <Route path="/login" element={<Login />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>

        <Route path="/" element={<Dashboard />}/>
        <Route path="/setup" element={<Setup />} /> 
        <Route path="/operation" element={<Operation />}/> 
        <Route path="/users" element={<User />} />
        <Route path="/verification" element={<Verifications />} />
        <Route path="/asset/requests" element={<AssetRequest />}/> 
        <Route path="/withdraw/requests" element={<WithdrawReq />} /> 
        <Route path="/transaction" element={<Transactionss />} /> 

      </Route>

    </Route>

  </Route>
))

function App() {

  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

export default App
