import { useEffect, useState } from "react"
import { userDetails, userNetwork } from "../auth/endpoints"
import Loading from "../props/Loading"
import { LevelDisplay } from "../props/Tables"
import { FixedText } from "../props/Textt"

interface User {
  id: string
  username: string
  referred_by: string
  asset_amount: string | undefined
}

export interface LevelProps {
  users: User[]
}

const Network = () => {

  const [level1, setLevel1] = useState<User[]>([])
  const [level2, setLevel2] = useState<User[]>([])
  const [level3, setLevel3] = useState<User[]>([])
  const [level4, setLevel4] = useState<User[]>([])
  const [level5, setLevel5] = useState<User[]>([])
  const [userId, setUserId] = useState<string>('')
  const [totalAsset, setTotalAsset] = useState<number>(0)
  const [totalUser, setTotalUser] = useState<number>(0)

  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await userNetwork()
      setLevel1(response.level_1 || [])
      setLevel2(response.level_2 || [])
      setLevel3(response.level_3 || [])
      setLevel4(response.level_4 || [])
      setLevel5(response.level_5 || [])
      setTotalAsset(response.total_asset || 0)
      setTotalUser(response.total_user || 0)
      const resID = await userDetails()
      setUserId(resID.id)
    } catch (error) {
      console.error("Error fetching network data:", error)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])


  return (
    <div className="p-3 flex flex-col items-center justify-center gap-3">
      {loading && <Loading />}
      <span className="font-bold text-xl text-white">Network</span>

      <div className="grid grid-cols-1 gap-3 max-w-full bg-white shadow-md shadow-blue-800  p-5 rounded-xl border">
        <div className="grid grid-cols-2 gap-2">
          <FixedText label="Volume Asset" text={totalAsset.toFixed(2)}/>
          <FixedText label="Total User" text={totalUser.toString()}/>
        </div>

        {level1 && <span className="font-semibold">{userId} - Level 1 - {level1.length} user</span>}
          <LevelDisplay 
            users={level1}
          />
        {level2 && <span className="font-semibold">{userId} - Level 2 - {level2.length} user</span>}
          <LevelDisplay
            users={level2}
          />
        {level3.length > 0 && 
          <div className="flex flex-col gap-2">
            <span className="font-semibold">{userId} - Level 3 - {level3.length} user</span>
            <LevelDisplay 
              users={level3}
            />
          </div>
        }
        {level4.length > 0 && 
          <div className="flex flex-col gap-2">
            <span className="font-semibold">{userId} - Level 4 - {level4.length} user</span>
            <LevelDisplay 
              users={level4}
            />
          </div>
          }
        {level5.length > 0 && 
          <div className="flex flex-col gap-2">
            <span className="font-semibold">{userId} - Level 5 - {level5.length} user</span>
            <LevelDisplay 
              users={level5}
            />
          </div>
        }
          
      </div>

      {/*<div className="w-full max-w-4xl bg-white shadow-md shadow-blue-800 p-5 rounded-xl border">
        <NetworkTree />
      </div>*/}
      
    </div>
  )
}

export default Network
