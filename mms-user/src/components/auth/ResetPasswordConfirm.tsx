import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { reset_password_confirm } from "./endpoints"
import { Inputss } from "../props/Formss"
import Buttons from "../props/Buttons"
import Loading from "../props/Loading"
import { InfoPassword } from "../props/Info";
import { NotiErrorAlert, NotiSuccessAlert } from "../props/Noti"

const ResetPasswordConfirm = () => {

  const navigate = useNavigate()

  const [password, setPassword] = useState<string>('')
  const [password2, setPassword2] = useState<string>('')

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const { uidb64, token } = useParams<{ uidb64: string, token: string }>()

  const toggleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const validatePassword = (password: string, password2: string): string | null => {
      if (!password || !password2) return 'All fields are required'
      if (password.length < 8) return 'Password must be at least 8 characters'
      if (!/[A-Z]/.test(password)) return 'Password must contain at least 1 uppercase letter'
      if (!/[a-z]/.test(password)) return 'Password must contain at least 1 lowercase letter'
      if (!/[0-9]/.test(password)) return 'Password must contain at least 1 number'
      if (password !== password2) return 'Passwords do not match'
      return null
    }
    const error: any = validatePassword(password, password2)
    if (error) {
      setErrorMessage(error)
      return
    }

    if (uidb64 && token) {

      try {
        setLoading(true)
        await reset_password_confirm ({
          uidb64: uidb64,
          token: token,
          password, 
          password2
        })
        NotiSuccessAlert('Password reset successfully')
        navigate('/login')
      } catch (error: any) {
        console.error(error)
        NotiErrorAlert('Error resetting password. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen justify-center">
      {loading && <Loading />}
      <div className="flex flex-col justify-center items-center gap-2 p-4">
        
        <span className="font-bold text-xl">Reset Passsword</span>

        <form onSubmit={toggleSubmit} className="grid grid-row-3 items-center justify-center gap-2 p-3 rounded-xl shadow-xl shadow-red-300">

          <div className="grid grid-row-2 gap-2">
            <Inputss type="password" placeholder="Enter password"
              label="New Password"
              onChange={e => setPassword(e.target.value)}
              value={password}
              required={true}
            />
          </div>

          <div className="grid grid-row-2 gap-2">
            <Inputss type="password" placeholder="Confirm password" 
              label="Confirm Password"
              onChange={e => setPassword2(e.target.value)}
              value={password2}
              required={true}
            />
          </div>

          {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

          <Buttons type="submit" >Submit</Buttons>

        </form>
        <InfoPassword />
      </div>
    </div>
  )
}

export default ResetPasswordConfirm
