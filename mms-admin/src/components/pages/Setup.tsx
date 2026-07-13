import { useEffect, useState } from "react"
import { Inputss } from "../props/Formss"
import Loading from "../props/Loading"
import Buttons from "../props/Buttons"
import { getRemoveWelcomeBonusCount, getUserInfo, getWithdrawalWindow, putPerformance, removeWelcomeBonus, setupUser, updateUserInfo, updateWithdrawalWindow } from "../auth/endpoints"
import dayjs from "dayjs";
import utc from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { SelectMonth, SelectYear } from "../props/DropDown"
import { FixedText } from "../props/Textt"
import { NotiErrorAlert, NotiSuccessAlert } from "../props/Noti"
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

  const [userUsername, setUserUsername] = useState<string>('')
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [ic, setIc] = useState<string>('')
  const [editFirstName, setEditFirstName] = useState<string>('')
  const [editLastName, setEditLastName] = useState<string>('')
  const [editIc, setEditIc] = useState<string>('')

  const [searchUserId, setSearchUserID] = useState<string>('')
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
      NotiSuccessAlert('User setup success !')
    } catch (error: any) {
      if (error.response && error.response.status === 500) {
        setErrorMessage('An unexpected error occurred. Please try again later.')
        NotiErrorAlert('An unexpected error occurred. Please try again later.')
      } else {
        setErrorMessage(error.response.data.error)
        NotiErrorAlert(error.response.data.error)
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
    setEditTotalDeposit('')
    setEditTotalGainA('')
    setEditTotalGainZ('')
    setEditFirstName('')
    setEditLastName('')
    setEditIc('')
  }

  const handleDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentMonth || !currentYear) {
      NotiErrorAlert("Please select a month and year.");
      return;
    }
    try {
      setLoading(true)
      await putPerformance({
        totalDeposit: Number(editTotalDeposit),
        month: Number(currentMonth),
        year: Number(currentYear)
      })
      NotiSuccessAlert('Performance updated successfully')
    } catch (error: any) {
      if (error.response && error.response.status === 400 || error.response.status === 401) {
        setErrorMessage(error.response.data.error)
      } else {
        console.log(error)
        NotiErrorAlert(error.response.data.error)
      }
    } finally {
      setLoading(false)
      resetForm()
    }
  }
        
        
  const handleGainZ = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentMonth || !currentYear) {
      NotiErrorAlert("Please select a month and year.");
      return;
    }
    try {
      setLoading(true)
      await putPerformance({
        totalGainZ: Number(editTotalGainZ),
        month: Number(currentMonth),
        year: Number(currentYear)
      })
      NotiSuccessAlert('Performance updated successfully')
    } catch (error: any) {
      if (error.response && error.response.status === 400 || error.response.status === 401) {
        setErrorMessage(error.response.data.error)
      } else {
        console.log(error)
        NotiErrorAlert(error.response.data.error)
      }
    } finally {
      setLoading(false)
      resetForm()
    }
  }

  const handleGainA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!currentMonth || !currentYear) {
      NotiErrorAlert("Please select a month and year.");
      return;
    }
    try {
      setLoading(true)
      await putPerformance({
        totalGainA: Number(editTotalGainA),
        month: Number(currentMonth),
        year: Number(currentYear)
      })
      NotiSuccessAlert('Performance updated successfully')
    } catch (error: any) {
      if (error.response && error.response.status === 400 || error.response.status === 401) {
        setErrorMessage(error.response.data.error)
      } else {
        console.log(error)
        NotiErrorAlert(error.response.data.error)
      }
    } finally {
      setLoading(false)
      resetForm()
    }
  }


  const toggleFindUser = async (userID: string) => {
    try {
      setLoading(true)
      const response = await getUserInfo({ userID })
      setUserID(response.user_id)
      setUserUsername(response.username)
      setFirstName(response.first_name)
      setLastName(response.last_name)
      setIc(response.ic)

    } catch (error: any) {
      console.error(error)
      NotiErrorAlert(error.response.data.error)
    } finally {
      setLoading(false)
    }
  }
  const toggleUpdateUserFN = async () => {
    try {
      setLoading(true)
      await updateUserInfo({
        firstName: editFirstName,
        userID: searchUserId
      })
      NotiSuccessAlert('User first name updated successfully')
    } catch (error: any) {
      console.error(error)
      NotiErrorAlert(error.response.data.error)
    } finally {
      setLoading(false)
      resetForm()
    }
  }
    const toggleUpdateUserLN = async () => {
    try {
      setLoading(true)
      await updateUserInfo({
        lastName: editLastName,
        userID: searchUserId
      })
      NotiSuccessAlert('User last name updated successfully')
    } catch (error: any) {
      console.error(error)
      NotiErrorAlert(error.response.data.error)
    } finally {
      setLoading(false)
      resetForm()
    }
  }
    const toggleUpdateUserIC = async () => {
    try {
      setLoading(true)
      console.log(searchUserId)
      await updateUserInfo({
        ic: editIc,
        userID :searchUserId
      })
      NotiSuccessAlert('User I/C updated successfully')
    } catch (error: any) {
      console.error(error)
      NotiErrorAlert(error.response.data.ic)
    } finally {
      setLoading(false)
      resetForm()
    }
  }

  const [expiredWelcomeBonusCount, setExpiredWelcomeBonusCount] = useState<number>(0)
  const [getWdWin, setGetWdWin] = useState<{is_active: boolean, date: string}>({is_active: false, date: ''})
  const on = getWdWin.is_active === true
  const withdrawalDate = getWdWin.date
  const fetchWindow = async ()=>{
    const resStatus = await getWithdrawalWindow()
    setGetWdWin(resStatus)
    const expiredWelcomeBonus = await getRemoveWelcomeBonusCount()
    setExpiredWelcomeBonusCount(expiredWelcomeBonus.message || 0)
  }
  useEffect(()=>{
    fetchWindow()
  },[])
  const withdrawalWindowUpdate = async () => {
    try {
      setLoading(true)
      await updateWithdrawalWindow()
      NotiSuccessAlert('Withdrawal button updated successfully')
      fetchWindow()
    } catch (error: any) {  
      NotiErrorAlert(error.response.data.error)
    } finally {
      setLoading(false)
      fetchWindow()
    }
  }

  const handleRemoveWelcomBonus = async () => {
    try {
      setLoading(true)
      const response = await removeWelcomeBonus()
      NotiSuccessAlert(response.message)
    } catch (error: any) {
      if (error.response && error.response.status === 400 ) {
        if (error.response.data.message) {
          NotiErrorAlert(error.response.data.message)
        } else {
          NotiErrorAlert(error.response.data.error)
        }
      } else {
        NotiErrorAlert('Failed to remove welcome bonus.')
      }
    } finally {
      setLoading(false)
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

      <div className="flex flex-row justify-between items-center gap-3 w-full h-17 p-4 border rounded-xl shadow-md bg-white shadow-blue-800">
        <FixedText label={`Withdrawal Day ${withdrawalDate}`} text={on ? 'ON' : 'OFF'} />
        <div className={`${on ? 'bg-green-400 justify-end' : 'bg-gray-600 justify-start'} transition-transform flex rounded-full flex-1/7 h-full border`}>
          <button 
            onClick={withdrawalWindowUpdate}
            className={`cursor-pointer rounded-full w-1/2 h-full border bg-white`}
          />
        </div>
      </div>

      <div className="flex flex-col justify-center gap-2 bg-white p-3 w-full rounded-xl shadow-blue-800">
    
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

      <form onSubmit={toggleSetupUser} className="grid grid-cols-1 gap-3 items-center w-full p-4 border rounded-xl shadow-md bg-white shadow-blue-800">        
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

      <div className="grid grid-cols-1 gap-3 items-center w-full p-4 border rounded-xl shadow-md bg-white shadow-blue-800">
        <span className="font-semibold">Update User Info</span>
        <Inputss label="User ID *" placeholder="Enter user"
          type="text"
          onChange={e => setSearchUserID(e.target.value)}
          value={searchUserId}
          required={true}
        />
        <FixedText label="Username" text={userUsername} />
        <FixedText label="First Name" text={firstName} />
        <FixedText label="Last Name" text={lastName} />
        <FixedText label="IC" text={ic} />
        <Buttons type="button" onClick={()=>toggleFindUser(searchUserId)}>Find</Buttons>

        <div className="flex flex-row gap-2 items-end justify-center w-full">
          <Inputss label="First Name" placeholder="Enter first name"
            type="text" 
            onChange={e => setEditFirstName(e.target.value)}
            value={editFirstName}
          />
          <Buttons type="button" onClick={()=>toggleUpdateUserFN()}>Save</Buttons>
        </div>

        <div className="flex flex-row gap-2 items-end justify-center w-full">
          <Inputss label="Last Name" placeholder="Enter last name"
            type="text" 
            onChange={e => setEditLastName(e.target.value)}
            value={editLastName}
          />
          <Buttons type="button" onClick={()=>toggleUpdateUserLN()}>Save</Buttons>
        </div>

        <div className="flex flex-row gap-2 items-end justify-center w-full">
          <Inputss label="IC" placeholder="Enter ic"
            type="text" 
            onChange={e => setEditIc(e.target.value)}
            value={editIc}
          />
          <Buttons type="button" onClick={()=>toggleUpdateUserIC()}>Save</Buttons>
        </div>
      </div>

      <div className="flex flex-row justify-between gap-3 items-center w-full p-4 border rounded-xl shadow-md bg-white shadow-red-800">
        <FixedText label="Users with Expired Welcome Bonus" text={String(expiredWelcomeBonusCount)}/>
        <Buttons type="button" onClick={handleRemoveWelcomBonus}>
          Remove Welcome Bonus
        </Buttons>
      </div>

      {/*
      <form onSubmit={handleResetAllWallet}>
        <Buttons type='submit'>Reset All Wallet Balance</Buttons>
      </form>
      */}

    </div>
  )
}

export default Setup
