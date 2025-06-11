import React, { useState } from "react"
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
  value: number
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

  const [assetAmount, setAssetAmount] = useState(0)
  const [profitRate, setProfitRate] = useState(0) //need to be in %
  const [userProfit, setUserProfit] = useState(0);
  const [sharingRatio, setSharingRatio] = useState("");

  const [loading, setLoading] = useState<boolean>(false)

  //Performance Section
  interface PerformanceData {
    today: number;
    weekly: number;
    monthly: number;
    yearly: number[];
  }
  // = (mock data - in a real app, fetch this)
  const [performanceData] = useState<PerformanceData>({
    today: 0.14,
    weekly: 0.52,
    monthly: 1.44,
    yearly: [
      5.10, //Jan
      3.10, //Feb
      3.20, //Mar
      3.40, //Apr
      3.78, //May
      1.44, //June
    ],
  });

  // Chart data for yearly profit
  const chartData: ChartData<'bar'> = {
    labels: [
      "Jan", "Feb", "Mar", "Apr", "May", 
      "Jun"
    ],
    datasets: [
      {
        label: "Yearly Profit Total - 18.58 %",
        data: performanceData.yearly,
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
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y}%`,
        },
      },
      legend: {
        position: 'top',
      },
      // This displays the data values above each bar
      datalabels: {
        display: true,
        color: 'black',
        anchor: 'end',
        align: 'top',
        formatter: (value: number) => `${value}%`,
      }
    },
  };
  
  // Calculator Section
  const resetForm = (): void => {
    setAssetAmount(0)
    setProfitRate(0)
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
    const profit = assetAmount * (profitRate / 100); //to be %

    // Determine sharing ratio based on investment amount
    let userPercent = 0
    if (assetAmount < 1000) {
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
    <div className="flex flex-col justify-center gap-3 p-3 items-center">

      <h1 className="font-bold text-xl">Others</h1>

      <div className="flex flex-col gap-3 justify-center items-center p-3 border rounded-xl w-full shadow-2xl shadow-red-300 bg-white">
        <span className="font-bold text-md">Performance</span>

        <div className="grid grid-cols-1 gap-4">
          <div className="border p-3 rounded-lg">
            <h3 className="text-sm text-gray-500">Today's Profit</h3>
            <p className="text-xl font-bold">{performanceData.today.toLocaleString()} %</p>
          </div>
          
          <div className="border p-3 rounded-lg">
            <h3 className="text-sm text-gray-500">Weekly Profit</h3>
            <p className="text-xl font-bold">${performanceData.weekly.toLocaleString()} %</p>
          </div>
          
          <div className="border p-3 rounded-lg">
            <h3 className="text-sm text-gray-500">Monthly Profit</h3>
            <p className="text-xl font-bold">${performanceData.monthly.toLocaleString()} %</p>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Yearly Profit Trend</h3>
            <div className="h-64">
              <Bar id="YearlyPerformanceChart" data={chartData} options={chartOptions} />
          </div>
          </div>
        </div>
      </div>


      <div className="flex flex-col gap-3 justify-center items-center p-3 border rounded-xl w-full shadow-2xl shadow-red-300 bg-white">

        <span className="font-bold text-md items-start">Calculator</span>

        <form className="grid grid-rows-1 gap-2" onSubmit={toggleCalculate}>
          <ValueCalculator
            label="Asset Amount"
            placeholder="Enter amount"
            onChange={(e) => {
              setAssetAmount(Number(e.target.value));
            }}
            value={assetAmount}
          />
          <ValueCalculator
            label="Profit Rate (%)"
            placeholder="Enter rate"
            onChange={(e) => {
              setProfitRate(Number(e.target.value));
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
