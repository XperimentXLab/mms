import React, { useEffect, useState } from "react"
import Buttons from "../props/Buttons"
import { InputwithVal } from "../props/Formss"
import { SelectMonth, SelectYear } from "../props/DropDown"
import { create_profit, get_profit, update_profit } from "../auth/endpoints"
import Loading from "../props/Loading"

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


  //const [finalizedSelectedMonth, setFinalizedSelectedMonth] = useState<string>("");
  //const [finalizedSelectedYear, setFinalizedSelectedYear] = useState<string>("");
  //const [inputFinalizedProfitRate, setInputFinalizedProfitRate] = useState<number>(0);



  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>("")


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
        setLastUpdated(response.last_updated)

        // Initialize input states for the operational profit form
        setDailyProfitRate(response.daily_profit_rate || 0);
        setWeeklyProfitRate(response.weekly_profit_rate || 0);
        setCurrentMonthProfit(response.current_month_profit || 0);
        setInputActiveMonth(response.active_month_profit);
        setInputActiveYear(response.active_year_profit);

        console.log(activeMonthProfit, activeYearProfit)
      } catch (error: any) {
        console.error('Error fetching operational profit data:', error);
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
  }

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

  return (
    <div className="flex items-center p-4 flex-col gap-5">
      {loading && <Loading />}
      <h1 className="text-2xl font-bold">Operational</h1>

      <form onSubmit={toggleUpdateProfit} className="grid grid-cols-1 gap-3 items-center w-full p-4 border rounded-xl shadow-md bg-white shadow-red-800">
        <span className="flex justify-between">
          <span className="font-semibold">Update Profit </span>
          --- <span className="text-sm">Last Updated: {lastUpdated}</span> ---
          <span className="text-sm text-red-500">{errorMessage}</span>
        </span>

        <form className="grid grid-cols-3 justify-center items-end border px-2 py-1 rounded-xl" onSubmit={toggleUpdateMY}>
          <SelectMonth value={inputActiveMonth} 
            onChange={(e) => setInputActiveMonth(e.target.value)} />
          <SelectYear value={inputActiveYear}
            onChange={(e) => setInputActiveYear(e.target.value)} />
          <Buttons type="submit">Confirm</Buttons>
        </form>

        <span className="text-sm">*Please fill in manually (e.g., enter 5.0 for 5.0%)</span>
        <InputwithVal 
          label="Today Profit"
          type="number"
          placeholder="Please fill in today profit manually"
          currentValue={dailyProfitRate}
          onChange={(e) => setTodayProfit(Number(e.target.value))}
          value={todayProfit}
        />
        <InputwithVal
          label="Weekly Profit"
          type="number"
          placeholder="Please fill in weekly profit manually"
          currentValue={weeklyProfitRate}
          onChange={(e) => setWeeklyProfit(Number(e.target.value))}
          value={weeklyProfit}
        />
        <InputwithVal
          label="Monthly Profit"
          type="number"
          placeholder="Please set monthly profit manually"
          currentValue={currentMonthProfit}
          onChange={(e) => setMonthlyProfit(Number(e.target.value))}
          value={monthlyProfit}
        />
        <Buttons type="submit">Confirm</Buttons>
      </form>

      <form className="grid grid-cols-1 gap-3 items-center w-full p-4 border rounded-xl shadow-md bg-white shadow-red-800"> 
        <span className="font-semibold">Finalized Monthly Profit</span>

        <div className="grid grid-cols-2 items-center">
          <SelectMonth value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} />
          <SelectYear value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)} />
        </div>

        <InputwithVal
          label="Finalized Profit"
          type="number"
          placeholder="Please fill in finalized profit manually"
          currentValue={monthlyProfit}
          onChange={(e) => setCurrentMonthProfit(Number(e.target.value))}
          value={currentMonthProfit}
        />

        <Buttons type="submit">Finalized</Buttons>

      </form>

    </div>
  )
}

export default Operation
