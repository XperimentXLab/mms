import { useEffect, useState } from "react"
import { Tables } from "../props/Tables"
import { getAssetStatement, getDepositLock } from "../auth/endpoints"
import type { Data } from "./WalletStatement"
import Loading from "../props/Loading"
import Buttons from "../props/Buttons"
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);


export const AssetStatement = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");


  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getDepositLock()
        const formattedData = response.map((user: any) => {
          const dt = dayjs.utc(user.created_at).tz("Asia/Kuala_Lumpur");
          return {
            ...user,
            created_date: dt.format("YYYY-MM-DD"),
            created_time: dt.format("HH:mm:ss"),
          }
        });
        setDataRes(formattedData)
      } catch (error: any) {
        if (error.response && error.response.status === 400) {
          setErrorMessage(error.response.data.error)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const columns = [
    { header: "Date", accessor: "created_date" },
    { header: "Time", accessor: "created_time" },
    { header: "Amount", accessor: "deposit_amount" },
    { header: 'Status', accessor: 'request_status_display'},
    { header: "Amount Locked (50%)", accessor: "amount_6m_locked" },
    { header: 'Days Left', accessor: 'days_until_6m'},
    { header: "Amount Locked (50%)", accessor: "amount_1y_locked" },
    { header: 'Days Left', accessor: 'days_until_1y'},
    { header: "Available Withdraw", accessor: "withdrawable_now" },
    { header: "Action", accessor: "action" },
  ]
  
  interface AssetState {
    id: string;
    created_date: string;
    deposit_amount: number;
    amount_6m_locked: number;
    amount_6m_unlocked: number;
    amount_1y_locked: number;
    amount_1y_unlocked: number;
    days_until_6m: number;
    days_until_1y: number;
    request_status_display?: string | undefined;
    withdrawable_now: number;
  }

  const handleWithdraw = (id: string) => {
    setDataRes(prev => prev.map(asset => 
      asset.id === id ? { ...asset, action: asset.days_until_6m > 0 || asset.days_until_1y > 0 } : asset
    ))
    // call an API to update the status
  }

const [dataRes, setDataRes] = useState<AssetState[]>([])

const data = dataRes.map(asset => ({
  ...asset,
  request_status_display: (
    request_status_display === undefined ? '-' : request_status_display
  ),
  action: (
    <div className="flex gap-2">
      {asset.days_until_6m < 0 || asset.days_until_1y < 0  && (
        <Buttons 
          type="button"
          onClick={() => handleWithdraw(asset.id)}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Withdraw
        </Buttons>
      )}
    </div>
  )
  }))


  return (
    <div>
      {loading && <Loading />}
      <span className="font-semibold">
        Asset Statement
      </span>

      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columns} data={data} />
    </div>
  )
}


export const WithdrawalAssetStatement = () => {

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getAssetStatement()
        const formattedData = response.map((user: any) => {
          const dt = dayjs.utc(user.created_at).tz("Asia/Kuala_Lumpur");
          return {
            ...user,
            created_date: dt.format("YYYY-MM-DD"),
            created_time: dt.format("HH:mm:ss"),
          }
        });
        setDataRes(formattedData)
      } catch (error: any) {
        if (error.response && error.response.status === 400) {
          setErrorMessage(error.response.data.error)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const columns = [
    { header: "Date", accessor: "created_date" },
    { header: "Time", accessor: "created_time" },
    { header: "Amount", accessor: "amount" },
    { header: "Type", accessor: "transaction_type" },
    { header: "Description", accessor: "description" },
    { header: 'Status', accessor: 'request_status_display'}
  ]

  const [dataRes, setDataRes] = useState<Data[]>([])

  return (
    <div>
      {loading && <Loading />}
      <span className="font-semibold">
        Withdrawal Statement
      </span>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columns} data={dataRes} />
    </div>
  )
}
