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
    format(new Date(item.day), 'MMM dd')
  );

  const totalProfit7Days = last7DaysData.reduce((acc, item) => acc + item.total, 0);


  const chartData = {
    labels: formattedLabels,
    datasets: [
      {
        label: `Total Profit - ${totalProfit7Days}`,
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
        text: 'Weekly Profits',
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

const Dashboard = () => {

  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [totalAsset, setTotalAsset] = useState<number>(0)
  const [totalConvert, setTotalConvert] = useState<number>(0)
  const [totalProfit, setTotalProfit] = useState<number>(0)
  const [totalUser, setTotalUser] = useState<number>(0)
  const [totalWithdraw, setTotalWithdraw] = useState<number>(0)
  const [totalDeposit, setTotalDeposit] = useState<number>(0)
  //const [totalGainZ, setTotalGainZ] = useState<number>(0)
  //const [totalGainA, setTotalGainA] = useState<number>(0)
  const [totalGain, setTotalGain] = useState<number>(0)
  const [dailyProfitByDay, setDailyProfitsByDay] = useState<DailyProfitByDayProps[]>([])

  useEffect(()=> {
    const fetchData = async () => {
      try {
        setLoading(true)
        const resInfoDash = await getInfoDashboard()
        console.log(resInfoDash)
        setTotalAsset(resInfoDash.total_asset_amount)
        setTotalConvert(resInfoDash.total_convert_amount)
        setTotalProfit(resInfoDash.total_profit_balance)
        setTotalUser(resInfoDash.total_user)
        setTotalWithdraw(resInfoDash.total_withdraw_amount)
        setDailyProfitsByDay(resInfoDash.daily_profits)
        setTotalDeposit(resInfoDash.total_deposit)
        setTotalGain(resInfoDash.total_gain)
        //setTotalGainZ(resInfoDash.total_gain_z)
        //setTotalGainA(resInfoDash.total_gain_a)
      } catch (error: any) {
        if (error.response && error.response.status === 400 ) {
          setErrorMessage(error.response.data.error)
        } else {
          setErrorMessage(error.message)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
  
  return (
    <div className="flex flex-col gap-2 justify-center m-4">
      <span className="text-white">Dashboard</span>
      {loading && <Loading />}
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <div className="flex flex-col md:flex-row gap-2 justify-center">
        <FixedText label="Total User" text={totalUser} />
        <FixedText label="Total Asset" text={totalAsset}/>
        <FixedText label="Total Profit & Commission" text={totalProfit} />
        <FixedText label="Total Convert (Compounding)" text={totalConvert}/>
        <FixedText label="Total Withdraw" text={totalWithdraw} />
        <FixedText label="Total Deposit" text={totalDeposit} />
        <FixedText label="Total Trading Gain" text={totalGain} />
        {/*<FixedText label="Total Gain Trading Z" text={totalGainZ} />
        <FixedText label="Total Gain Trading A" text={totalGainA} />*/}
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
