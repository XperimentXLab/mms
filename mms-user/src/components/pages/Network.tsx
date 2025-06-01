import { useEffect, useState } from "react"
import { userDetails, userNetwork } from "../auth/endpoints"
import Loading from "../props/Loading"
import { LevelDisplay } from "../props/Tables"

interface User {
  id: string
  username: string
  referred_by: string
  address_country: string | undefined
}

export interface LevelProps {
  users: User[]
}

const Network = () => {

  const [level1, setLevel1] = useState<User[]>([])
  const [level2, setLevel2] = useState<User[]>([])
  const [userId, setUserId] = useState<string>('')

  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await userNetwork()
      setLevel1(response.level_1 || [])
      setLevel2(response.level_2 || [])
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

      <span className="font-bold text-xl">Network</span>

      <div className="grid grid-cols-1 gap-3 max-w-full shadow-2xl shadow-red-300 p-5 rounded-xl border">
        {level1 && <span className="font-semibold">{userId} - Level 1 - {level1.length} user</span>}
          <LevelDisplay 
            users={level1}
          />
        {level2 && <span className="font-semibold">{userId} - Level 2 - {level2.length} user</span>}
          <LevelDisplay
            users={level2}
          />
      </div>

      {loading && <Loading />}
    </div>
  )
}

export default Network
