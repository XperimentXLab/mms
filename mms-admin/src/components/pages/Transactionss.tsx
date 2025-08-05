import { useEffect, useState } from "react"
import { TxTable } from "../props/Tables"
import dayjs from "dayjs";
import utc from "dayjs";
import timezone from "dayjs/plugin/timezone";
import type { ColumnDef } from "@tanstack/react-table"
import { Inputss } from "../props/Formss";
import DatePicker from "react-datepicker";
import Buttons from "../props/Buttons";
import { downloadExcelTx } from "../auth/endpoints";
dayjs.extend(utc);
dayjs.extend(timezone);

export interface TransactioDetail {
  created_at: string
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
      accessorKey: "point_type",
      header: "Point Type",
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
      cell: info => info.getValue(),
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

  
  const AllTx = () => {
    const [search, setSearch] = useState<string>("")
    const [status, setStatus] = useState<string>("")
    const [transactionType, setTransactionType] = useState<string>("")
    const [pointType, setPointType] = useState<string>("")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [selectedMonthYear, setSelectedMonthYear] = useState<string>('')

    // Debounced search to avoid excessive API calls
    const [debouncedSearch, setDebouncedSearch] = useState(search)

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearch(search)
      }, 300)

      return () => clearTimeout(timer)
    }, [search])

    const handleClearFilters = () => {
      setSearch("")
      setStatus("")
      setTransactionType("")
      setStartDate("")
      setEndDate("")
      setPointType("")
      }

    const hasActiveFilters = search || status || transactionType || startDate || endDate || pointType

    return (
      <div className="flex flex-col gap-2 justify-center m-3 w-full">
        
        <div className="flex flex-col bg-white gap-3 items-center p-2 rounded">

          <div className="flex flex-row gap-3 items-end justify-center w-full">
            <Inputss
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user id or username"
            />
            <Buttons type="button" onClick={()=>downloadExcelTx({status, search, transactionType, pointType, startDate, endDate})}>Export</Buttons>
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

            <select
              value={pointType}
              onChange={e => setPointType(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="">All Point</option>
              <option value="MASTER">Register Point</option>
              <option value="PROFIT">Profit</option>
              <option value="COMMISSION">Commission</option>
              <option value="ASSET">Asset</option>
            </select>

            <select
              value={transactionType}
              onChange={e => setTransactionType(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="">All Transaction</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="CONVERT">Convert</option>
              <option value="TRANSFER">Transfer</option>
              <option value="DISTRIBUTION">Distribution</option>
              <option value="AFFILIATE_BONUS">Affiliate Bonus</option>
              <option value="INTRODUCER_BONUS">Introducer Bonus</option>
              <option value="ASSET_PLACEMENT">Asset Placement</option>
              <option value="ASSET_WITHDRAWAL">Asset Withdrawal</option>
              <option value="WELCOME_BONUS">Welcome Bonus</option>
              <option value="SHARING_PROFIT">Sharing Profit</option>
              <option value="MIGRATION">Migration</option>

            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 w-full">

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
          
            <DatePicker
              selected={
                selectedMonthYear && dayjs(selectedMonthYear).isValid()
                  ? dayjs(selectedMonthYear).toDate()
                  : new Date()
              }
              onChange={(date: any) => setSelectedMonthYear(date)}
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              className="border px-3 py-2 rounded w-full" 
            />

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

        <TxTable
          columns={columns}
          search={debouncedSearch}
          status={status}
          transactionType={transactionType}
          pointType={pointType}
          startDate={startDate}
          endDate={endDate}
          month={Number(dayjs(selectedMonthYear).month()+1)}
          year={Number(dayjs(selectedMonthYear).year())}
        />
      </div>
    )
  }


  return (
    <div className="flex flex-col gap-2 items-center justify-center m-3">

      <span className="font-semibold text-white">Transactions</span>

      <AllTx />
    </div>
  )
}

export default Transactionss
