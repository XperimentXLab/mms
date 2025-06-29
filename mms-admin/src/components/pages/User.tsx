import { useEffect, useState } from "react"
import Tables, { type Data } from "../props/Tables"
import { getAllUsers } from "../auth/endpoints"
import Loading from "../props/Loading"
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

const User = () => {

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const columnsUserDetails = [
    { header: 'User ID', accessor: 'id' },
    { header: 'Username', accessor: 'username' },
    { header: 'I/C', accessor: 'ic' },
    { header: 'Email', accessor: 'email' },
    { header: 'Referral ID', accessor: 'referred_by' },
    { header: 'Joined Date', accessor: 'joined_date' },
    { header: 'Joined Time', accessor: 'joined_time' },
    { header: 'Asset', accessor: 'asset_amount' },
    { header: 'Verification', accessor: 'verification_status' },
    { header: 'I/C Document', accessor: 'ic_document' },
  ]
  const [dataUserDetails, setDataUserDetails] = useState<Data[]>([])

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const resUserDetails = await getAllUsers()
        // Format created_at for each user
        const formattedData = resUserDetails.map((user: any) => {
        const dt = dayjs.utc(user.created_at).tz("Asia/Kuala_Lumpur");
        return {
          ...user,
          joined_date: dt.format("YYYY-MM-DD"),
          joined_time: dt.format("HH:mm:ss"),
        }
      });
        setDataUserDetails(formattedData)
      } catch (error: any) {
        setErrorMessage(error.response.data.error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  },[])

  return (
    <div className="flex flex-col gap-3 m-4 justify-center">
      {loading && <Loading />}

      <span>All Users</span>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}
      <Tables columns={columnsUserDetails} data={dataUserDetails}/>

    </div>
  )
}

export default User
