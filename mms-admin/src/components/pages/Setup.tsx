import { useState } from "react"
import { Inputss } from "../props/Formss"
import Loading from "../props/Loading"
import Buttons from "../props/Buttons"
import { setupUser } from "../auth/endpoints"


const Setup = () => {

  // Input
  const [userID, setUserID] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [masterAmount, setMasterAmount] = useState<string>('')
  const [profitAmount, setProfitAmount] = useState<string>('')
  const [commissionAmount, setCommissionAmount] = useState<string>('')


  const [errorMessage, setErrorMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const toggleSetupUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      await setupUser({
        userID,
        username,
        masterAmount: Number(masterAmount),
        profitAmount: Number(profitAmount),
        commissionAmount: Number(commissionAmount)
      })
      alert('User setup success !')
    } catch (error: any) {
      if (error.response && error.response.status === 500) {
        setErrorMessage('An unexpected error occurred. Please try again later.');
      } else {
        setErrorMessage(error.response.data.error)
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="flex flex-col items-center justify-center m-5 gap-3">

      {loading && <Loading />}

      <form onSubmit={toggleSetupUser} className="grid grid-cols-1 gap-3 items-center w-full p-4 border rounded-xl shadow-md bg-white shadow-red-800">        
        <span className="font-semibold">Setup User Master Wallet</span>

        {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span>}

        <Inputss label="User ID *" placeholder="Enter user id"
          type="text" 
          onChange={e => setUserID(e.target.value)}
          value={userID}
          required={true}
        />
        
        <Inputss label="Username *" placeholder="Enter username"
          type="text" 
          onChange={e => setUsername(e.target.value)}
          value={username}
          required={true}
        />
        
        <Inputss label="Master Point" placeholder="Enter master point"
          type="text" 
          onChange={e => setMasterAmount(e.target.value)}
          value={masterAmount}
        />

        <Inputss label="Profit" placeholder="Enter profit amount"
          type="text" 
          onChange={e => setProfitAmount(e.target.value)}
          value={profitAmount}
        />

        <Inputss label="Commission" placeholder="Enter commission amount"
          type="text" 
          onChange={e => setCommissionAmount(e.target.value)}
          value={commissionAmount}  
        />

        <Buttons type="submit">Submit</Buttons>
      </form>


    </div>
  )
}

export default Setup
