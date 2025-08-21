import { useState } from "react"
import Loading from "../../props/Loading"
import Buttons from "../../props/Buttons"


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

const Calculator = () => {

   const [loading, setLoading] = useState<boolean>(false)

  const [assetAmount, setAssetAmount] = useState<string>('')
  const [profitRate, setProfitRate] = useState<string>('')
  const [userProfit, setUserProfit] = useState(0);
  const [sharingRatio, setSharingRatio] = useState("");


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
    <div className="flex flex-col gap-3 justify-center items-center p-3 border rounded-xl w-full shadow-md shadow-blue-800 bg-white">

      {loading && <Loading />}

        <span className="font-bold text-xl items-start font-['Concert_One']">Calculator</span>

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
        </form>

        {sharingRatio && (
          <>
            <div className="border p-2 rounded-md w-full">
              <h2 className="font-semibold">Profit Sharing: <span className="font-normal">{sharingRatio}</span></h2>
            </div>
            <div className="border p-2 rounded-md w-full">
              <h2 className="font-semibold">Profit: <span className="font-normal">{userProfit.toFixed(2)}</span></h2>
            </div>
          </>
        )}

        
      </div>
  )
}

export default Calculator
