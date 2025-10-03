import { useEffect, useMemo, useState } from "react"
import { getInfoDashboard, getOpsProfitCal } from "../auth/endpoints"
import Loading from "../props/Loading"
import { FixedText } from "../props/Textt"
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { subDays, format } from "date-fns";
import { Tables } from "../props/Tables";
import { SelectYear } from "../props/DropDown";
import { Calendar, type profitsData } from "../props/Calender";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DailyProfitByDayProps {
  day: string
  total: number
}
const DailyProfitChart = ({ data }: { data: DailyProfitByDayProps[] }) => {

  // Filter data for the last 7 days
  const today = new Date();
  const sevenDaysAgo = subDays(today, 6); // 6 days ago + today = 7 days
  
  const last7DaysData = data.filter(item => {
    const itemDate = new Date(item.day);
    return itemDate >= sevenDaysAgo && itemDate <= today;
  }).sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

  // Format dates for display (e.g., "Jul 01")
  const formattedLabels = last7DaysData.map(item => 
    `${format(new Date(item.day), 'MMM dd')} (${item.total})`
  );

  const totalProfit7Days = last7DaysData.reduce((acc, item) => acc + item.total, 0);

  const chartData = {
    labels: formattedLabels,
    datasets: [
      {
        label: `Total Profit - ${totalProfit7Days.toFixed(2)}`,
        data: last7DaysData.map(item => item.total),
        backgroundColor: 'lightgrey',
        borderColor: 'white',
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,      
        labels: {
          color: 'white',
        },
      },
      title: {
        display: true,
        text: 'Last 6 Days Profits',
        color: 'white',
        font: {
          size: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.parsed.y;
            return `Total: ${total.toFixed(2)}`;
          }
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'white',
        },
        grid: {
          color: 'rgba(255,255,255,0.1)'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: 'white',
        },
        grid: {
          color: 'rgba(255,255,255,0.1)'
        }
      },
    },
  }

  return (
    <div className="flex justify-center w-full m-3 backdrop-blur-lg rounded-2xl bg-transparent p-3">
      <Line 
        data={chartData} 
        options={options}
      />
    </div>
  );
}

interface GainProps {
  month: number | string;
  total_gain_z: number
  total_gain_a: number
  total_gain: number
  total_deposit: number
}

interface MonthlyDataRes {
  monthly_data: GainProps[];
  yearly_totals: {
    total_deposit: number;
    total_gain_a: number;
    total_gain_z: number;
    total_gain: number;
  }
}


interface AssetProps {
  total_asset_amount: number
  asset_above_10k: number
  asset_below_10k: number
  user_asset_above_10k: number
  user_asset_below_10k: number
}
const AssetChart = ({ data }: { data: AssetProps}) => {

  const chartData = {
    labels: [`Asset Sharing (80:20) - ${data.user_asset_above_10k}`, `Asset Sharing (70:30) - ${data.user_asset_below_10k}`],
    
    datasets: [
      {
        label: 'Asset',
        data: [data.asset_above_10k, data.asset_below_10k],
        backgroundColor: ['#10CB81', '#CF2F49'], 
        hoverOffset: 8,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,

        labels: {
          color: 'white'
        }
      },
      title: {
        display: true,
        text: `Total Asset | ${data.total_asset_amount.toFixed(2)}`,
        color: 'white',
        font: {
          size: 15,
        },
      }
    }
  };


  return (
    <div className="flex items-center justify-center p-2 bg-black rounded-xl h-70 w-full">
      <Pie 
        data={chartData} 
        options={options}
      />
    </div>
  );
}

