import { useState } from "react"
import { Inputss } from "../props/Formss"
import Loading from "../props/Loading"
import Buttons from "../props/Buttons"
import { putPerformance, setupUser } from "../auth/endpoints"
import dayjs from "dayjs";
import utc from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { SelectMonth, SelectYear } from "../props/DropDown"
dayjs.extend(utc);
dayjs.extend(timezone);


const Setup = () => {

  // Input
  const [userID, setUserID] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [masterAmount, setMasterAmount] = useState<string>('')
  const [profitAmount, setProfitAmount] = useState<string>('')
  const [affiliateAmount, setAffiliateAmount] = useState<string>('')

  const [editTotalDeposit, setEditTotalDeposit] = useState<string>('')
  const [editTotalGainZ, setEditTotalGainZ] = useState<string>('')
  const [editTotalGainA, setEditTotalGainA] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState<string>('')
  const [currentYear, setCurrentYear] = useState<string>('')

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

  const handleDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentMonth || !currentYear) {
      alert("Please select a month and year.");
      return;
    }
    try {
      setLoading(true)
      await putPerformance({
        totalDeposit: Number(editTotalDeposit),
        month: Number(currentMonth),
        year: Number(currentYear)
      })
      alert('Performance updated successfully')
    } catch (error: any) {
      if (error.response && error.response.status === 400 || error.response.status === 401) {
        setErrorMessage(error.response.data.error)
      } else {
        console.log(error)
        alert(error.response.data.error)
      }
    } finally {
      setLoading(false)
      resetForm()
    }
  }
        
        
  const handleGainZ = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentMonth || !currentYear) {
      alert("Please select a month and year.");
      return;
    }
    try {
      setLoading(true)
      await putPerformance({
        totalGainZ: Number(editTotalGainZ),
        month: Number(currentMonth),
        year: Number(currentYear)
      })
      alert('Performance updated successfully')
    } catch (error: any) {
      if (error.response && error.response.status === 400 || error.response.status === 401) {
        setErrorMessage(error.response.data.error)
      } else {
        console.log(error)
        alert(error.response.data.error)
      }
    } finally {
      setLoading(false)
      resetForm()
    }
  }

  const handleGainA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentMonth || !currentYear) {
      alert("Please select a month and year.");
      return;
    }
    try {
      setLoading(true)
      await putPerformance({
        totalGainA: Number(editTotalGainA),
        month: Number(currentMonth),
        year: Number(currentYear)
      })
      alert('Performance updated successfully')
    } catch (error: any) {
      if (error.response && error.response.status === 400 || error.response.status === 401) {
        setErrorMessage(error.response.data.error)
      } else {
        console.log(error)
        alert(error.response.data.error)
      }
    } finally {
      setLoading(false)
      resetForm()
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
    
        <div className="grid grid-cols-2 items-center">
          <SelectMonth value={currentMonth} 
            onChange={(e) => setCurrentMonth(e.target.value)} />
          <SelectYear value={currentYear}
            onChange={(e) => setCurrentYear(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 justify-between w-full">
          <form className="flex flex-row gap-2 items-end justify-center w-full" onSubmit={handleDeposit}>
            <Inputss 
              type="number"
              label="Total Deposit"
              placeholder="Enter amount"
              onChange={e => setEditTotalDeposit(e.target.value)}
              value={editTotalDeposit}
              noNeedPercent={true}
            />
            <Buttons type="submit">Save</Buttons>
          </form>

          <form className="flex flex-row gap-2 items-end justify-center w-full" onSubmit={handleGainZ}>
            <Inputss 
              type="number"
              label="Total Gain Trading Z"
              placeholder="Enter amount"
              onChange={e => setEditTotalGainZ(e.target.value)}
              value={editTotalGainZ}
              noNeedPercent={true}
            />
            <Buttons type="submit">Save</Buttons>
          </form>

          <form className="flex flex-row gap-2 items-end justify-center w-full" onSubmit={handleGainA}>
            <Inputss 
              type="number"
              label="Total Gain Trading A"
              placeholder="Enter amount"
              onChange={e => setEditTotalGainA(e.target.value)}
              value={editTotalGainA}
              noNeedPercent={true}
            />
            <Buttons type="submit">Save</Buttons>
          </form>
        </div>

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
