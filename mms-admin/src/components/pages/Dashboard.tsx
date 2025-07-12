import { useEffect, useState } from "react"
import { getInfoDashboard } from "../auth/endpoints"
import Loading from "../props/Loading"
import { FixedText } from "../props/Textt"
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
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
        data: data.map(item => item.total),
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
        text: '6 Days Profits',
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
      datalabels: {
        display: false
      }
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
    <div className="flex justify-center w-full m-3 shadow shadow-neutral-200 rounded-2xl bg-transparent p-3">
      <Line data={chartData} options={options} />
    </div>
  );
}

interface GainProps {
  total_gain_z: number
  total_gain_a: number
  total_gain: number
  total_deposit: number
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
        setTotalAsset(resInfoDash.total_asset_amount)
        setTotalConvert(resInfoDash.total_convert_amount)
        setTotalProfit(resInfoDash.total_profit_balance)
        setTotalUser(resInfoDash.total_user)
        setTotalWithdraw(resInfoDash.total_withdraw_amount)
        setTotalWithdrawFee(resInfoDash.total_withdraw_fee)
        setDailyProfitsByDay(resInfoDash.daily_profits)
        setGain(resInfoDash)
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
      render: (value: number) => value
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
  
  return (
    <div className="flex flex-col gap-2 justify-center m-4">
      <span className="text-white">Dashboard</span>
      {loading && <Loading />}
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 justify-center">
        <FixedText label="Total User" text={totalUser} />
        <FixedText label="Total Asset" text={totalAsset}/>
        <FixedText label="Total Profit & Commission" text={totalProfit} />
        <FixedText label="Total Convert (Compounding)" text={totalConvert}/>
        <FixedText label="Total Withdraw" text={totalWithdraw} />
        <FixedText label="Total Withdraw Fee" text={totalWithdrawFee} />
      </div>

      <div className="flex flex-col items-center bg-white p-2 rounded-xl">
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

      <div className="flex justify-center">
        {dailyProfitByDay.length > 0 ? (
          <DailyProfitChart data={dailyProfitByDay} />
        ) : <Loading />}
      </div>

    </div>
  )
}

export default Dashboard
