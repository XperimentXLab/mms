import { useEffect, useState } from "react"
import Loading from "../props/Loading"
import { getPendingTX, processPlaceAsset } from "../auth/endpoints"
import Buttons from "../props/Buttons";
import dayjs from "dayjs";
import utc from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { Tables } from "../props/Tables";
dayjs.extend(utc);
dayjs.extend(timezone);


interface Transaction {
  id: string;
  created_date: string;
  created_time: string;
  created_datetime: string;
  username: string; 
  amount: number;
  request_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  point_type: string;
  transaction_type: string;
  description: string;
  reference?: string; // Reason for rejection
}

const AssetRequest = () => {

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [transactions, setTransactions] = useState<Transaction[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await getPendingTX()
      const formattedData = response.map((user: any) => {
      const dt = dayjs.utc(user.created_at).tz("Asia/Kuala_Lumpur");
      return {
        ...user,
        created_date: dt.format("YYYY-MM-DD"),
        created_time: dt.format("HH:mm:ss"),
        created_datetime: dt.format("YYYY-MM-DD HH:mm:ss"),
        username: user.username,
      }
    });
      setTransactions(formattedData)
    } catch (error: any) {
      setErrorMessage(error.response.data.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])


  const handleApprove = (id: string) => {
    const fetchDataA = async () => {
      try {
        setLoading(true)
        await processPlaceAsset({
          tx_id: id,
          action: 'Approve'
        })
        alert('Transaction approved')
      } catch (error: any) {
        setErrorMessage(error.response.data.error)
      } finally {
        setLoading(false)
        fetchData()
      }
    }
    fetchDataA()
  }

  const handleReject = (id: string) => {
    const fetchDataPA = async () => {
      try {
        setLoading(true)
        await processPlaceAsset({
          tx_id: id,
          action: 'Reject'
        })
        alert('Transaction rejected')
      } catch (error: any) {
        setErrorMessage(error.response.data.error)
      } finally {
        setLoading(false)
        fetchData()
      }
    }
    fetchDataPA()
  }

  /*
  const isOneHourPassed = (createdDate: string) => {
    const created = dayjs(created_datetime)
    const now = dayjs()
    const diffInHours = now.diff(created, 'hours')
    return diffInHours >= 1
  }

  const isFiveMinutesPassed = (created_datetime: string) => {
    const created = dayjs(created_datetime)
    const now = dayjs()
    const diffInMinutes = now.diff(created, 'minutes')
    return diffInMinutes >= 5
  }*/


  const columns = [
    { header: 'Date', 
      accessor: 'created_date',
      render: (value: string) => value
     },
    { header: 'Time', 
      accessor: 'created_time',
      render: (value: string) => value
     },
    { header: 'User ID', 
      accessor: 'user',
      render: (value: string) => value
     },
    { header: 'Username', 
      accessor: 'username',
      render: (value: string) => value
     },
    { header: 'Amount', 
      accessor: 'amount',
      render: (value: number) => value
     },
    { header: 'Request Status', 
      accessor: 'request_status',
      render: (value: string) => value ?  value : 'PENDING'
     },
    { header: 'Action', accessor: 'id',
      render: (id: string) => {

      const row = transactions.find(user => user.id === id);
      if (!row) return null;

      return (
        <div className="flex gap-2">
          {row.request_status === 'PENDING' && (
            <Buttons 
              type="button"
              disabled={row.request_status !== 'PENDING'}
              onClick={() => handleApprove(row.id)}
              className="px-3 py-1 cursor-pointer bg-green-500 text-white rounded hover:bg-green-600"
            > Approve </Buttons>
          )}
          {row.request_status === 'PENDING' ? (
            <Buttons
              type="submit"
              onClick={() => handleReject(row.id)}
              className={`px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white cursor-pointer`}
            >
              Reject
            </Buttons>
          ) : row.request_status === 'REJECTED' ? (
            <span className="text-red-500">Reject</span>
          ) : (
            <span className="text-green-500">Approve</span>
          )}
        </div>
      )
    }}
  ]


  const data = transactions

  return (
    <div className="flex m-5 justify-center flex-col">
      { loading && <Loading />}

      <span className="font-semibold">Place Asset Request</span>

      {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span> }

      <Tables columns={columns} data={data}
        enableFilters={true}
      />
    </div>
  )
}

export default AssetRequest
