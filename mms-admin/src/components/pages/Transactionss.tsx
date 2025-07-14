import { useEffect, useState } from "react"
import { getAllAssetTX, getAllCommissionTX, getAllMasterTX, getAllProfitTX } from "../auth/endpoints"
import { Tables } from "../props/Tables"
import Loading from "../props/Loading"
import Buttons from "../props/Buttons"
import dayjs from "dayjs";
import utc from "dayjs";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

interface TransactioDetail {
  created_date: string
  created_time: string
  user: string;
  username: string
  request_status: string
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
    { header: 'Date',
      accessor: 'created_date',
      cell: (info: string) => info
    },
    { header: 'Time',
      accessor: 'created_time',
      render: (value: string) => value
    },
    { header: 'User',
      accessor: 'user',
      render: (value: string) => value
    },
    { header: 'Username',
      accessor: 'username',
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
    { header: 'Status',
      accessor: 'request_status',
      render: (value: string) => value ? value : '-'
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

  /*
    const columns: ColumnDef<any, any>[] = [
    {
      accessorKey: "created_date",
      header: "Date",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "created_time",
      header: "Time",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "user",
      header: "User",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "username",
      header: "Username",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "transaction_type",
      header: "Transaction Type",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: info => info.getValue(), // You can format with `toFixed(2)` if needed
    },
    {
      accessorKey: "request_status",
      header: "Status",
      cell: info => info.getValue() || "-",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: info => info.getValue(),
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: info => info.getValue() || "-",
    },
  ]
  */

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await getAllMasterTX()
      const formattedData = response.map((tx: any) => {
        const dt = dayjs.utc(tx.created_at).tz("Asia/Kuala_Lumpur");
        return {
          ...tx,
          created_date: dt.format("YYYY-MM-DD"),
          created_time: dt.format("HH:mm:ss")
        }
      });
      setData(formattedData)
    } catch (error: any) {
      if (error.response && error.response.status == 400) {
        console.error(error)
        setErrorMessage(error.response.data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    fetchData()
  }, [])

  const toggleMasterTx = async () => {
    try {
      setLoading(true)
      const response = await getAllMasterTX()
      const formattedData = response.map((tx: any) => {
        const dt = dayjs.utc(tx.created_at).tz("Asia/Kuala_Lumpur");
        return {
          ...tx,
          created_date: dt.format("YYYY-MM-DD"),
          created_time: dt.format("HH:mm:ss")
        }
      });
      setData(formattedData)
    } catch (error: any) {
      if (error.response && error.response.status == 400) {
        console.error(error)
        setErrorMessage(error.response.data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleProfitTx = async () => {
    try {
      setLoading(true)
      const response = await getAllProfitTX()
      const formattedData = response.map((tx: any) => {
      const dt = dayjs.utc(tx.created_at).tz("Asia/Kuala_Lumpur");
        return {
          ...tx,
          created_date: dt.format("YYYY-MM-DD"),
          created_time: dt.format("HH:mm:ss")
        }
      });
      setData(formattedData)
    } catch (error: any) {
      if (error.response && error.response.status == 400) {
        console.error(error)
        setErrorMessage(error.response.data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleCommissionTx = async () => {
    try {
      setLoading(true)
      const response = await getAllCommissionTX()
      const formattedData = response.map((tx: any) => {
      const dt = dayjs.utc(tx.created_at).tz("Asia/Kuala_Lumpur");
        return {
          ...tx,
          created_date: dt.format("YYYY-MM-DD"),
          created_time: dt.format("HH:mm:ss")
        }
      });
      setData(formattedData)
    } catch (error: any) {
      if (error.response && error.response.status == 400) {
        console.error(error)
        setErrorMessage(error.response.data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleAssetTx = async () => {
    try {
      setLoading(true)
      const response = await getAllAssetTX()
      const formattedData = response.map((tx: any) => {
      const dt = dayjs.utc(tx.created_at).tz("Asia/Kuala_Lumpur");
        return {
          ...tx,
          created_date: dt.format("YYYY-MM-DD"),
          created_time: dt.format("HH:mm:ss")
        }
      });
      setData(formattedData)
    } catch (error: any) {
      if (error.response && error.response.status == 400) {
        console.error(error)
        setErrorMessage(error.response.data.error)
      }
    } finally {
      setLoading(false)
    }
  }

  /*
  const AllTx = () => {
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("")
    const [transactionType, setTransactionType] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    return (
      <div className="space-y-6 p-6 bg-white">
        {/* Example filters }
        <div className="space-x-4 flex items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="border px-3 py-2 rounded"
          />
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
          {/* Add transactionType, startDate, endDate as needed }
        </div>

        {/* The actual table }
        <TxTable
          columns={columns}
          search={search}
          status={status}
          transactionType={transactionType}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    )
  }*/


  return (
    <div className="flex flex-col gap-2 items-center justify-center m-3">
      {loading && <Loading />}
      {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span>}

      <span className="font-semibold text-white">Transactions</span>

      <nav className="flex flex-row gap-2 justify-center items-center">
        <Buttons
          type="button"
          onClick={toggleMasterTx}
        >Register Point</Buttons>
        <Buttons
          type="button"
          onClick={toggleProfitTx}
        >Profit Point</Buttons>
        <Buttons
          type="button"
          onClick={toggleCommissionTx}
        >Commission Point</Buttons>
        <Buttons
          type="button"
          onClick={toggleAssetTx}
        >Asset Point</Buttons>
      </nav>

      <Tables columns={columns} data={data} 
        enableFilters={true}
        enablePagination={true}
        enableSorting={true}
      />

      {/*<AllTx />*/}
    </div>
  )
}

export default Transactionss
