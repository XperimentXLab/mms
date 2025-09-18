import React, { useState } from "react"
import { reset_password_request } from "./endpoints"
import Buttons from "../props/Buttons"
import { useNavigate } from "react-router-dom"
import { NotiErrorAlert, NotiSuccessAlert } from "../props/Noti"

const ForgotPassword = () => {

  const [email, setEmail] = useState<string>('')

  const navigate = useNavigate()

  const toggleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await reset_password_request(email)
      NotiSuccessAlert('Password reset request has been sent. Please check your email.')
      setEmail('')
    } catch (error: any) {
      console.error(error)
      NotiErrorAlert('Error sending password reset request. Please try again later.')
    }
  }

  const toggleCancel = () => {
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center p-2 gap-2 w-100">
        <span className="font-bold text-xl">Forgot Password</span>
        <form onSubmit={toggleSubmit} className="grid grid-rows-1 w-full items-center gap-3 p-5 shadow-md shadow-red-300 rounded-xl">
          <input type="email" placeholder="Enter email" 
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className="border py-1 px-2 rounded-md" 
          />
          <Buttons type="submit">Submit</Buttons>
          <Buttons type="button" onClick={toggleCancel}>Back to Login</Buttons>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword
