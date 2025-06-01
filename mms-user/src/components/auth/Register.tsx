import React, { useState } from "react"
import { Link, useNavigate } from "react-router"
import Loading from "../props/Loading"
import { register } from "./endpoints"
import Buttons from "../props/Buttons"
import { Inputss } from "../props/Formss"


const Register = () => {

  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [ic, setIc] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [referredBy, setReferredBy] = useState<string>('')

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const navigate = useNavigate()

  const toggleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const validatePassword = (pass: string) => {
      if (pass.length < 8) {
        return setErrorMessage('Password must be at least 8 characters')
      } else if (!/[A-Z]/.test(pass)) {
        return setErrorMessage('Password must contain at least 1 uppercase letter')
      } else if (!/[a-z]/.test(pass)) {
        return setErrorMessage('Password must contain at least 1 lowercase letter')
      } else if (!/[0-9]/.test(pass)) {
        return setErrorMessage('Password must contain at least 1 number')
      } else if (pass !== confirmPassword) {
        return setErrorMessage('Password does not match')
      }
      return null
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return passwordError
    }
    try {
      setLoading(true)
      await register({
        username, 
        email, 
        ic, 
        password,
        referredBy,
        firstName,
        lastName
      })
      alert('User successfully register')
      navigate('/login')
    } catch (error: any) {
      console.error(error.message)
      console.error(error.request)
      if (error.response && error.response.status === 400) {
        setErrorMessage('User already exist')
      } else if (error.response && error.response.status === 404) {
        setErrorMessage('Network error. Please contact administrator')
      } else {
        setErrorMessage('Server error. Please contact administrator')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen justify-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="font-bold text-xl">Register</h1>
        <form className="grid grid-row-3 gap-5 p-5 shadow-xl shadow-red-300" onSubmit={toggleRegister}>

          <Inputss 
            type="text"
            placeholder="Enter referral ID"
            onChange={(e) => setReferredBy(e.target.value)}
            value={referredBy}
            label="Refferal ID"
            required={true}
          />

          <Inputss 
            type="text"
            placeholder="Enter username"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            label="Username"
            required={true}
          />

          <Inputss 
            type="text"
            placeholder="Enter first name"
            onChange={(e) => setFirstName(e.target.value)}
            value={firstName}
            label="First Name"
            required={true}
          />
          
          <Inputss 
            type="text"
            placeholder="Enter last name"
            onChange={(e) => setLastName(e.target.value)}
            value={lastName}
            label="Last Name"
            required={true}
          />  

          <Inputss 
            type="email"
            placeholder="Enter email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            label="Email"
            required={true}
          />
          
          <Inputss 
            type="number"
            placeholder="Enter I/C"
            onChange={(e) => setIc(e.target.value)}
            value={ic}
            label="I/C"
            required={true}
            maxLength={12}
          />

          <Inputss 
            type="password"
            placeholder="Enter password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            label="Password"
            required={true}
          />
          
          <Inputss 
            type="password"
            placeholder="Confirm password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            value={confirmPassword}
            label="Confirm Password"
            required={true}
          />

          {errorMessage && <span className="text-red-500 text-md">{errorMessage}</span>}

          <Buttons type="submit">Register</Buttons>     
          
          <span>
            Already have an account? <Link to={'/login'} className="text-blue-400 text-md">Go to Login</Link>
          </span>
        </form>
      </div>

      {loading && <Loading />}
    </div>
  )
}

export default Register
