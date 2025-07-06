import { useEffect, useState } from "react"
import { Inputss, InputwithVal } from "../props/Formss"
import Loading from "../props/Loading"
import Buttons from "../props/Buttons"
import { getPerformance, putPerformance, setupUser } from "../auth/endpoints"
import dayjs from "dayjs";
import utc from "dayjs";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);


const Setup = () => {

  // Input
  const [userID, setUserID] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [masterAmount, setMasterAmount] = useState<string>('')
  const [profitAmount, setProfitAmount] = useState<string>('')
  const [affiliateAmount, setAffiliateAmount] = useState<string>('')

  const [totalDeposit, setTotalDeposit] = useState<number>(0)
  const [editTotalDeposit, setEditTotalDeposit] = useState<number>(0)
  const [totalGainZ, setTotalGainZ] = useState<number>(0)
  const [editTotalGainZ, setEditTotalGainZ] = useState<number>(0)
  const [totalGainA, setTotalGainA] = useState<number>(0)
  const [editTotalGainA, setEditTotalGainA] = useState<number>(0)

  const [errorMessage, setErrorMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const [date, setDate] = useState<string>('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const resPerformance = await getPerformance()
      setTotalDeposit(resPerformance.total_deposit)
      setTotalGainZ(resPerformance.total_gain_z)
      setTotalGainA(resPerformance.total_gain_a)

      const formattedDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
      setDate(formattedDate);
      
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

  useEffect(() => {
    fetchData()
  }, [])

  const toggleSetupUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      await setupUser({
        userID,
        username,
        masterAmount: Number(masterAmount),
        profitAmount: Number(profitAmount),
        affiliateAmount: Number(affiliateAmount)
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

  const resetForm = () => {
    setUserID('')
    setUsername('')
    setMasterAmount('')
    setProfitAmount('')
    setAffiliateAmount('')
    setEditTotalDeposit(0)
    setEditTotalGainA(0)
    setEditTotalGainZ(0)
  }

  const handlePlus = async () => {
    try {
      setLoading(true)
      await putPerformance({
        totalDeposit: editTotalDeposit,
        totalGainZ: editTotalGainZ,
        totalGainA: editTotalGainA,
        mode: 'plus'
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
      resetForm()
      fetchData()
    }
  }

  const handleMinus = async () => {
    try {
      setLoading(true)
      await putPerformance({
        totalDeposit: editTotalDeposit,
        totalGainZ: editTotalGainZ,
        totalGainA: editTotalGainA,
        mode: 'minus'
      })
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
      resetForm()
      fetchData()
    }
  }

  /*
  const handleResetAllWallet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      await resetAllWalletBalances()
      alert('All wallet successfully reset')
    } catch (error: any) {
      console.error(error.response)
    } finally {
      setLoading(false)
    }
  }*/

  return (
    <div className="flex flex-col items-center justify-center m-5 gap-3">

      {loading && <Loading />}

      <div className="flex flex-col justify-center gap-2 bg-white p-3 w-full rounded-xl">
        <span>Last Updated: {date}</span>

        <InputwithVal 
          type="number"
          label="Total Deposit"
          placeholder="Enter amount"
          onChange={e => setEditTotalDeposit(Number(e.target.value))}
          value={String(editTotalDeposit)}
          currentValue={totalDeposit}
          noNeedPercent={true}
        />
        <InputwithVal 
          type="number"
          label="Total Gain Trading Z"
          placeholder="Enter amount"
          onChange={e => setEditTotalGainZ(Number(e.target.value))}
          value={String(editTotalGainZ)}
          currentValue={totalGainZ}
          noNeedPercent={true}
        />
        <InputwithVal 
          type="number"
          label="Total Gain Trading A"
          placeholder="Enter amount"
          onChange={e => setEditTotalGainA(Number(e.target.value))}
          value={String(editTotalGainA)}
          currentValue={totalGainA}
          noNeedPercent={true}
        />
        <Buttons type="button" onClick={handlePlus}>Plus</Buttons>
        <Buttons type="button" onClick={handleMinus}>Minus</Buttons>

      </div>

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
        
        <Inputss label="Register Point" placeholder="Enter RP amount"
          type="text" 
          onChange={e => setMasterAmount(e.target.value)}
          value={masterAmount}
        />

        <Inputss label="Profit" placeholder="Enter profit amount"
          type="text" 
          onChange={e => setProfitAmount(e.target.value)}
          value={profitAmount}
        />

        <Inputss label="Affiliate" placeholder="Enter affiliate bonus amount"
          type="text" 
          onChange={e => setAffiliateAmount(e.target.value)}
          value={affiliateAmount}  
        />

        <Buttons type="submit">Submit</Buttons>
      </form>

      {/*
      <form onSubmit={handleResetAllWallet}>
        <Buttons type='submit'>Reset All Wallet Balance</Buttons>
      </form>
      */}

    </div>
  )
}

export default Setup
