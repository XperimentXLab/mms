import { useEffect, useState } from "react"
import { Tables, type Data } from "../props/Tables"
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
    { header: 'Joined Date', 
      accessor: 'created_date',
      render: (value: string) => value
     },
    { header: 'Joined Time', 
      accessor: 'created_time',
      render: (value: string) => value
     },
    { header: 'User ID', 
      accessor: 'id',
      render: (value: string) => value
     },
    { header: 'Username', 
      accessor: 'id',
      render: (id: string) => {
        const row = dataUserDetails.find(user => user.id === id);
        if (!row) return null;

        return (
          <span className={`${(row.asset_amount || 0) < 200 ? 'text-slate-400' : 'text-black'}`}> {/**/}
            {row.username}
          </span>
        )
      }
     },
    { header: 'I/C', 
      accessor: 'ic',
      render: (value: number) => value
     },
    { header: 'Email', 
      accessor: 'email',
      render: (value: string) => value
     },
    { header: 'Referral ID', 
      accessor: 'referred_by',
      render: (value: string) => value
     },
    { header: 'Asset', 
      accessor: 'asset_amount',
      render: (value: number | null) => value ? value : '0'
     },
    { header: 'Verification', 
      accessor: 'verification_status',
      render: (value: string) => value
     },
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
          created_date: dt.format("YYYY-MM-DD"),
          created_time: dt.format("HH:mm:ss"),
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

      <span className="text-white">All Users</span>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}
      <Tables columns={columnsUserDetails} data={dataUserDetails}
        enableSorting={true}
        enableFilters={true}
        enablePagination={true}
      />

    </div>
  )
}

export default User
