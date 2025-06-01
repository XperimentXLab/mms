
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import Loading from "../props/Loading"
import { login } from "./endpoints"
import Buttons from "../props/Buttons"

const Login = () => {

  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const navigate = useNavigate()

  const resetForm = () => {
    setUsername('')
    setPassword('')
    setErrorMessage('')
  }

  const toggleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      await login({
        username,
        password
      })
      resetForm()
      navigate('/')
    } catch (error: any) {
      if (error.response && (error.response.status === 401 || error.response.status === 400)) {
          // This is likely an authentication failure (e.g., wrong credentials, bad request for auth)
          // Use the backend's detail message if available, otherwise the generic one
          setErrorMessage(error.response.data?.detail || 'Invalid username or password.');
        } else if (error.response) {
          // Other errors from the server (e.g., 500, 403, 404)
          setErrorMessage('A server error occurred. Please try again later or contact an administrator.');
        } else {
          // Network errors or other Axios errors where no response was received
          setErrorMessage('Network error. Please check your connection or contact an administrator.');
        }
    } finally {
      setLoading(false)
    }
  }

  const toggleResetPassword = async () => {
    navigate('/forgot-password/')
  }

  return (
    <div className="flex min-h-screen justify-center">

      <div className="flex flex-col items-center p-4 justify-center gap-5">
        <h1 className="font-bold text-xl">Login</h1>

        <form className="grid grid-row-3 gap-5 p-5 shadow-xl shadow-red-300" onSubmit={toggleLogin}>
          <div className="grid grid-row-2 gap-2">
            <span>Username</span>
            <input type="text" placeholder="Enter Username" 
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              className="border py-1 px-2 rounded-md" 
              />
          </div>

          <div className="grid grid-row-2 gap-2">
            <span>Password</span>
            <input type="password" placeholder="Enter password" 
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="border py-1 px-2 rounded-md" 
            />
          </div>

          {errorMessage && <span className="text-red-500 text-md">{errorMessage}</span>}

          <Buttons type="submit">Login</Buttons>

          <span className="text-sm text-amber-950 cursor-pointer" onClick={toggleResetPassword}>
            Forgot password?
          </span>

          <span>
            Don't have an account? <Link to={'/register'} className="text-blue-400 text-md">Click to Register</Link>
          </span>

        </form>

      </div>

      {loading && <Loading />}
      
    </div>

  )
}

export default Login
