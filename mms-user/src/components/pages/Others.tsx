import React, { useEffect, useState } from "react"
import Loading from "../props/Loading"
import Buttons from "../props/Buttons"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartOptions, ChartData } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels"
import { Bar } from "react-chartjs-2";
import { getFinalizedYearlyProfits, getProfit, type FinalizedMonthlyProfit } from "../auth/endpoints";
import { SelectYear } from "../props/DropDown";

ChartJS.register(
  CategoryScale,
  BarElement,
  ChartDataLabels,
  LinearScale,
  Title,
  Tooltip,
  Legend
);


interface CalculatorProps {
  label: string
  placeholder?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  value: number | string
}

const ValueCalculator: React.FC<CalculatorProps> = ({
  label, onChange, value, placeholder
}) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="font-bold">{label}</label>
      <input type="number" placeholder={placeholder}
        onChange={onChange} 
        value={value} 
        className="border p-2 rounded-md"
      />
    </div>
  )
}

const Others = () => {

  const [assetAmount, setAssetAmount] = useState<string>('')
  const [profitRate, setProfitRate] = useState<string>('')
  const [userProfit, setUserProfit] = useState(0);
  const [sharingRatio, setSharingRatio] = useState("");

  // States for operational profits (from get_profit -> manage_operational_profit)
  const [todayOperationalProfit, setTodayOperationalProfit] = useState<number>(0)
  const [weeklyOperationalProfit, setWeeklyOperationalProfit] = useState<number>(0)
  const [monthlyOperationalProfit, setMonthlyOperationalProfit] = useState<number>(0)

  // States for finalized yearly profits chart (from get_finalized_yearly_profits -> manage_monthly_finalized_profit)
  const [finalizedYearlyProfits, setFinalizedYearlyProfits] = useState<FinalizedMonthlyProfit[]>([]);
  const currentYear = new Date().getFullYear().toString();
  const [selectedChartYear, setSelectedChartYear] = useState<string>(currentYear);
  const [chartYearlyTotal, setChartYearlyTotal] = useState<number>(0);
  const [chartError, setChartError] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false)

  // Fetch operational profits (today, weekly, monthly)
  useEffect(() => {
    const fetchOperationalData = async () => {
      try {
        setLoading(true)
        const response = await getProfit()
        setTodayOperationalProfit(response.daily_profit_rate || 0)
        setWeeklyOperationalProfit(response.weekly_profit_rate || 0)
        setMonthlyOperationalProfit(response.current_month_profit || 0)
        //const responseYearlyProfit = await get_finalized_yearly_profits(Number(currentYear))
      } catch (error: any) {
        console.error('Error fetching operational profit data:', error);
      } finally {
        setLoading(false) // Be mindful if other fetches also use this
      }
    }
    fetchOperationalData()
  }, [])

  // Fetch finalized yearly profits for the chart
  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedChartYear) return;
      setLoading(true);
      setChartError("");
      try {
        const yearNum = parseInt(selectedChartYear, 10);
        const data = await getFinalizedYearlyProfits(yearNum);
        setFinalizedYearlyProfits(data);
        const total = (data.reduce((sum, item) => sum + (parseFloat(String(item.finalized_profit_rate)) || 0), 0));
        setChartYearlyTotal(total);

      } catch (error: any) {
        console.error(`Error fetching finalized yearly profits for ${selectedChartYear}:`, error);
        setChartError(`Failed to load profit data for ${selectedChartYear}.`);
        setFinalizedYearlyProfits([]);
        setChartYearlyTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, [selectedChartYear]);


  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Chart data for yearly profit
  const chartData: ChartData<'bar'> = {
    labels: finalizedYearlyProfits.map(item => monthNames[item.month - 1]).filter(Boolean),
    datasets: [
      {
        label: `Profit ${selectedChartYear} - Total: ${chartYearlyTotal.toFixed(2)} %`,
        data: finalizedYearlyProfits.map(item => item.finalized_profit_rate || 0),
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 1,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        type: 'linear',
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}%`,
          color: 'white',
        },
      },
      x: {
        ticks: {
          color: 'white',
        },
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y}%`,
        },
      },
      legend: {
        position: 'top',
        labels: {
          color: 'white',
        },
      },
      // This displays the data values above each bar
      datalabels: {
        display: true,
        color: 'white',
        anchor: 'end',
        align: 'top',
        formatter: (value: number) => `${value}%`,
      }
    },
  };
  
  // Calculator Section
  const resetForm = (): void => {
    setAssetAmount('')
    setProfitRate('')
    setUserProfit(0)
    setSharingRatio("")
  }

  const toggleCalculate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!assetAmount || !profitRate) {
      alert("Please fill in all fields to calculate.");
      return;
    }

    setLoading(true);

    // Calculate total profit
    const profit = Number(assetAmount) * (Number(profitRate) / 100); //to be %

    // Determine sharing ratio based on investment amount
    let userPercent = 0
    if (Number(assetAmount) < 10000) {
      userPercent = 0.7; // 70%
      setSharingRatio("70/30");
    } else {
      userPercent = 0.8; // 80%
      setSharingRatio("80/20");
    }

    // Calculate shares
    setUserProfit(profit * userPercent);

    setLoading(false);
  };

  return (
    <div className="flex flex-col justify-center gap-3 p-3 items-center mb-3">

      <h1 className="font-bold text-xl text-white">Others</h1>

      <div className="flex flex-col gap-3 justify-center items-center p-3 border rounded-xl w-full shadow-md shadow-blue-800 bg-transparent">
        <span className="font-bold text-md items-center text-white">Performance</span>

        <div className="grid grid-cols-1 gap-4 w-full ">
          <div className="border p-3 rounded-lg text-center bg-white">
            <h3 className="text-sm text-gray-500">Today's Profit</h3>
            <p className="text-xl font-bold">{todayOperationalProfit.toLocaleString()} %</p>
          </div>
          
          <div className="border p-3 rounded-lg text-center bg-white">
            <h3 className="text-sm text-gray-500">Weekly Profit</h3>
            <p className="text-xl font-bold">{weeklyOperationalProfit.toLocaleString()} %</p>
          </div>
          
          <div className="border p-3 rounded-lg text-center bg-white">
            <h3 className="text-sm text-gray-500">Monthly Profit</h3>
            <p className="text-xl font-bold">{monthlyOperationalProfit.toLocaleString()} %</p>
          </div>
        </div>  
        
        <div className="pt-3 w-full inset-shadow-xs inset-shadow-blue-800 backdrop-blur-md rounded-xl">
          <h3 className="text-lg font-semibold mb-2 text-center text-white ">Yearly Profit Trend</h3>
          <div className="mb-4 mx-auto max-w-xs bg-white rounded-xl py-1">
            <SelectYear 
              value={selectedChartYear} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedChartYear(e.target.value)} 
            />
          </div>
          {chartError && <p className="text-red-500 text-center my-2">{chartError}</p>}
          {finalizedYearlyProfits.length > 0 ? (
            <div className="h-64 md:h-96 px-1"> {/* Responsive height */}
              <Bar id="YearlyPerformanceChart" data={chartData} options={chartOptions} />
            </div>
          ) : (
            !loading && !chartError && <p className="text-center text-gray-500 my-2">No profit data available for {selectedChartYear}.</p>
          )}
        </div>
      </div>


      <div className="flex flex-col gap-3 justify-center items-center p-3 border rounded-xl w-full shadow-md shadow-blue-800 bg-white">

        <span className="font-bold text-md items-start">Calculator</span>

        <form className="grid grid-rows-1 gap-2" onSubmit={toggleCalculate}>
          <ValueCalculator
            label="Asset Amount"
            placeholder="Enter amount"
            onChange={(e) => {
              setAssetAmount(e.target.value);
            }}
            value={assetAmount}
          />
          <ValueCalculator
            label="Profit Rate (%)"
            placeholder="Enter rate"
            onChange={(e) => {
              setProfitRate(e.target.value);
            }}
            value={profitRate}
          />
          <Buttons type="submit">Calculate</Buttons>
          <Buttons type="button" onClick={resetForm}>
            Reset
          </Buttons>

          {sharingRatio && (
            <>
              <div className="border p-2 rounded-md">
                <h2 className="font-semibold">Profit Sharing: <span className="font-normal">{sharingRatio}</span></h2>
              </div>
              <div className="border p-2 rounded-md">
                <h2 className="font-semibold">Profit: <span className="font-normal">{userProfit.toFixed(2)}</span></h2>
              </div>
            </>
          )}
        </form>
      </div>

      {loading && <Loading />}

    </div>
  )
}

export default Others
