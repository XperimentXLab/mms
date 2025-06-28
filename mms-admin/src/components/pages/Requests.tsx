import { useEffect, useState } from "react"
import Tables from "../props/Tables"
import Loading from "../props/Loading"
import { getPendingTX } from "../auth/endpoints"


interface Transaction {
  id: string;
  created_date: string;
  amount: number;
  request_status: 'pending' | 'approved' | 'rejected';
  point_type: string;
  transaction_type: string;
  description: string;
  reference?: string; // Reason for rejection
}

const Requests = () => {

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')


  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getPendingTX()
        setTransactions(response)
      } catch (error: any) {
        setErrorMessage(error.response.data.error)
      } finally {
        setLoading(false)
      }
    }
    fetchData
  }, [])


  const handleApprove = (id: string) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, request_status: 'approved' } : tx
    ))
    // call an API to update the status
  }

  const handleReject = (id: string) => {
    const reason = rejectionReasons[id] || 'No reason provided'
    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, request_status: 'rejected', reference: reason } : tx
    ))
    // call an API to update the status
  }

  const handleReasonChange = (id: string, reason: string) => {
    setRejectionReasons(prev => ({ ...prev, [id]: reason }))
  }

  const isOneHourPassed = (createdDate: string) => {
    const created = new Date(createdDate)
    const now = new Date()
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return diffInHours >= 1
  }


  const columns = [
    { header: 'Created Date', accessor: 'createdDate' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Request Status', accessor: 'request_status' },
    { header: 'Point', accessor: 'point_type' },
    { header: 'Transaction', accessor: 'transaction_type' },
    { header: 'Description', accessor: 'description' },
    { header: 'Reference', accessor: 'reference' },
    { header: 'Action', accessor: 'action' }
  ]


const data = transactions.map(tx => ({
    ...tx,
    action: (
      <div className="flex gap-2">
        {tx.request_status === 'pending' && isOneHourPassed(tx.created_date) && (
          <button 
            onClick={() => handleApprove(tx.id)}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Approve
          </button>
        )}
        {tx.request_status === 'pending' ? (
          <>
            <input
              type="text"
              placeholder="Reason for rejection"
              value={rejectionReasons[tx.id] || ''}
              onChange={(e) => handleReasonChange(tx.id, e.target.value)}
              className="border p-1 rounded text-sm"
            />
            <button
              onClick={() => handleReject(tx.id)}
              disabled={!rejectionReasons[tx.id]}
              className={`px-3 py-1 rounded ${rejectionReasons[tx.id] ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              Reject
            </button>
          </>
        ) : tx.request_status === 'rejected' ? (
          <span className="text-red-500">Rejected</span>
        ) : (
          <span className="text-green-500">Approved</span>
        )}
      </div>
    )
  }))


  return (
    <div className="flex m-5 justify-center flex-col">
      { loading && <Loading />}

      <span className="font-semibold">Requests</span>

      {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span> }

      <Tables columns={columns} data={data}/>
    </div>
  )
}

export default Requests
