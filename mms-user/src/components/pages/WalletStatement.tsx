import { useEffect, useState } from "react";
import { Tables } from "../props/Tables";
import Spannn from "../props/Textt"
import { getWallet, getCommissionStatement, getConvertStatement, getProfitCommissionWDStatement, getProfitStatement, getTransferStatement } from "../auth/endpoints";
import Loading from "../props/Loading";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

export interface Data {
  created_at: string;
  amount: number;
  point_type?: string;
  transaction_type?: string;
  description: string;
  //receiver_wallet.user?: string;
  reference?: string;
}

// Helper
export const fetchAndFormatData = async (apiFn: Function, setData: Function, setError: Function, setLoading: Function) => {
  try {
    setLoading(true);
    const response = await apiFn();
    const formatted = response.map((item: any) => {
      const dt = dayjs.utc(item.created_at).tz("Asia/Kuala_Lumpur");
      return {
        ...item,
        created_date: dt.format("YYYY-MM-DD"),
        created_time: dt.format("HH:mm:ss"),
      };
    });
    setData(formatted);
  } catch (error: any) {
    if (error.response && error.response.status === 400) {
      setError(error.response.data.error);
    }
  } finally {
    setLoading(false);
  }
};

/*
useEffect(() => {
  fetchAndFormatData(getDepositLock, setDataRes, setErrorMessage, setLoading);
}, []);
*/


export const ProfitStatement = () => {

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [profitBal, setProfitBal] = useState<number>(0)

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
        const resWallet = await getWallet()
        setProfitBal(resWallet.profit_point_balance || 0)
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
    { header: "Date", 
      accessor: "created_date",
      render: (value: any) => value
     },
    { header: "Time", 
      accessor: "created_time", 
      render: (value: any) => value 
    },
    { header: "Description", 
      accessor: "description",
      render: (value: any) => value
     },
    { header: "Amount", 
      accessor: "amount",
      render: (value: any) => value
     },
  ];

  const [data, setData] = useState<Data[]>([])

  return (
    <div className="flex flex-col gap-2">
      {loading && <Loading />}
      <div className="flex flex-row gap-2">
        <span className="font-semibold">Profit Statement | </span>
        <Spannn label="Profit Balance">{profitBal}</Spannn>
      </div>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columns} data={data} 
        enableSorting={true}
      />
    </div>
  )
}

export const CommissionStatement = () => {

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // affiliate + introducer
  const [commissionBal, setCommissionBal] = useState<number>(0)

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
        const resWallet = await getWallet()
        setCommissionBal(
          Number(resWallet.affiliate_point_balance || 0) +
          Number(resWallet.introducer_point_balance || 0)
        )
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
    { header: "Date", 
      accessor: "created_date",
      render: (value: any) => value
     },
    { header: "Time", 
      accessor: "created_time", 
      render: (value: any) => value 
    },
    { header: "Type", 
      accessor: "transaction_type",
      render: (value: any) => value
     },
    { header: "Description", 
      accessor: "description",
      render: (value: any) => value
     },
    { header: "Amount", 
      accessor: "amount",
      render: (value: any) => value
     },
  ];

  const [data, setData] = useState<Data[]>([])

  return (
    <div className="flex flex-col gap-2">
      {loading && <Loading />}
      <div className="flex flex-row gap-2">
        <span className="font-semibold">Commission Statement | </span>
        <Spannn label="Commission Balance">{commissionBal}</Spannn>
      </div>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}
      
      <Tables columns={columns} data={data} 
        enableFilters={true}
        enableSorting={true}
        enablePagination={true}
      />
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
    { header: "Date", 
      accessor: "created_date",
      render: (value: any) => value
     },
    { header: "Time", 
      accessor: "created_time",
      render: (value: any) => value
     },
    { header: 'Description', 
      accessor: 'description',
      render: (value: any) => value
    },
    { header: "Reference", 
      accessor: "reference",
      render: (value: any) => value
     },
    { header: "Amount", 
      accessor: "amount",
      render: (value: any) => value
     },
  ];

  const [data, setData] = useState<Data[]>([])
  
  return (
    <div className="flex flex-col gap-2">
      {loading && <Loading />}
      <span className="font-semibold">
        Transfer Statement
      </span>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columns} data={data} 
        enableFilters={true}
        enableSorting={true}
      />
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
    { header: "Date", 
      accessor: "created_date",
      render: (value: any) => value
     },
    { header: "Time", 
      accessor: "created_time",
      render: (value: any) => value
     },
    { header: 'Point', 
      accessor: 'point_type',
      render: (value: any) => value
    },
    { header: "Description", 
      accessor: "description",
      render: (value: any) => value
     },
    { header: "Amount", 
      accessor: "amount",
      render: (value: any) => value
     },
  ]

  const [data, setData] = useState<Data[]>([])

  return (
    <div className="flex flex-col gap-2">
      {loading && <Loading />}
      <span className="font-semibold">
        Convert Statement
      </span>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columns} data={data} 
        enableFilters={true}
        enableSorting={true}
      />
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
    { header: "Date", 
      accessor: "created_date",
      render: (value: any) => value
     },
    { header: "Time", 
      accessor: "created_time",
      render: (value: any) => value
    },
    { header: 'Point', 
      accessor: 'point_type',
      render: (value: any) => value
    },
    { header: 'Description', 
      accessor: 'description',
      render: (value: any) => value
    },
    { header: "Amount", 
      accessor: "amount",
      render: (value: any) => value
     },
  ]

  const [data, setData] = useState<Data[]>([])

  return (
    <div className="flex flex-col gap-2">
      {loading && <Loading />}
      <span className="font-semibold">
        Withdrawal Statement
      </span>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columns} data={data} 
        enableFilters={true}
        enableSorting={true}
        enablePagination={true}
      />
    </div>
  )
}
