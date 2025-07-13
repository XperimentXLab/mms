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
      render: (value: string) => value
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
    </div>
  )
}

export default Transactionss
