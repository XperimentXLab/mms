import { useEffect, useState } from "react"
import Loading from "../props/Loading"
import { getAsset, getWallet, userDetails } from "../auth/endpoints"
import { FixedText } from "../props/Textt"
import { Tables } from "../props/Tables";
//import dayjs from "dayjs";

interface ProfitData {
  type: string;
  amount: number;
}


const Home = () => {

  const [username, setUsername] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  const [masterP, setMasterP] = useState<number>(0)
  const [profitP, setProfitP] = useState<number>(0)
  const [commissionP, setCommissionP] = useState<number>(0)
  const [assetP, setAssetP] = useState<number>(0)

  const [dailyProfit, setDailyProfit] = useState<ProfitData[]>([]);

  const [loading, setLoading] = useState<boolean>(false)

  
  // Mock data for profit - replace with API call in production
  const mockProfit: ProfitData[] = [
    { type: "Personal", amount: 0 }, 
    { type: "Affiliate", amount: 0 },
    { type: "Introducer", amount: 0 },
    { type: "Total", amount: 0}
  ];


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const respUserDetails = await userDetails()
        const resWallet = await getWallet()
        const resAsset = await getAsset()
        setUsername(respUserDetails.username)
        setUserId(respUserDetails.id)
        setMasterP(resWallet.master_point_balance || 0)
        setProfitP(resWallet.profit_point_balance || 0)
        setCommissionP(
          Number(resWallet.affiliate_point_balance || 0) +
          Number(resWallet.introducer_point_balance || 0)
        )
        setAssetP(resAsset.amount || 0)
        // In a real app, you would fetch this from an API
        setDailyProfit(mockProfit);
      } catch (error: any) {
        console.error('Error fetching user data:', error)
        setDailyProfit([])
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
      header: "Profit Type", 
      accessor: "type",
      render: (value: string) => value || "-"
    },
    { 
      header: "Amount (USD)", 
      accessor: "amount",
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

      <div className="grid grid-cols-1 gap-3">

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-start sm:justify-center">
          <FixedText label="USERNAME" text={username} />
          <FixedText label="USER ID" text={userId} />
          <FixedText label="Register Point" text={masterP.toString()} />
          <FixedText label="Profit" text={profitP.toString()} />
          <FixedText label="Commission" text={commissionP.toFixed(2).toString()} />
          <FixedText label="Asset" text={assetP.toString()} />
          </div>

        <div className="border rounded-xl p-4 flex items-center flex-col shadow-2xl shadow-red-300 bg-white">
          <h2 className="font-bold text-lg mb-3">Daily Summary Profit</h2>
          <div className="overflow-x-auto">
            <Tables 
              columns={tableColumns}
              data={dailyProfit}
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
