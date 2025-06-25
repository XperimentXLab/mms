import { useEffect, useState } from "react"
import Loading from "../props/Loading"
import Buttons from "../props/Buttons"
import Spannn from "../props/Textt"
import { InputNormal, InputRef } from "../props/Formss"
import { FaChevronUp } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";
import { Tables, type TableColumn } from "../props/Tables"
import { InfoWithdraw } from "../props/Info"
import { convertCommissionToMaster, convertProfitToMaster, getWallet, transferMasterPoint, userDetails, withdrawProfit } from "../auth/endpoints"


const Wallet = () => {

  const [loading, setLoading] = useState<boolean>(true)

  // fetch from db
  //const [userID, setUserID] = useState<string>('')
  //const [username, setUsername] = useState<string>('')
  const [masterBalance, setMasterBalance] = useState<number>(0)
  const [profitBalance, setProfitBalance] = useState<number>(0)
  const [affiliateBalance, setAffiliateBalance] = useState<number>(0)
  const [bonusBalance, setBonusBalance] = useState<number>(0)
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined)

  // affiliate + bonus
  const [commissionBalance, setCommissionAmount] = useState<number>(0)
  const [commissionPoint, setCommissionPoint] = useState<number>(0)

  //input
  const [receiver, setReceiver] = useState<string>('')
  const [masterPoint, setMasterPoint] = useState<number>(0)
  const [profitPoint, setProfitPoint] = useState<number>(0)
  //const [depositPoint, setDepositPoint] = useState<number>(0)
  const [convertProfit, setConvertProfit] = useState<number>(0)
  const [convertCommision, setCovertCommision] = useState<number>(0)
  // reference
  const [reference, setReference] = useState<string>('')
  const [referenceWithdraw, setReferenceWithdraw] = useState<string>('')

  const [bonusUpDown, setBonusUpDown] = useState<boolean>(false)
  const toggleBonusUpDown = () => {
    setBonusUpDown(!bonusUpDown)
  }
  const columns: TableColumn[] = [
    {header: 'Type', accessor: 'type'},
    {header: 'Amount (USDT)', accessor: 'amount'},
  ]
  const data = [
    { type: 'Affiliate', amount: affiliateBalance },
    { type: 'Introducer', amount: bonusBalance }
  ]


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const resUserDetails = await userDetails()
        const resWallet = await getWallet()
        setWalletAddress(resUserDetails.wallet_address || undefined)
        setMasterBalance(resWallet.master_point_balance || 0)
        setProfitBalance(resWallet.profit_point_balance || 0)
        setAffiliateBalance(resWallet.affiliate_point_balance || 0)
        setBonusBalance(resWallet.bonus_point_balance || 0)
        setCommissionAmount(Number(affiliateBalance)+Number(bonusBalance) || 0)

        // Request Deposit Master Point
        //setUserID(resUserDetails.id)
        //setUsername(resUserDetails.username)
      } catch (error: any) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
}, [])


  const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (masterPoint <= 0 || receiver.trim() === '') {
        alert('Please enter a valid amount and receiver username.')
      }
      await transferMasterPoint({
        amount: masterPoint,
        receiver,
        reference
      })
      alert(`Successfully transferred ${masterPoint} MP to ${receiver}.`)
      setMasterPoint(0)
      setReceiver('')
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        alert('Invalid input. Please check your data.')
      } else {
        console.error('Error during transfer:', error)
        alert('An error occurred while processing your request. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

/*
  const handleDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      window.location.href = `https://www.wasap.my/601172840184/Request%20Deposit%20${username}%20(${userID})%20For%20${depositPoint}`
    } catch (error: any) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }*/

  const handleWithdrawProfit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (profitPoint <= 0) {
        alert('Please enter a valid amount.')
      }
      if (walletAddress === undefined) {
        alert('Please set your wallet address in the profile page.')
      }
      setReferenceWithdraw(walletAddress || '')
      await withdrawProfit({
        amount: profitPoint,
        reference: referenceWithdraw
      })
      alert(`Successfully requested withdrawal of ${profitPoint} profit points.`)
      setProfitPoint(0)
    } catch (error: any) {
      console.error('Error during withdrawal:', error)
      if (error.response && error.response.status === 400) {
        alert(error.response.data.error)
      } else {
        alert('An error occurred while processing your withdrawal request. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConvertProfit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (convertProfit <= 0) {
        alert('Please enter a valid amount.')
      }
      await convertProfitToMaster({
        amount: convertProfit
      })
    } catch (error: any) {
      console.error('Error during profit conversion:', error)
      if (error.response && error.response.status === 400) {
        alert(error.response.data.error)
      } else {
        alert('An error occurred while processing your profit conversion request. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }


  const handleWithdrawCommission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (commissionPoint <= 0) {
        alert('Please enter a valid amount.')
      }
      if (walletAddress === undefined) {
        alert('Please set your wallet address in the profile page.')
      }
      setReferenceWithdraw(walletAddress || '')
      await withdrawProfit({
        amount: commissionPoint,
        reference: referenceWithdraw
      })
      alert(`Successfully requested withdrawal of ${commissionPoint} commission points.`)
      setCommissionPoint(0)
    } catch (error: any) {
      console.error('Error during commission withdrawal:', error)
      if (error.response && error.response.status === 400) {
        alert(error.response.data.error)
      } else {
        alert('An error occurred while processing your withdrawal request. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConvertCommission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (convertCommision <= 0) {
        alert('Please enter a valid amount.')
      }
      await convertCommissionToMaster({
        amount: convertCommision
      })
    } catch (error: any) {
      console.error('Error during commission conversion:', error)
      if (error.response && error.response.status === 400) {
        alert(error.response.data.error)
      } else {
        alert('An error occurred while processing your commission conversion request. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 items-center mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 ">
        <div className="flex flex-col border-gray-500 border gap-2 py-2 px-4 rounded-xl shadow-lg shadow-red-600 bg-white">
          <Spannn label="Master Point">{masterBalance}</Spannn>
          <form className="flex flex-col gap-1.5" onSubmit={handleTransfer}>
            <div className="flex flex-row gap-1.5">
              <InputNormal placeholder="Enter amount"
                type="number" 
                onChange={e => setMasterPoint(Number(e.target.value))}
                value={String(masterPoint)}
                required={true}
              />
              <InputNormal placeholder="Enter receiver username" 
                type="text"
                onChange={e => setReceiver(e.target.value)}
                value={receiver}
                required={true}
              />
            </div>
            <InputRef
              onChange={e => setReference(e.target.value)}
              value={reference}
              required={false}
              type="text"
            />
            <Buttons type="submit">Transfer</Buttons>
          </form>

          {/*<form className="flex flex-row gap-1.5" onSubmit={handleDeposit}>
            <InputNormal 
              type="number"
              placeholder="Enter amount"
              onChange={e => setDepositPoint(Number(e.target.value))}
              required={true}
              value={String(depositPoint)}
            />
            <Buttons type="submit">Request Deposit</Buttons>

          </form>*/}

        </div>

        <div className="flex flex-col border-gray-500 gap-1.5 border py-2 px-4 rounded-xl shadow-lg shadow-red-600 bg-white">

          <Spannn label="Profit">{profitBalance}</Spannn>
          <Spannn label="Wallet Address">{walletAddress === undefined ? 'Not set' : walletAddress}</Spannn>

          <form className="flex gap-1.5" onSubmit={handleWithdrawProfit}>
            <InputNormal placeholder="Enter amount"
              type="number" 
              onChange={e => setProfitPoint(Number(e.target.value))}
              value={String(profitPoint)}
              required={true}
            />
            <Buttons type="submit">Withdraw</Buttons>
          </form>
          <InfoWithdraw />

          <form className="flex gap-1.5" onSubmit={handleConvertProfit}>
            <InputNormal placeholder="Enter amount"
              type="number" 
              onChange={e => setConvertProfit(Number(e.target.value))}
              value={String(convertProfit)}
              required={true}
            />
            <Buttons type="submit">Covert To MP</Buttons>
          </form>
        </div>

        <div className="flex flex-col border-gray-500 gap-1.5 border py-2 px-4 rounded-xl shadow-lg shadow-red-600 bg-white">

          <div className="flex justify-between">
            <Spannn label="Commision">{commissionBalance}</Spannn>
            <span className="cursor-pointer" onClick={toggleBonusUpDown}>{bonusUpDown ? <FaChevronUp /> : <FaChevronDown />}</span>
          </div>
          <Spannn label="Wallet Address">{walletAddress === undefined ? 'Not set' : walletAddress}</Spannn>
                    
          <form className="flex gap-1.5" onSubmit={handleWithdrawCommission}>
            <InputNormal placeholder="Enter amount" 
              type="number"
              onChange={e => setCommissionPoint(Number(e.target.value))}
              value={String(commissionPoint.toFixed(2))}
              required={true}
            />
            <Buttons type="submit">Withdraw</Buttons>       
          </form>
          <InfoWithdraw />

          <form className="flex gap-1.5" onSubmit={handleConvertCommission}>
            <InputNormal placeholder="Enter amount"
              type="number" 
              onChange={e => setCovertCommision(Number(e.target.value))}
              value={String(convertCommision)}
              required={true}
            />
            <Buttons type="submit">Covert To MP</Buttons>
          </form>

          {bonusUpDown && 
            <div className="gap-1.5 flex flex-col py-2">
              <Tables 
                columns={columns}
                data={data}
              />
            </div>
          }

        </div>
      </div>
      
      {loading && <Loading />}

    </div>
  )
}

export default Wallet
