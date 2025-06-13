
import { useState } from "react"
import { useNavigate } from "react-router"
import Loading from "../props/Loading"
import { login } from "./endpoints"
import Buttons from "../props/Buttons"
import { Inputss } from "../props/Formss"
import ReCAPTCHA from "react-google-recaptcha"

const Login = () => {

  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const navigate = useNavigate()

  const resetForm = () => {
    setUsername('')
    setPassword('')
    setErrorMessage('')
    setRecaptchaToken(null)
  }

  const toggleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!recaptchaToken) {
      setErrorMessage("Please complete the CAPTCHA verification.");
      return;
    }

    try {
      setLoading(true)
      await login({
        username,
        password,
        recaptchaToken,
      })
      resetForm()
      navigate('/')
    } catch (error: any) {
      if (error.response && (error.response.status === 401 || error.response.status === 400)) {
          setErrorMessage('Invalid username or password.');
        } else if (error.response) {
          setErrorMessage('A server error occurred. Please try again later or contact an administrator.');
        } else {
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

            <Inputss type="text" placeholder="Enter Username"
              label="Username" 
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              required={true}
              className="border py-1 px-2 rounded-md" 
              />
          </div>

          <div className="grid grid-row-2 gap-2">

            <Inputss type="password" placeholder="Enter password"
              label="Password" 
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required={true}
              className="border py-1 px-2 rounded-md" 
            />
          </div>

          <ReCAPTCHA 
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token: any) => setRecaptchaToken(token)}
            onExpired={() => setRecaptchaToken(null)}
            className="mx-auto"
          />

          {errorMessage && <span className="text-red-500 text-md">{errorMessage}</span>}

          <Buttons type="submit">Login</Buttons>

          <span className="text-sm text-amber-950 cursor-pointer" onClick={toggleResetPassword}>
            Forgot password?
          </span>

        </form>

      </div>

      {loading && <Loading />}
      
    </div>

  )
}

export default Login
