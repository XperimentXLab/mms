import { useEffect, useState } from "react"
import Loading from "../props/Loading"
import Buttons from "../props/Buttons"
import Spannn from "../props/Textt"
import { InfoPlaceAsset } from "../props/Info"
import { getAsset, getWallet, placeAsset } from "../auth/endpoints"


const Assets = () => {

  const [masterBalance, setMasterBalance] = useState<number>(0)
  const [assetBalance, setAssetBalance] = useState<number>(0)

  const [placeAssetPoint, setPlaceAssetPoint] = useState<number>(0)

  const [loading, setLoading] = useState<boolean>(true)

  const resetForm = () => {
    setPlaceAssetPoint(0)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const resWallet = await getWallet()
      const resAsset = await getAsset()
      setMasterBalance(resWallet.master_point_balance || 0)
      setAssetBalance(resAsset.amount || 0)
    } catch (error: any) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchData()
  }, [])

  
  const handlePlaceAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (placeAssetPoint <= 0) {
        alert('Please enter a valid amount.')
      }
      await placeAsset({
        amount: placeAssetPoint
      })
      alert('Asset placement request submitted!')
      setPlaceAssetPoint(0)
      resetForm()
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data.error)
      } else {
        alert(error.response.data.error)
      }
    } finally {
      setLoading(false)
      fetchData()
    }
  }


  return (
    <div className="flex flex-col items-center gap-4 p-4">

      <div className="flex flex-col gap-3 border rounded-xl p-3 w-fit shadow-lg shadow-red-600 bg-white">
        <Spannn label="Total Asset">{assetBalance}</Spannn>
        <Spannn label="Register Point">{masterBalance}</Spannn>
        <form className="flex gap-1.5" onSubmit={handlePlaceAsset}>
          <input type="number" placeholder="Enter amount" 
            className="border py-1 px-2 rounded-md"
            onChange={e => setPlaceAssetPoint(Number(e.target.value))}
            value={String(placeAssetPoint)}
          />
          <Buttons type="submit" >Place Asset</Buttons>
        </form>
        <InfoPlaceAsset />
      </div>


      {loading && <Loading />}

    </div>
  )
}

export default Assets
