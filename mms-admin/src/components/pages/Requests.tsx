import { useEffect, useState } from "react"
import Tables from "../props/Tables"
import Loading from "../props/Loading"
import { getPendingTX } from "../auth/endpoints"


const Requests = () => {

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')


  const [createdDate, setCreatedDate] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)
  const [requestStatus, setRequestStatus] = useState<string>('')
  const [pointType, setPointType] = useState<string>('')
  const [transactionType, setTransactionType] = useState<string>('')


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getPendingTX()
        setCreatedDate(response.created_date)
        setAmount(response.amount)
        setRequestStatus(response.request_status)
        setPointType(response.point_type)
        setTransactionType(response.transaction_type)
      } catch (error: any) {
        setErrorMessage(error.response.data.error)
      } finally {
        setLoading(false)
      }
    }
    fetchData
  }, [])

  const columns = [
    { header: 'Created Date', accessor: 'createdDate' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Request Status', accessor: 'request_status' },
    { header: 'Point', accessor: 'point_type' },
    { header: 'Transaction', accessor: 'transaction_type' },
    { header: 'Action', accessor: 'action' }
  ]

  const data = [
    { createdDate: createdDate, amount: amount, request_status: requestStatus, point_type: pointType, transaction_type: transactionType, action:
      requestStatus === 'pending' ? 'Approved' : 'Rejected'
    },
  ]

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
