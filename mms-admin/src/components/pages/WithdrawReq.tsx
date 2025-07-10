  import { useEffect, useState, useRef } from "react"
import Loading from "../props/Loading"
import { getWDReq, processWDAsset, processWDCommission, processWDProfit } from "../auth/endpoints"
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
  actual_amount: number
  request_status_display: 'PENDING' | 'APPROVED' | 'REJECTED';
  point_type: string;
  transaction_type: string;
  description?: string;
  reference?: string;
}

const WithdrawReq = () => {

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  //const [ref, setRef] = useState<string>('')
  //const [editRef, setEditRef] = useState<string>('')
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [transactions, setTransactions] = useState<Transaction[]>([])

  type pointType = 'PROFIT' | 'COMMISSION' | 'ASSET'
  const [point, setPoint] = useState<pointType[]>()

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await getWDReq()
      const formattedData = response.map((user: any) => {
      const dt = dayjs.utc(user.created_at).tz("Asia/Kuala_Lumpur");
      return {
        ...user,
        created_date: dt.format("YYYY-MM-DD"),
        created_time: dt.format("HH:mm:ss"),
        created_datetime: dt.format("YYYY-MM-DD HH:mm:ss"),
      }
    });
      setTransactions(formattedData)
      const pointTypes: pointType[] = Array.from(new Set(response.map((user: any) => user.point_type)));
      setPoint(pointTypes);
    } catch (error: any) {
      if (error.response && error.response.status == 400 || error.response.status == 401) {
        setErrorMessage(error.response.data.error)
        alert(error.response.data.error)
      } else {
        console.error(error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])


  const handleApprove = async (id: string) => {
    const ref = inputRefs.current[id]?.value;

    if (!ref) {
      alert('Please fill in transaction id first.')
      return
    }

    try {
      setLoading(true)
      if (point?.includes('PROFIT')) {
        await processWDProfit({
          tx_id: id,
          action: 'Approve',
          reference: ref
        })
      }
      if (point?.includes('COMMISSION')) {
        await processWDCommission({
          tx_id: id,
          action: 'Approve',
          reference: ref
        })
      }
      if (point?.includes('ASSET')) {
        await processWDAsset({
          tx_id: id,
          action: 'Approve',
          reference: ref
        })
      }
      alert('Transaction approved')
    } catch (error: any) {
      if (error.response && error.response.status == 400 || error.response.status == 401) {
        setErrorMessage(error.response.data.error)
        alert(error.response.data.error)
      } else {
        console.error(error)
      }
    } finally {
      setLoading(false)
      fetchData()
    }
  }

  const handleReject = async (id: string) => {
    const ref = inputRefs.current[id]?.value;
    if (!ref) {
      alert('Please fill in rejection reason first!')
      return
    }
    
    try {
      setLoading(true)
      if (point?.includes('PROFIT')) {
        await processWDProfit({
          tx_id: id,
          action: 'Approve',
          reference: ref
        })
      }
      if (point?.includes('COMMISSION')) {
        await processWDCommission({
          tx_id: id,
          action: 'Approve',
          reference: ref
        })
      }
      if (point?.includes('ASSET')) {
        await processWDAsset({
          tx_id: id,
          action: 'Approve',
          reference: ref
        })
      }
      alert('Transaction rejected')
    } catch (error: any) {
      if (error.response && error.response.status == 400 || error.response.status == 401) {
        setErrorMessage(error.response.data.error)
        alert(error.response.data.error)
      } else {
        console.error(error)
      }
    } finally {
      setLoading(false)
      fetchData()
    }
  }


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
      accessor: 'user_id',
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
    {
      header: 'Point',
      accessor: 'point_type',
      render: (value: string) => value
    },
    {
      header: 'Wallet Address',
      accessor: 'wallet_address',
      render: (value: string) => value
     },
    { header: 'Actual Amount', 
      accessor: 'actual_amount',
      render: (value: number) => value
    },
    { header: 'Request Status', 
      accessor: 'request_status_display',
      render: (value: string) => value ?  value : 'PENDING'
     },
    { header: 'Reference', 
      accessor: 'id',
      render: (id: string) => {
        
        const row = transactions.find(user => user.id === id);
        if (!row) return null;
        
        return row.reference ? row.reference :
          <input
            ref={(el) => {
              inputRefs.current[id] = el;
            }}
            defaultValue=""
            placeholder="tx id / rejection reason"
            className="px-2 py-1 border rounded"
          /> 
      }
    },
    { header: 'Action', accessor: 'id',
      render: (id: string) => {

        const row = transactions.find(user => user.id === id);
        if (!row) return null;

        return (
          <div className="flex gap-2">
            {row.request_status_display === 'PENDING' && (
              <Buttons 
                type="button"
                disabled={row.request_status_display !== 'PENDING'}
                onClick={() => handleApprove(row.id)}
                className="px-3 py-1 cursor-pointer bg-green-500 text-white rounded hover:bg-green-600"
              > Approve </Buttons>
            )}
            {row.request_status_display === 'PENDING' ? (
              <Buttons
                type="submit"
                onClick={() => handleReject(row.id)}
                className={`px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white cursor-pointer`}
              >
                Reject
              </Buttons>
            ) : row.request_status_display === 'REJECTED' ? (
              <span className="text-red-500">Reject</span>
            ) : (
              <span className="text-green-500">Approve</span>
            )}
          </div>
        )
      }
    },
  ]

  const data = transactions

  return (
    <div className="flex m-5 justify-center flex-col">
      { loading && <Loading />}

      <span className="font-semibold text-white">Withdrawal Request</span>

      {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span> }

      <Tables columns={columns} data={data}
        enableFilters={true}
        enablePagination={true}
        enableSorting={true}
      />
    </div>
  )
}

export default WithdrawReq
