import { useEffect, useState } from "react"
import { getAllTransactions } from "../auth/endpoints"
import { Tables } from "../props/Tables"
import Loading from "../props/Loading"

interface TransactioDetail {
  point_type: string
  transaction_type: string
  amount: number
  description: string
  reference: string
}

const Transactionss = () => {

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [data, setData] = useState<TransactioDetail[]>([])

  const columns = [
    { header: 'Point Type', 
      accessor: 'point_type',
      render: (value: string) => value
     },
    { header: 'Transaction Type', 
      accessor: 'transaction_type',
      render: (value: string) => value
     },
    { header: 'Amount', 
      accessor: 'amount',
      render: (value: number) => value
     },
    { header: 'Description', 
      accessor: 'description',
      render: (value: string) => value
     },
    { header: 'Reference', 
      accessor: 'reference',
      render: (value: string) => value ? value : '-'
     },
  ]

  useEffect(()=> {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getAllTransactions()
        setData(response)
      } catch (error: any) {
        console.error(error)
        if (error.response && error.response.status == 400) {
          setErrorMessage(error.response.data.error)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])


  return (
    <div className="flex flex-col gap-2 justify-center m-3">
      {loading && <Loading />}
      {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span>}

      <span className="text-white">All Transactions</span>
      <Tables columns={columns} data={data} />
    </div>
  )
}

export default Transactionss
