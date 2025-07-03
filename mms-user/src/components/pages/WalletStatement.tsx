import { useEffect, useState } from "react";
import { Tables } from "../props/Tables";
import Spannn from "../props/Textt"
import { userDetails, getCommissionStatement, getConvertStatement, getProfitCommissionWDStatement, getProfitStatement, getTransferStatement } from "../auth/endpoints";
import Loading from "../props/Loading";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

export interface Data {
  created_at: string;
  amount: string;
  point_type?: string;
  transaction_type?: string;
  description: string;
  //receiver_wallet.user?: string;
  reference?: string;
}

const [profitBal, setProfitBal] = useState<number>(0)
const [affiliateBal, setAffiliateBal] = useState<number>(0)
const [introducerBal, setIntroducerBal] = useState<number>(0)
// affiliate + introducer
const [commissionBal, setCommissionBal] = useState<number>(0)
const [loading, setLoading] = useState(false);

const fetchDataAll = async () => {
  try {
    setLoading(true)
    const response = await userDetails()
    setProfitBal(response.profit_point_balance || 0)
    setAffiliateBal(response.affiliate_point_balance || 0)
    setIntroducerBal(response.introducer_point_balance || 0)
    setCommissionBal(
      Number(response.affiliate_point_balance || 0) +
      Number(response.introducer_point_balance || 0)
    )
  } catch (error: any) {
    setError("Failed to fetch user details.")
  } finally {
    setLoading(false)
  }
}

useEffect(()=> {
  fetchDataAll()
}, [])

export const ProfitStatement = () => {

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getProfitStatement()
        const formattedData = response.map((user: any) => {
        const dt = dayjs.utc(user.created_at).tz("Asia/Kuala_Lumpur");
        return {
          ...user,
          created_date: dt.format("YYYY-MM-DD"),
          created_time: dt.format("HH:mm:ss"),
        }
        });
        setData(formattedData)
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
    { header: "Description", accessor: "description" },
    { header: "Amount", accessor: "amount" },
  ];

  const [data, setData] = useState<Data[]>([])

  return (
    <div>
      {loading && <Loading />}
      <div className="flex flex-row gap-2">
        <span className="font-semibold">Profit Statement</span>
        <Spannn label="Profit Balance">{profitBal}</Spannn>
      </div>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columns} data={data} />
    </div>
  )
}

export const CommissionStatement = () => {

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getCommissionStatement()
        const formattedData = response.map((user: any) => {
        const dt = dayjs.utc(user.created_at).tz("Asia/Kuala_Lumpur");
        return {
          ...user,
          created_date: dt.format("YYYY-MM-DD"),
          created_time: dt.format("HH:mm:ss"),
        }
        });
        setData(formattedData)
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
    { header: "Type", accessor: "transaction_type" },
    { header: "Description", accessor: "description" },
    { header: "Amount", accessor: "amount" },
  ];

  const [data, setData] = useState<Data[]>([])

  return (
    <div>
      {loading && <Loading />}
      <div className="flex flex-row gap-2">
        <span className="font-semibold">Commission Statement</span>
        <Spannn label="Commission Balance">{commissionBal}</Spannn>
      </div>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}
      
      <Tables columns={columns} data={data} />
    </div>
  )
}

export const TransferStatement = () => {

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getTransferStatement()
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
    { header: "Date", accessor: "created_at" },
    { header: 'Description', accessor: 'description' },
    { header: "Reference", accessor: "reference" },
    { header: "Amount", accessor: "amount" },
  ];

  const [data, setData] = useState<Data[]>([])
  
  return (
    <div>
      {loading && <Loading />}
      <span className="font-semibold">
        Transfer Statement
      </span>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columns} data={data} />
    </div>
  )
}

export const ConvertStatement = () => {

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getConvertStatement()
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
    { header: "Date", accessor: "created_at" },
    { header: 'Point', accessor: 'point_type'},
    { header: "Description", accessor: "description" },
    { header: "Amount", accessor: "amount" },
  ]

  const [data, setData] = useState<Data[]>([])

  return (
    <div>
      {loading && <Loading />}
      <span className="font-semibold">
        Convert Statement
      </span>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columns} data={data} />
    </div>
  )
}

export const WithdrawalWalletStatement = () => {

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getProfitCommissionWDStatement()
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
    { header: "Date", accessor: "created_at" },
    { header: 'Point', accessor: 'point_type'},
    { header: 'Description', accessor: 'description' },
    { header: "Amount", accessor: "amount" },
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
