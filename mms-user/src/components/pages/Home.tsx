import { useEffect, useState } from "react"
import Loading from "../props/Loading"
import { userDetails } from "../auth/endpoints"
import { FixedText } from "../props/Textt"
import Tables from "../props/Tables"

interface MonthlyProfitData {
  month: string;
  profit: number;
  growth?: number;
}


const Home = () => {

  const [username, setUsername] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  const [masterP, setMasterP] = useState<number>(0)
  const [profitP, setProfitP] = useState<number>(0)
  const [BonusP, setBonusP] = useState<number>(0)

  const [monthlyProfit, setMonthlyProfit] = useState<MonthlyProfitData[]>([]);

  const [loading, setLoading] = useState<boolean>(false)

  
  // Mock data for monthly profit - replace with API call in production
  const mockMonthlyProfit: MonthlyProfitData[] = [
    { month: "January", profit: 500 /*growth: 5.2*/ }, 
    { month: "February", profit: 200, /*growth: 13.6*/ },
    { month: "March", profit: 800, /*growth: 11.3*/ },
    { month: "April", profit: 500, /*growth: -14.6*/ },
    { month: "May", profit: 200, /*growth: 27.4*/ },
  ];


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await userDetails()
        setUsername(response.username)
        setUserId(response.id)
        setMasterP(0)
        setProfitP(0)
        setBonusP(0)
        // In a real app, you would fetch this from an API
        setMonthlyProfit(mockMonthlyProfit);
      } catch (error: any) {
        console.error('Error fetching user data:', error)
        setMonthlyProfit([])
        if (error.response) {
          console.error('Response data:', error.response.data)
          console.error('Response status:', error.response.status)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Safe calculation functions
  /*
  const calculateTotalProfit = () => {
    return monthlyProfit.reduce((sum, item) => sum + (item?.profit || 0), 0);
  };

  const calculateAverageGrowth = () => {
    if (monthlyProfit.length === 0) return 0;
    const totalGrowth = monthlyProfit.reduce((sum, item) => sum + (item?.growth || 0), 0);
    return totalGrowth / monthlyProfit.length;
  };
  */
 
  //////////////////// Table Column //////////////////
  const tableColumns = [
    { 
      header: "Month", 
      accessor: "month",
      render: (value: string) => value || "-"
    },
    { 
      header: "Profit ($)", 
      accessor: "profit",
      render: (value: number) => value?.toLocaleString() || "0"
    },
    /*
    { 
      header: "Growth (%)", 
      accessor: "growth",
      render: (value: number) => (
        <span className={value >= 0 ? "text-green-500" : "text-red-500"}>
          {value >= 0 ? `+${value?.toFixed(1) || "0.0"}` : value?.toFixed(1) || "0.0"}
        </span>
      )
    },
    */
  ];

  return (
    <div className="flex flex-col justify-between items-center gap-3 p-2 mt-2">

      {loading && <Loading />}

      <div>
        <h1 className="font-bold text-xl">Home</h1>
      </div>

      <div className="grid grid-rows-2 gap-3">

        <FixedText label="USERNAME" text={username} />
        <FixedText label="USER ID" text={userId} />
        <FixedText label="Master Point" text={masterP.toString()} />
        <FixedText label="Profit Point" text={profitP.toString()} />
        <FixedText label="Bonus Point" text={BonusP.toString()} />

        <div className="border rounded-xl p-4">
          <h2 className="font-bold text-lg mb-3">Monthly Summary Profit</h2>
          <div className="overflow-x-auto">
            <Tables 
              columns={tableColumns}
              data={monthlyProfit}
              emptyMessage="No profit data available"
            />
          </div>
          
          {/*<div className="mt-4 grid grid-cols-2 gap-4">
            <div className="border p-3 rounded-lg">
              <h3 className="text-sm text-gray-500">Total Profit</h3>
              <p className="text-xl font-bold">
                ${calculateTotalProfit().toLocaleString()}
              </p>
            </div>
            <div className="border p-3 rounded-lg">
              <h3 className="text-sm text-gray-500">Average Growth</h3>
              <p className="text-xl font-bold">
                ${calculateAverageGrowth().toFixed(1)}%
              </p>
            </div>
          </div>*/}
        </div>
        
      </div>
      
    </div>
  )
}

export default Home
