import { useEffect, useState } from "react"
import { getInfoDashboard } from "../auth/endpoints"
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
import { SelectMonth, SelectYear } from "../props/DropDown";

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
  total_gain_z: number
  total_gain_a: number
  total_gain: number
  total_deposit: number
}

interface AssetProps {
  total_asset_amount: number
  asset_above_10k: number
  asset_below_10k: number
}
const AssetChart = ({ data }: { data: AssetProps}) => {

  const chartData = {
    labels: ['Asset Sharing (80:20)', 'Asset Sharing (70:30)'],
    
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
    <div className="flex items-center justify-center p-2 bg-black rounded-xl h-70">
      <Pie 
        data={chartData} 
        options={options}
      />
    </div>
  );
}

const Dashboard = () => {

  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [totalAsset, setTotalAsset] = useState<number>(0)
  const [totalConvert, setTotalConvert] = useState<number>(0)
  const [totalProfit, setTotalProfit] = useState<number>(0)
  const [totalUser, setTotalUser] = useState<number>(0)
  const [totalWithdraw, setTotalWithdraw] = useState<number>(0)
  const [totalWithdrawFee, setTotalWithdrawFee] = useState<number>(0)
  const [totalAssetAbove10k, setTotalAssetAbove10k] = useState<number>(0)
  const [totalAssetBelow10k, setTotalAssetBelow10k] = useState<number>(0)

  const [currentMonth, setCurrentMonth] = useState<string>('')
  const [currentYear, setCurrentYear] = useState<string>('')
  const [gain, setGain] = useState<GainProps[]>([])
  const [dailyProfitByDay, setDailyProfitsByDay] = useState<DailyProfitByDayProps[]>([])

  useEffect(()=> {
    const fetchData = async () => {
      try {
        setLoading(true)
        const resInfoDash = await getInfoDashboard({
          month: currentMonth, 
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

        const gainData: GainProps[] = [{
          total_deposit: resInfoDash.total_deposit,
          total_gain: resInfoDash.total_gain,
          total_gain_z: resInfoDash.total_gain_z,
          total_gain_a: resInfoDash.total_gain_a,
        }];

        setGain(gainData)
        setErrorMessage('')
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
  }, [currentMonth, currentYear])

  const columns = [
    { header: 'Total Deposit',
      accessor: 'total_deposit',
      render: (value: number) => value
    },
    { header: 'Total Gain Trading',
      accessor: 'total_gain',
      render: (value: number) => value.toFixed(2)
    },
    { header: 'Gain Trading Z',
      accessor: 'total_gain_z',
      render: (value: number) => value
    },
    { header: 'Gain Trading A',
      accessor: 'total_gain_a',
      render: (value: number) => value
    },
  ]


  const dataAsset = {
    total_asset_amount: totalAsset, 
    asset_above_10k: totalAssetAbove10k, 
    asset_below_10k: totalAssetBelow10k
  }
  
  return (
    <div className="flex flex-col gap-2 justify-center m-4">
      <span className="text-white">Dashboard</span>
      {loading && <Loading />}
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 justify-center">
        <FixedText label="Total User" text={totalUser} />
        <FixedText label="Total Profit & Commission" text={totalProfit} />
        <FixedText label="Total Convert (Compounding)" text={totalConvert}/>
        <FixedText label="Total Withdraw" text={totalWithdraw} />
        <FixedText label="Total Withdraw Fee" text={totalWithdrawFee} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center justify-center">

        <AssetChart data={dataAsset} />

        <div className="flex flex-col items-center justify-center bg-white p-2 rounded-xl h-full">
          <span  className="font-bold">Monthly Summary Trading</span>
          <div className="flex flex-row gap-2 w-full">
            <SelectMonth value={currentMonth} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCurrentMonth(e.target.value)} />
            <SelectYear value={currentYear}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCurrentYear(e.target.value)} />
          </div>
          <Tables columns={columns} data={gain} 
            needDate={false}
          />
        </div>
      </div>

      <div className="flex justify-center">
        {dailyProfitByDay.length > 0 ? (
          <DailyProfitChart data={dailyProfitByDay} />
        ) : <Loading />}
      </div>

    </div>
  )
}

export default Dashboard
