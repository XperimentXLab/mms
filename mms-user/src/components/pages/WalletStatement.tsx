import { useEffect, useState } from "react";
import { Tables } from "../props/Tables";
import { getCommissionStatement, getConvertDepositStatement, getProfitCommissionWDStatement, getProfitStatement, getTransferStatement } from "../auth/endpoints";
import Loading from "../props/Loading";

export interface Data {
  created_date: string;
  amount: string;
  point_type?: string;
  transaction_type?: string;
  description: string;
  receiver?: string;
  reference?: string;
}

export const ProfitStatement = () => {

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getProfitStatement()
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
    { header: 'Point', accessor: 'point_type'},
    { header: "Type", accessor: "transaction_type" },
    { header: "Description", accessor: "description" }
  ];

  const [data, setData] = useState<Data[]>([])

  return (
    <div>
      {loading && <Loading />}
      <span className="font-semibold">
        Profit Statement
      </span>
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
    { header: 'Point', accessor: 'point_type'},
    { header: "Type", accessor: "transaction_type" },
    { header: "Description", accessor: "description" }
  ];

  const [data, setData] = useState<Data[]>([])

  return (
    <div>
      {loading && <Loading />}
      <span className="font-semibold">
        Commission Statement
      </span>
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
    { header: "Date", accessor: "created_date" },
    { header: "Amount", accessor: "amount" },
    { header: "Receiver", accessor: "receiver" },
    { header: 'Description', accessor: 'description' },
    { header: "Reference", accessor: "reference" }
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
        const response = await getConvertDepositStatement()
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
    { header: 'Point', accessor: 'point_type'},
    { header: "Description", accessor: "description" }
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
    { header: "Date", accessor: "created_date" },
    { header: "Amount", accessor: "amount" },
    { header: 'Point', accessor: 'point_type'},
    { header: 'Description', accessor: 'description' },
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