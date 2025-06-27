import { useEffect, useState } from "react"
import Tables, { type Data } from "../props/Tables"
import Loading from "../props/Loading"
import { getPendingTX } from "../auth/endpoints"


const Requests = () => {

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getPendingTX()
        setData(response)
      } catch (error: any) {
        setErrorMessage(error.response.data.error)
      } finally {
        setLoading(false)
      }
    }
    fetchData
  }, [])

  const columns = [
    { header: 'Created Date', accessor: 'created_date' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Request Status', accessor: 'request_status' },
    { header: 'Point', accessor: 'point_type' },
    { header: 'Transaction', accessor: 'transaction_type' }
  ]

  const [data, setData] = useState<Data[]>([])

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
