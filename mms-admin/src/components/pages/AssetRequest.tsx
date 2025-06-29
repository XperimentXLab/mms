import { useEffect, useState } from "react"
import Tables from "../props/Tables"
import Loading from "../props/Loading"
import { getPendingTX } from "../auth/endpoints"
import Buttons from "../props/Buttons";
import dayjs from "dayjs";
import utc from "dayjs";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);


interface Transaction {
  id: string;
  created_date: string;
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
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})


  useEffect(() => {
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
    fetchData()
  }, [])


  const handleApprove = (id: string) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, request_status: 'APPROVED' } : tx
    ))
    // call an API to update the status
  }

  const handleReject = (id: string) => {
    const reason = rejectionReasons[id] || 'No reason provided'
    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, request_status: 'REJECTED', reference: reason } : tx
    ))
    // call an API to update the status
  }

  const handleReasonChange = (id: string, reason: string) => {
    setRejectionReasons(prev => ({ ...prev, [id]: reason }))
  }

  /*
  const isOneHourPassed = (createdDate: string) => {
    const created = new Date(createdDate)
    const now = new Date()
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return diffInHours >= 1
  }*/

  const isFiveMinutesPassed = (createdDate: string) => {
  const created = new Date(createdDate)
  const now = new Date()
  const diffInMinutes = (now.getTime() - created.getTime()) / (1000 * 60)
  return diffInMinutes >= 5
}


  const columns = [
    { header: 'Date', accessor: 'created_date' },
    { header: 'Time', accessor: 'created_time' },
    { header: 'User ID', accessor: 'user' },
    { header: 'Username', accessor: 'username' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Request Status', accessor: 'request_status' },
    { header: 'Action', accessor: 'action' }
  ]


const data = transactions.map(tx => ({
    ...tx,
    action: (
      <div className="flex gap-2">
        {tx.request_status === 'PENDING' && isFiveMinutesPassed(tx.created_date) && (
          <Buttons 
            type="button"
            disabled={tx.request_status !== 'PENDING'}
            onClick={() => handleApprove(tx.id)}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Approve
          </Buttons>
        )}
        {tx.request_status === 'PENDING' ? (
          <>
            <input
              type="text"
              placeholder="Reason for rejection"
              value={rejectionReasons[tx.id] || ''}
              onChange={(e) => handleReasonChange(tx.id, e.target.value)}
              className="border p-1 rounded text-sm"
            />
            <Buttons
              type="submit"
              onClick={() => handleReject(tx.id)}
              disabled={!rejectionReasons[tx.id]}
              className={`px-3 py-1 rounded ${rejectionReasons[tx.id] ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              Reject
            </Buttons>
          </>
        ) : tx.request_status === 'REJECTED' ? (
          <span className="text-red-500">Reject</span>
        ) : (
          <span className="text-green-500">Approve</span>
        )}
      </div>
    )
  }))


  return (
    <div className="flex m-5 justify-center flex-col">
      { loading && <Loading />}

      <span className="font-semibold">Place Asset Request</span>

      {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span> }

      <Tables columns={columns} data={data}/>
    </div>
  )
}

export default AssetRequest
