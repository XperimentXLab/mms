import React, { useEffect, useState } from "react"
import Buttons from "../props/Buttons"
import { Inputss, InputwithVal } from "../props/Formss"
import { SelectMonth, SelectYear } from "../props/DropDown"
import { distribute_profit, get_profit, update_monthly_finalized_profit, update_profit } from "../auth/endpoints"
import Loading from "../props/Loading"
import { FixedText } from "../props/Textt"
import dayjs from "dayjs"

const Operation = () => {

  const [dailyProfitRate, setDailyProfitRate] = useState<number>(0)
  const [weeklyProfitRate, setWeeklyProfitRate] = useState<number>(0)
  const [currentMonthProfit, setCurrentMonthProfit] = useState<number>(0)
  const [activeMonthProfit, setActiveMonthProfit] = useState<string>("")
  const [activeYearProfit, setActiveYearProfit] = useState<string>("")
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const [todayProfit, setTodayProfit] = useState<number>(0)
  const [weeklyProfit, setWeeklyProfit] = useState<number>(0)
  const [monthlyProfit, setMonthlyProfit] = useState<number>(0)
  const [inputActiveMonth, setInputActiveMonth] = useState<string>(""); 
  const [inputActiveYear, setInputActiveYear] = useState<string>("");

  const [finalizedSelectedMonth, setFinalizedSelectedMonth] = useState<string>("");
  const [finalizedSelectedYear, setFinalizedSelectedYear] = useState<string>("");
  const [inputFinalizedProfitRate, setInputFinalizedProfitRate] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [errorMessageF, setErrorMessageF] = useState<string>("")


  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await get_profit()
        setDailyProfitRate(response.daily_profit_rate || 0)
        setWeeklyProfitRate(response.weekly_profit_rate || 0)
        setCurrentMonthProfit(response.current_month_profit || 0)
        setActiveMonthProfit(response.active_month_profit || null)
        setActiveYearProfit(response.active_year_profit || null)

        // Initialize input states for the operational profit form
        setDailyProfitRate(response.daily_profit_rate || 0);
        setWeeklyProfitRate(response.weekly_profit_rate || 0);
        setCurrentMonthProfit(response.current_month_profit || 0);
        setInputActiveMonth(response.active_month_profit);
        setInputActiveYear(response.active_year_profit);

        const formattedDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
        setLastUpdated(formattedDate);

        console.log(activeMonthProfit, activeYearProfit)
      } catch (error: any) {
        console.error('Error fetching operational profit data:', error);
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  /*
  const toggleUpdateMY = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      await create_profit({
        activeMonthProfit: Number(inputActiveMonth),
        activeYearProfit: Number(inputActiveYear)
      })
    } catch (error: any) {
      setErrorMessage(error.response.data.error)
    } finally {
      setLoading(false)
    }
  }*/

  const toggleUpdateProfit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inputActiveMonth || !inputActiveYear) {
      alert("Please select an active month and year.");
      return;
    }
    try {
      setLoading(true)
      await update_profit({
        dailyProfitRate: todayProfit,
        weeklyProfitRate: weeklyProfit,
        currentMonthProfit: monthlyProfit,
        activeMonthProfit: Number(inputActiveMonth),
        activeYearProfit: Number(inputActiveYear),
      })
      alert('Profit updated successfully')

      setDailyProfitRate(dailyProfitRate)
      setWeeklyProfitRate(weeklyProfitRate)
      setCurrentMonthProfit(currentMonthProfit)
      setActiveMonthProfit(String(inputActiveMonth))
      setActiveYearProfit(String(inputActiveYear))

    } catch (error: any) {
      setErrorMessage(error.response.data.error)
      alert('Failed to update operational profit. Please try again.');
    } finally {
      setLoading(false)
    }
  }


  const toggleMFinalized = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!finalizedSelectedMonth || !finalizedSelectedYear) {
      alert("Please select a month and year.");
      return;
    }
    try {
      setLoading(true)
      await update_monthly_finalized_profit({
        month: Number(finalizedSelectedMonth),
        year: Number(finalizedSelectedYear),
        finalizedProfit: inputFinalizedProfitRate
      })
      alert('Finalized profit updated successfully')
      setFinalizedSelectedMonth("")
      setFinalizedSelectedYear("")
      setInputFinalizedProfitRate(0)
    } catch (error: any) {
      console.log(error)
      if (error.response && error.response.status === 400) {
        setErrorMessageF(error.response.data.error)
      } else {
        setErrorMessageF("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false)
    }
  }


  const toggleDistributeProfit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await distribute_profit()
      alert(response.message)
      alert(JSON.stringify(response.metrics))
      /*
      {
        "metrics": {
            "users_with_profit": ..,
            "total_profit_distributed": ..,
            "l1_bonuses_paid": ..,
            "l2_bonuses_paid": ..,
            "skipped_users": ..
        },
        "profit_wallets_updated": ..,
        "affiliate_wallets_updated": ..,
        "profit_tx_created": ..,
        "affiliate_tx_created": ..
      }
      */
    } catch (error: any) {
      alert('Failed to distribute profit. Please try again.');
    } finally {
      setLoading(false)
    }
  }

  /*
  const [amountShare, setAmountShare] = useState<number>(0)
  const toggleUpdateSharing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      await updateProfitSharing(amountShare)
      alert('Profit sharing updated successfully')
    } catch (error: any) {
      alert('Failed to update profit sharing. Please try again.');
    } finally {
      setLoading(false)
    }
  }*/



  return (
    <div className="flex flex-col items-center p-4 gap-5">
      {loading && <Loading />}
      <h1 className="text-2xl font-bold">Operational</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={toggleUpdateProfit} className="grid grid-cols-1 gap-3 items-center w-full p-4 border rounded-xl shadow-md bg-white shadow-red-800">
          <span className="flex justify-between">
            <span className="font-semibold">Update Profit </span>
            <span className="text-sm">Last Updated: {lastUpdated}</span>
          </span>

          <span className="text-sm">*Please fill in manually (e.g., enter 5.0 for 5.0%)</span>

          <div className="grid grid-cols-2 items-center">
            <SelectMonth value={inputActiveMonth} 
              onChange={(e) => setInputActiveMonth(e.target.value)} />
            <SelectYear value={inputActiveYear}
              onChange={(e) => setInputActiveYear(e.target.value)} />
          </div>

          <InputwithVal 
            label="Today Profit"
            type="number"
            placeholder="Please fill in today profit manually"
            currentValue={dailyProfitRate}
            onChange={(e) => setTodayProfit(Number(e.target.value))}
            value={String(todayProfit)}
            required={true}
          />
          <InputwithVal
            label="Weekly Profit"
            type="number"
            placeholder="Please fill in weekly profit manually"
            currentValue={weeklyProfitRate}
            onChange={(e) => setWeeklyProfit(Number(e.target.value))}
            value={String(weeklyProfit)}
            required={true}
          />
          <InputwithVal
            label="Monthly Profit"
            type="number"
            placeholder="Please set monthly profit manually"
            currentValue={currentMonthProfit}
            onChange={(e) => setMonthlyProfit(Number(e.target.value))}
            value={String(monthlyProfit)}
            required={true}
          />
          {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span>}
          <Buttons type="submit">Confirm</Buttons>
        </form>

        <form onSubmit={toggleMFinalized} className="grid grid-cols-1 gap-3 items-center w-full p-4 border rounded-xl shadow-md bg-white shadow-red-800"> 
          <span className="font-semibold">Finalized Monthly Profit</span>

          <div className="grid grid-cols-2 items-center">
            <SelectMonth value={finalizedSelectedMonth} 
              onChange={(e) => setFinalizedSelectedMonth(e.target.value)} />
            <SelectYear value={finalizedSelectedYear}
              onChange={(e) => setFinalizedSelectedYear(e.target.value)} />
          </div>

          <Inputss
            label="Finalized Profit"
            type="number"
            placeholder="Please fill in finalized profit manually"
            currentValue={monthlyProfit}
            onChange={(e) => setInputFinalizedProfitRate(Number(e.target.value))}
            value={String(inputFinalizedProfitRate)}
            required={true}
          />
          {errorMessageF && <span className="text-sm text-red-500">{errorMessageF}</span>}
          <Buttons type="submit">Update Finalized</Buttons>

        </form>

        <form onSubmit={toggleDistributeProfit} className="grid grid-cols-1 gap-3 items-center w-full p-4 border rounded-xl shadow-md bg-white shadow-red-800">
          <span className="font-semibold">Profit Distribution </span>
          <FixedText label="Today Profit" text={String(dailyProfitRate)}/>
          <Buttons type="submit">Distribute</Buttons>
        </form>

        {/*
        <form onSubmit={toggleUpdateSharing} className="grid grid-cols-1 gap-3 items-center w-full p-4 border rounded-xl shadow-md bg-white shadow-red-800">
          <Inputss 
            label="Profit Sharing Amount"
            type="number"
            placeholder="Please fill in manually"
            onChange={e => setAmountShare(Number(e.target.value))}
            value={amountShare}
            required={true}
            className="bg-gray-200 p-2 rounded-md focus:border-none"
          />
          <Buttons type="submit">Distribute</Buttons>
        </form>*/}
      </div>
    </div>
  )
}

export default Operation