const Dashboard = () => {

  const date = new Date()
  const dateY = date.getFullYear()

  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [totalAsset, setTotalAsset] = useState<number>(0)
  const [totalConvert, setTotalConvert] = useState<number>(0)
  const [totalProfit, setTotalProfit] = useState<number>(0)
  const [totalUser, setTotalUser] = useState<number>(0)
  const [totalWithdraw, setTotalWithdraw] = useState<number>(0)
  const [totalWithdrawFee, setTotalWithdrawFee] = useState<number>(0)
  const [accumulatedTotal, setAccumulatedTotal] = useState<number>(0)

  const [totalAssetAbove10k, setTotalAssetAbove10k] = useState<number>(0)
  const [totalAssetBelow10k, setTotalAssetBelow10k] = useState<number>(0)
  const [userAssetAbove10k, setUserAssetAbove10k] = useState<number>(0)
  const [userAssetBelow10k, setUserAssetBelow10k] = useState<number>(0)

  const [currentYear, setCurrentYear] = useState<string>(dateY.toString())
  const [gain, setGain] = useState<MonthlyDataRes[]>([])
  const [dailyProfitByDay, setDailyProfitsByDay] = useState<DailyProfitByDayProps[]>([])

  const [sharingProfit, setSharingProfit] = useState<number>(0)

  const [calendersProfit, setCalendersProfit] = useState<profitsData[]>([])

  const defaultMonthlyData: MonthlyDataRes = {
    monthly_data: [],
    yearly_totals: {
      total_deposit: 0,
      total_gain_a: 0,
      total_gain_z: 0,
      total_gain: 0,
    },
  };
  const currentData = gain.length > 0 ? gain[0] : defaultMonthlyData;

  useEffect(()=> {
    const fetchData = async () => {
      try {
        setLoading(true)
        const resInfoDash = await getInfoDashboard({
          year: Number(currentYear)
        })
        setTotalConvert(resInfoDash.total_convert_amount)
        setTotalProfit(resInfoDash.total_profit_balance)
        setTotalUser(resInfoDash.total_user)
        setTotalWithdraw(resInfoDash.total_withdraw_amount)
        setTotalWithdrawFee(resInfoDash.total_withdraw_fee)
        setDailyProfitsByDay(resInfoDash.daily_profits)

        setTotalAsset(resInfoDash.total_asset_amount)
        setTotalAssetAbove10k(resInfoDash.asset_above_10k)
        setTotalAssetBelow10k(resInfoDash.asset_below_10k)
        setUserAssetAbove10k(resInfoDash.user_asset_above_10k)
        setUserAssetBelow10k(resInfoDash.user_asset_below_10k)

        setSharingProfit(resInfoDash.super_user_profit)

        const accumulateTotal = resInfoDash.total_profit_balance + resInfoDash.total_convert_amount + resInfoDash.total_withdraw_amount + resInfoDash.super_user_profit
        setAccumulatedTotal(accumulateTotal.toFixed(2))

        const gainData: MonthlyDataRes[] = [{
          monthly_data: resInfoDash.monthly_data,
          yearly_totals: resInfoDash.yearly_totals
        }];

        setGain(gainData)
        setErrorMessage('')

        const resCal = await getOpsProfitCal()
        setCalendersProfit(resCal)

      } catch (error: any) {
        if (error.response && error.response.status === 400 ) {
          setErrorMessage(error.response.data.error)
        } else if (error.response && error.response.status === 404) {
          console.error(error.response.data.error)
          setErrorMessage('')
        } else {
          setErrorMessage(error.message)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentYear])


  const tableData = useMemo(() => {
    // Create a map of existing monthly data for quick lookup
    const monthlyDataMap = new Map<number, GainProps>();
    currentData.monthly_data.forEach(item => {
      monthlyDataMap.set(Number(item.month), {
        ...item,
        total_gain: Number(item.total_gain_a) + Number(item.total_gain_z),
      });
    })

    // Create rows for all 12 months
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const existingData = monthlyDataMap.get(month);
      
      return existingData || {
        month,
        total_deposit: 0,
        total_gain_a: 0,
        total_gain_z: 0,
        total_gain: 0,
      };
    });
  }, [currentData]);

  const data: GainProps[] = [
    ...tableData,
    {
      month: 'TOTAL',
      total_deposit: currentData.yearly_totals.total_deposit,
      total_gain: Number(currentData.yearly_totals.total_gain_z) + Number(currentData.yearly_totals.total_gain_a),
      total_gain_z: currentData.yearly_totals.total_gain_z,
      total_gain_a: currentData.yearly_totals.total_gain_a,
    }
  ]

  const typeLabels: Record<string, string> = {
    1: 'Jan', 2: 'Feb', 3: 'Mar',
    4: 'Apr', 5: 'May', 6: 'Jun',
    7: 'Jul', 8: 'Aug', 9: 'Sep', 
    10: 'Oct', 11: 'Nov', 12: 'Dec',
  }
  //////////////////// Table Column //////////////////
  const tableColumns = [
    { 
      header: "Month", 
      accessor: "month",
      render: (value: string) => (
        value === 'TOTAL' ? 
        <span className="font-semibold">Total</span> : typeLabels[value] || value
      )
    },
    { header: 'Total Deposit',
      accessor: 'total_deposit',
      render: (value: number) => Number(value).toFixed(2)
    },
    { header: 'Total Gain Trading',
      accessor: 'total_gain',
      render: (value: number) => Number(value).toFixed(2)
    },
    { header: 'Gain Trading Z',
      accessor: 'total_gain_z',
      render: (value: number) => Number(value).toFixed(2)
    },
    { header: 'Gain Trading A',
      accessor: 'total_gain_a',
      render: (value: number) => Number(value).toFixed(2)
    },
  ]


  const dataAsset = {
    total_asset_amount: totalAsset, 
    asset_above_10k: totalAssetAbove10k, 
    asset_below_10k: totalAssetBelow10k,
    user_asset_above_10k: userAssetAbove10k,
    user_asset_below_10k: userAssetBelow10k,
  }
  
  return (
    <div className="flex flex-col gap-2 justify-center items-center m-4">
      <span className="text-white font-semibold">Dashboard</span>
      {loading && <Loading />}
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 justify-center items-center w-full">
          <FixedText label="Total User" text={totalUser} />
          <FixedText label="Profit & Commission in Wallet" text={totalProfit} /> 
          <FixedText label="Accumulated Profit & Commission" text={accumulatedTotal} /> 
          <FixedText label="Total Convert (Compounding)" text={totalConvert}/>
          <FixedText label="Total Withdraw" text={totalWithdraw} />
          <FixedText label="Total Withdraw Fee" text={totalWithdrawFee} />
          <FixedText label="Total Profit Sharing" text={sharingProfit} />
        </div>
        

      </div>

      <div className="gap-2 items-center h-full w-full flex flex-col md:flex-row p-1">
        <AssetChart data={dataAsset} />

        <Calendar data={calendersProfit}/>
      </div>

      <div className="flex flex-col gap-2 items-center justify-center w-full">

        <div className="flex flex-col items-center justify-center bg-white p-2 rounded-xl w-full">
          <span  className="font-bold">Monthly Summary Trading</span>

          <div className="flex flex-row gap-2 w-full">
            <SelectYear value={currentYear}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCurrentYear(e.target.value)} />
          </div>
          <Tables columns={tableColumns} data={data} 
          />
        </div>
      </div>

      <div className="flex justify-center w-full">
        {dailyProfitByDay.length > 0 ? (
          <DailyProfitChart data={dailyProfitByDay} />
        ) : <Loading />}
      </div>

    </div>
  )
}

export default Dashboard
