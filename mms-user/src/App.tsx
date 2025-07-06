import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom"

import MainLayout from "./components/layout/MainLayout"
import Home from "./components/pages/Home"
import Register from "./components/auth/Register"
import Profile from "./components/pages/Profile"
import Wallet from "./components/pages/Wallet"
import Others from "./components/pages/Others"
import Assets from "./components/pages/Assets"
import Login from "./components/auth/Login"
import ForgotPassword from "./components/auth/ForgotPassword"
import ResetPasswordConfirm from "./components/auth/ResetPasswordConfirm"
import Network from "./components/pages/Network"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import WalletLayout from "./components/layout/WalletLayout"
import AssetLayout from "./components/layout/AssetLayout"
import { AssetStatement, WithdrawalAssetStatement } from "./components/pages/AssetStatement"
import { CommissionStatement, ConvertStatement, ProfitStatement, TransferStatement, WithdrawalWalletStatement } from "./components/pages/WalletStatement"
import NotFound from "./components/pages/NotFound"

//import Updating from "./components/auth/Updating"

function App() {

  const router = createBrowserRouter(createRoutesFromElements(
    <Route>
      
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

      {/*<Route path="*" element={<Updating />} />*/}
      
    </Route>
  ))

  return (
    <RouterProvider router={router} />
  )
}

export default App
