import React, { useState } from "react"
import Loading from "../props/Loading"
import Buttons from "../props/Buttons"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  // = (mock data - in a real app, fetch this)
  const [performanceData] = useState({
    today: 250,
    weekly: 750,
    monthly: 7500,
    yearly: [
      4000, //Jan
      3500, //Feb
      4200, //Mar
      5800, //Apr
      6500, //May
      7200, //June
      4500, //July
      6200, //Aug
      6000, //Sept
      7500, //Oct
      4000, //Nov
      5500, //Dec
    ],
  });

  // Chart data for yearly profit
  const chartData = {
    labels: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ],
    datasets: [
      {
        label: "Yearly Profit",
        data: performanceData.yearly,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
        fill: false,
      },
    ],
  };


  
  // Calculator Section
  const resetForm = () => {
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
            <p className="text-xl font-bold">${performanceData.today.toLocaleString()}</p>
          </div>
          
          <div className="border p-3 rounded-lg">
            <h3 className="text-sm text-gray-500">Weekly Profit</h3>
            <p className="text-xl font-bold">${performanceData.weekly.toLocaleString()}</p>
          </div>
          
          <div className="border p-3 rounded-lg">
            <h3 className="text-sm text-gray-500">Monthly Profit</h3>
            <p className="text-xl font-bold">${performanceData.monthly.toLocaleString()}</p>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Yearly Profit Trend</h3>
            <div className="h-64">
              <Line data={chartData} options={{ maintainAspectRatio: false }} />
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
