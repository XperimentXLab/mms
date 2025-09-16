  import { useEffect, useState, useRef } from "react"
import Loading from "../props/Loading"
import { getWDReq, processWDAsset, processWDCommission, processWDProfit } from "../auth/endpoints"
import Buttons from "../props/Buttons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Tables } from "../props/Tables";
import { Inputss } from "../props/Formss";
import { FixedText } from "../props/Textt";
import { NotiErrorAlert, NotiSuccessAlert } from "../props/Noti";
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

  const [search, setSearch] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  //const [ref, setRef] = useState<string>('')
  //const [editRef, setEditRef] = useState<string>('')
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [totalActWd, setTotalActWd] = useState<number>(0)

  type pointType = 'PROFIT' | 'COMMISSION' | 'ASSET'
  const [point, setPoint] = useState<pointType[]>()

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await getWDReq({
        search: debouncedSearch,
        status,
        startDate,
        endDate
      })
      setTotalActWd(response.total_actual_wd)
      const results = response.results || []; // fallback to empty array

      const formattedData = results.map((user: any) => {
      const dt = dayjs.utc(user.created_at).tz("Asia/Kuala_Lumpur")
      return {
        ...user,
        created_datetime: dt.format("DD/MM/YYYY hh:mm:ss")
      }
    });
      setTransactions(formattedData)

      const pointTypes: pointType[] = Array.from(new Set(formattedData.map((user: any) => user.point_type)));
      setPoint(pointTypes);
      setErrorMessage('')
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        setErrorMessage(error.response.data.error)
      } else if (error.response && error.response.status === 401) {
        setErrorMessage(error.response.data.error)
      } else {
        setErrorMessage('Error fetching withdraw request')
        console.error(error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [debouncedSearch, status, startDate, endDate])

  // Debounced search to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])
  const handleClearFilters = () => {
    setSearch("")
    setStatus("")
    setStartDate("")
    setEndDate("")
  }
  const hasActiveFilters = search || status || startDate || endDate


  const handleApprove = async (id: string) => {
    const ref = inputRefs.current[id]?.value;

    if (!ref) {
      NotiErrorAlert('Please fill in transaction id first.')
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
      NotiSuccessAlert('Transaction approved')
    } catch (error: any) {
      if (error.response && error.response.status == 400 || error.response.status == 401) {
        setErrorMessage(error.response.data.error)
        NotiErrorAlert(error.response.data.error)
      } else {
        console.error(error)
        NotiErrorAlert('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
      fetchData()
    }
  }

  const handleReject = async (id: string) => {
    const ref = inputRefs.current[id]?.value;
    if (!ref) {
      NotiErrorAlert('Please fill in rejection reason first!')
      return
    }
    
    try {
      setLoading(true)
      if (point?.includes('PROFIT')) {
        await processWDProfit({
          tx_id: id,
          action: 'Reject',
          reference: ref
        })
      }
      if (point?.includes('COMMISSION')) {
        await processWDCommission({
          tx_id: id,
          action: 'Reject',
          reference: ref
        })
      }
      if (point?.includes('ASSET')) {
        await processWDAsset({
          tx_id: id,
          action: 'Reject',
          reference: ref
        })
      }
      NotiSuccessAlert('Transaction rejected')
    } catch (error: any) {
      if (error.response && error.response.status == 400 || error.response.status == 401) {
        setErrorMessage(error.response.data.error)
        NotiErrorAlert(error.response.data.error)
      } else {
        console.error(error)
        NotiErrorAlert('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
      fetchData()
    }
  }


  const columns = [
    { header: 'Date', 
      accessor: 'created_datetime',
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
            {row.request_status_display === 'PENDING' ? (
              <div className="flex gap-2">
                <Buttons 
                  type="button"
                  disabled={row.request_status_display !== 'PENDING'}
                  onClick={() => handleApprove(row.id)}
                  className="px-3 py-1 cursor-pointer bg-green-500 text-white rounded hover:bg-green-600"
                > Approve </Buttons>
                <Buttons
                  type="submit"
                  onClick={() => handleReject(row.id)}
                  className={`px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white cursor-pointer`}
                >
                  Reject
                </Buttons>
              </div>
            ) : row.request_status_display === 'REJECTED' ? (
              <span className="text-red-500">Rejected</span>
            ) : (
              <span className="text-green-500">Approved</span>
            )}
          </div>
        )
      }
    },
  ]

  const data = transactions

  return (
    <div className="flex m-5 justify-center flex-col gap-1 ">
      { loading && <Loading />}

      <span className="font-semibold text-white">Withdrawal Request</span>

      <div className="flex flex-col bg-white gap-3 items-center p-2 rounded">

        <div className="flex flex-row w-full items-end justify-center gap-2">
          <Inputss
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search user id or username"
          />
          
          <FixedText label="Total Actual Amount Withdrawal" text={totalActWd.toFixed(2)} />

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-2 justify-center">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        
          <div className="flex flex-row items-center gap-2">
            <label className="text-sm font-medium text-gray-700 text-nowrap w-full">
              Start Date :
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-row items-center gap-2">
            <label className="text-sm font-medium text-gray-700 text-nowrap w-full">
              End Date :
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer w-full"
          >
            Clear Filters
          </button>
        )}

      </div>

      {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span> }

      <Tables columns={columns} data={data} />
    </div>
  )
}

export default WithdrawReq
