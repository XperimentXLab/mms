import { useState } from "react"
import { useNavigate, useParams } from "react-router"

const ResetPasswordConfirm = () => {

  const navigate = useNavigate()

  const [password, setPassword] = useState<string>('')
  const [password2, setPassword2] = useState<string>('')

  const { uidb64, token } = useParams<{ uidb64: string, token: string }>()

  const toggleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (uidb64 && token) {
      try {
        //await reset_password_confirm ({
        //  uidb64: uidb64,
        //  token: token,
        //  password, 
        //  password2
        //})
        alert('Password reset successfully')
        navigate('/login')
      } catch (error: any) {
        console.error(error)
      }
    }
  }

  return (
    <div className="flex flex-col justify-center items-center gap-2 p-2">
      <span className="font-bold text-xl">Reset Passsword</span>
      <form onSubmit={toggleSubmit} className="grid grid-cols-1 items-center justify-center gap-2">
        <label>Please fill in</label>
        <input type="password" placeholder="Enter password"
          className="border py-1 px-2 rounded-md"
          onChange={e => setPassword(e.target.value)}
          value={password}
        />
        <input type="password" placeholder="Confirm password" 
          className="border py-1 px-2 rounded-md"
          onChange={e => setPassword2(e.target.value)}
          value={password2}
        />
        <button type="submit" className="bg-black text-white active:bg-amber-300 active:text-white hover:bg-amber-300 hover:text-white
         hover:cursor-pointer py-1 px-2 rounded-md">Submit</button>
      </form>
    </div>
  )
}

export default ResetPasswordConfirm
