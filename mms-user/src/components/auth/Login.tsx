
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import Loading from "../props/Loading"
import supabase from "./supabase"
import { verifyWithDjango } from "./endpoints"

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
      await supabase.auth.signInWithPassword({
        email: username,
        password
      })

      // Send the token to your Django backend for verification
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setErrorMessage('No user found. Please register or try again.');
        setLoading(false);
        return;
      }
      await verifyWithDjango(session.access_token)

      setLoading(true)
      console.log(`Login successful.`);
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

          <button type="submit" className="bg-black text-white active:bg-amber-300 active:text-black hover:bg-amber-300 hover:text-black hover:cursor-pointer py-2 px-3 rounded-lg font-bold">Login</button>

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
