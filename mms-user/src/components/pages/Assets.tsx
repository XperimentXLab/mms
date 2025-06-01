import { useEffect, useState } from "react"
import Loading from "../props/Loading"
import Buttons from "../props/Buttons"
import Spannn from "../props/Textt"


const Assets = () => {

  const [registerPointBalance, setRegisterPointBalance] = useState<number>(0)
  const [asset, setAsset] = useState<number>(0)

  const [placeAssetAmount, setPlaceAssetAmount] = useState<number>(0)
  const [withdrawAssetAmount, setWithdrawAssetAmount] = useState<number>(0)

  const [loading, setLoading] = useState<boolean>(true)

  const resetForm = () => {
    setPlaceAssetAmount(0)
    setWithdrawAssetAmount(0)
  }


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setRegisterPointBalance(0)
        setAsset(0)
      } catch (error: any) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }
      fetchData()
  }, [])

  
  const togglePlaceAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    resetForm()
  }

  const toggleWithdrawAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    resetForm()
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <span className="font-bold text-xl">Asset</span>

      <div className="flex flex-col gap-3 border rounded-xl p-3">
        <Spannn label="Register Point Balance">{registerPointBalance}</Spannn>
        <form className="flex gap-1.5" onSubmit={togglePlaceAsset}>
          <input type="number" placeholder="Enter amount" 
            className="border py-1 px-2 rounded-md"
            onChange={e => setPlaceAssetAmount(Number(e.target.value))}
            value={placeAssetAmount}
          />
          <Buttons type="submit" >Place Asset</Buttons>
        </form>
      </div>

      <div className="flex flex-col gap-3 border rounded-xl p-3">
        <Spannn label="Asset">{asset}</Spannn>
        <form className="flex gap-1.5" onSubmit={toggleWithdrawAsset}>
          <input type="number" placeholder="Enter amount"
            className="border py-1 px-2 rounded-md"
            onChange={e => setWithdrawAssetAmount(Number(e.target.value))}
            value={withdrawAssetAmount}
          />
          <Buttons type="submit">Withdraw</Buttons>
        </form>
      </div>

      {loading && <Loading />}

    </div>
  )
}

export default Assets
