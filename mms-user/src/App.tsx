import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import { lazy, Suspense } from "react"
import Loading from "./components/props/Loading"

import Updating from "./components/auth/Updating"

/*
const MainLayout = lazy(() => import("./components/layout/MainLayout"))
const Home = lazy(() => import("./components/pages/Home"))
const Register = lazy(() => import("./components/auth/Register"))
const Profile = lazy(() => import("./components/pages/Profile"))
const Wallet = lazy(() => import("./components/pages/Wallet"))
const Others = lazy(() => import("./components/pages/Others"))
const Assets = lazy(() => import("./components/pages/Assets"))
const Login = lazy(() => import("./components/auth/Login"))
const ForgotPassword = lazy(() => import("./components/auth/ForgotPassword"))
const ResetPasswordConfirm = lazy(() => import("./components/auth/ResetPasswordConfirm"))
const Network = lazy(() => import("./components/pages/Network"))
const WalletLayout = lazy(() => import("./components/layout/WalletLayout"))
const AssetLayout = lazy(() => import("./components/layout/AssetLayout"))
const NotFound = lazy(() => import("./components/pages/NotFound"))

const AssetStatement = lazy(() => import('./components/pages/AssetStatement').then(m => ({ default: m.AssetStatement })))
const WithdrawalAssetStatement = lazy(() => import('./components/pages/AssetStatement').then(m => ({ default: m.WithdrawalAssetStatement })))

const CommissionStatement = lazy(() => import('./components/pages/WalletStatement').then(m => ({ default: m.CommissionStatement })))
const ConvertStatement = lazy(() => import('./components/pages/WalletStatement').then(m => ({ default: m.ConvertStatement })))
const ProfitStatement = lazy(() => import('./components/pages/WalletStatement').then(m => ({ default: m.ProfitStatement })))
const TransferStatement = lazy(() => import('./components/pages/WalletStatement').then(m => ({ default: m.TransferStatement })))
const WithdrawalWalletStatement = lazy(() => import('./components/pages/WalletStatement').then(m => ({ default: m.WithdrawalWalletStatement })))

*/


function App() {

  const router = createBrowserRouter(createRoutesFromElements(
    <Route>
      {/*
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />} >
          <Route index element={<Home />} />
          <Route path="profile" element={
            <Profile />
          } />

          <Route path='wallet' element={
            <WalletLayout />
          }>
            <Route index element={
              <Wallet />
            } />
            <Route path="statement" >
              <Route path="profit" element={<ProfitStatement />} />
              <Route path="commission" element={<CommissionStatement />} />
              <Route path="transfer" element={<TransferStatement />} />
              <Route path="convert" element={<ConvertStatement />} />
              <Route path="withdrawal" element={<WithdrawalWalletStatement />} />
            </Route>
          </Route>

          <Route path="asset" element={
            <AssetLayout />
          } >
            <Route index element={
              <Assets />
            } />
            <Route path="statement">
              <Route index 
                element={<AssetStatement />}
              />
              <Route path="withdrawal" element={
                <WithdrawalAssetStatement />} 
                />
            </Route>
          </Route>

          <Route path="network" element={
            <Network />
          } />
          <Route path="others" element={
            <Others />
          } />
        </Route>
      </Route>

      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />

      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route 
        path="/reset-password-confirm/:uidb64/:token" 
        element={<ResetPasswordConfirm />} 
      />
      
      <Route path="*" element={<NotFound />} />
*/}
      <Route path="*" element={<Updating />} />
      
    </Route>
  ))

  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

export default App
