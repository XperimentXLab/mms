import { useEffect, useState } from "react"
//import Buttons from "../props/Buttons"
import { TableAssetWithdrawal, Tables } from "../props/Tables"
import { getAssetStatement, getDepositLock } from "../auth/endpoints"
import type { Data } from "./WalletStatement"
import Loading from "../props/Loading"

const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState("");

export const AssetStatement = () => {

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getDepositLock()
        setData(response)
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
    { header: "Date", accessor: "date" },
    { header: "Amount", accessor: "amount" },
    { header: 'Unlock Date', accessor: 'unlock_date' },
    { header: "Action", accessor: "action" },
  ]
  //const depositLock = true
  const [data, setData] = useState<Data[]>([])

  /*
  const dataM = [
    { date: "2023-10-01 10:03:00", amount: "100.00", unlock_date: "2024-04-01 10:03:00",
      action: depositLock ?
      <span className="text-red-500">Deposit Locked</span> :
      <Buttons type="button">Withdraw</Buttons>
    },
    { date: "2023-10-01 10:03:00", amount: "100.00", unlock_date: "2024-10-01 10:03:00",
      action: depositLock ? <span className="text-red-500">Deposit Locked</span> : <Buttons type="button">Withdraw</Buttons> }
  ]
  */

  return (
    <div>
      {loading && <Loading />}
      <span className="font-semibold">
        Asset Statement
      </span>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <TableAssetWithdrawal columns={columns} data={data} />
    </div>
  )
}


export const WithdrawalAssetStatement = () => {

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getAssetStatement()
        setData(response)
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
    { header: "Amount", accessor: "amount" },
    { header: "Type", accessor: "type" },
    { header: "Description", accessor: "description" }
  ]

  const [data, setData] = useState<Data[]>([])

  return (
    <div>
      {loading && <Loading />}
      <span className="font-semibold">
        Withdrawal Statement
      </span>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columns} data={data} />
    </div>
  )
}
