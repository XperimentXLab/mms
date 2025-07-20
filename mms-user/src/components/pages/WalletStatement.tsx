import { useEffect, useState } from "react";
import { CommissionTxTable, Tables } from "../props/Tables";
import Spannn from "../props/Textt"
import { getWallet, getConvertStatement, getProfitCommissionWDStatement, getProfitStatement, getTransferStatement, getCommissionDailyTx } from "../auth/endpoints";
import Loading from "../props/Loading";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { ColumnDef } from "@tanstack/react-table";
import Buttons from "../props/Buttons";
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
  const [errorMessage, setErrorMessage] = useState("")

  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // affiliate + introducer
  const [commissionBal, setCommissionBal] = useState<number>(0)

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const resWallet = await getWallet()
        setCommissionBal(
          Number(resWallet.affiliate_point_balance || 0) +
          Number(resWallet.introducer_point_balance || 0)
        )
        const resComTx = await getCommissionDailyTx()
        setData(resComTx)
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

  const columns: ColumnDef<any, any>[] = [
    { header: "Date", 
      accessorKey: "created_date",
      cell: info => info.getValue()
     },
    { header: "Time", 
      accessorKey: "created_time", 
      cell: info => info.getValue() 
    },
    { header: "Type", 
      accessorKey: "transaction_type",
      cell: info => info.getValue()
     },
    { header: "Description", 
      accessorKey: "description",
      cell: info => info.getValue()
     },
    { header: "Amount", 
      accessorKey: "amount",
      cell: info => info.getValue()
     },
  ];

  const [data, setData] = useState<[]>([])
  
  const columnComTx = [
    {
      header: 'Date',
      accessor: 'day',
      render: (value: any) => value
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (value: any) => value
    },
    {
      header: 'Action',
      accessor: 'day',
      render: (day: string) => {
        return (
          <Buttons
            type="button"
            onClick={async () => {
              setSelectedDay(day)
            }}
          >Details</Buttons>
        )
      }
    }
  ]


  return (
    <div className="flex flex-col gap-2 relative">
      {loading && <Loading />}
      <div className="flex flex-row gap-2">
        <span className="font-semibold">Commission Statement | </span>
        <Spannn label="Commission Balance">{commissionBal}</Spannn>
      </div>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columnComTx} data={data} needDate={false} enablePagination={true}/>

      {selectedDay &&
        <div className="flex flex-col gap-2 p-3 translate-y-10 absolute border rounded-lg backdrop-blur-sm bg-white/30">
          <Buttons
            type="button"
            onClick={() => setSelectedDay(null)}
          >Close</Buttons>
          <CommissionTxTable columns={columns} 
            startDate={String(selectedDay)}
            endDate={String(selectedDay)}
          />
        </div>}
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
