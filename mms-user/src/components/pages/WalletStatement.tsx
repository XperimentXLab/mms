import { useEffect, useState } from "react";
import { CommissionTxTable, NewTable, Tables } from "../props/Tables";
import Spannn from "../props/Textt"
import { getWallet, getCommissionDailyTx, getProfitTx, getTransferTx, getConvertTx, getProfitCommissionWDTx } from "../auth/endpoints";
import Loading from "../props/Loading";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { ColumnDef } from "@tanstack/react-table";
import Buttons from "../props/Buttons";
import DatePicker from "react-datepicker";
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

const columnsTable: ColumnDef<any, any>[] = [
  { header: "Date", 
    accessorKey: "created_date",
    cell: info => info.getValue()
  },
  { header: "Time", 
    accessorKey: "created_time", 
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
]


export const ProfitStatement = () => {

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [profitBal, setProfitBal] = useState<number>(0)

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
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

  return (
    <div className="flex flex-col gap-2">
      {loading && <Loading />}
      <div className="flex flex-row justify-between gap-2 bg-white p-2 rounded-lg">
        <span className="font-semibold ">Profit Statement </span>
        <Spannn label="Profit Balance">{profitBal}</Spannn>
      </div>

      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}
      
      <NewTable 
        columns={columnsTable}
        fetchData={getProfitTx}
        enableFilters={false}
      />
    </div>
  )
}


export const CommissionStatement = () => {

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("")

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('')

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
        const resComTx = await getCommissionDailyTx({
          month: Number(dayjs(selectedMonthYear).month() + 1), 
          year: Number(dayjs(selectedMonthYear).year())
        })
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
  }, [selectedMonthYear])

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
      <div className="flex md:flex-row flex-col gap-3 bg-white p-2 rounded-lg justify-center items-center">
        <span className="font-bold">Commission Statement </span>
        <Spannn label="Commission Balance" className="bg-gray-200 py-1 px-2 rounded-lg">{commissionBal}</Spannn>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Select </span>
          <DatePicker
            selected={
              selectedMonthYear && dayjs(selectedMonthYear).isValid()
                ? dayjs(selectedMonthYear).toDate()
                : new Date()
            }
            onChange={(date: any) => setSelectedMonthYear(date)}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            className="border px-3 rounded"
          />
        </div>
      </div>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      <Tables columns={columnComTx} data={data} />

      {selectedDay !== null &&
        <div className="flex flex-col gap-2 p-3 translate-y-10 absolute border rounded-lg backdrop-blur-sm bg-white/30 max-w-full">
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
  
  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold bg-white p-2 rounded-lg">
        Transfer Statement
      </span>

      <NewTable 
        columns={columnsTable}
        fetchData={getTransferTx}
      />
    </div>
  )
}

export const ConvertStatement = () => {

  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold bg-white p-2 rounded-lg">
        Convert Statement
      </span>

      <NewTable 
        columns={columnsTable}
        fetchData={getConvertTx} 
        enableFilters={false}
      />

    </div>
  )
}

export const WithdrawalWalletStatement = () => {

  const columnsTableWD: ColumnDef<any, any>[] = [
    { header: "Date", 
      accessorKey: "created_date",
      cell: info => info.getValue()
    },
    { header: "Time", 
      accessorKey: "created_time", 
      cell: info => info.getValue() 
    },
    { header: "Status", 
      accessorKey: "request_status",
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
  ]

  return (
    <div className="flex flex-col gap-2">

      <span className="font-semibold bg-white p-2 rounded-lg">
        Withdrawal Statement
      </span>

      <NewTable
        columns={columnsTableWD}
        fetchData={getProfitCommissionWDTx}
        enableFilters={false}
      />
    </div>
  )
}
