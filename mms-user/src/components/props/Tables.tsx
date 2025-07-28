import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { LevelProps } from "../pages/Network"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { getCommissionStatement } from "../auth/endpoints";
import Loading from "./Loading";
import { Inputss } from "./Formss";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);


export interface TableColumn {
  header: string;
  accessor: string;
  render?: (value: any, row?: any) => React.ReactNode;
}

interface TablesProps {
  columns: TableColumn[];
  data: any[];
  emptyMessage?: string;
}

export const Tables = ({ 
  columns, 
  data, 
  emptyMessage = "No data available",
}: TablesProps) => {

  const columnDefs = useMemo<ColumnDef<any, any>[]>(
    () =>
      columns.map((col) => ({
        header: col.header,
        accessorKey: col.accessor,
        cell: col.render
          ? (info) => col.render?.(info.getValue(), info.row.original)
          : undefined,
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    manualGrouping: false,
  });

  return (
    <div className="w-full overflow-x-auto flex flex-col gap-2 p-2 bg-white rounded-xl shadow-md shadow-blue-800">

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler() 
                  } 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {table.getPaginationRowModel().rows.length > 0 ? (
            table.getPaginationRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>

      </table>

    </div>
  );
};

/////////////////////// Level Display Network /////////////////////////////////

export const LevelDisplay: React.FC<LevelProps> = ({ users }) => {
  if (users.length === 0) {
    return <p className="text-gray-500">No users found.</p>
  }

  return (
    <div className="w-full overflow-x-auto ">
      <table className="min-w-full bg-white border border-gray-200 ">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border-b">User ID</th>
            <th className="py-2 px-4 border-b">Username</th>
            <th className="py-2 px-4 border-b">Asset</th>
            <th className="py-2 px-4 border-b">Referred By</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b text-center">{user.id}</td>
              <td className={`py-2 px-4 border-b text-center ${(Number(user.asset_amount) || 0) < 200 ? 'text-slate-400' : 'text-black'}`}>{user.username}</td>
              <td className="py-2 px-4 border-b text-center">{user.asset_amount ? user.asset_amount : 0.00 }</td>
              <td className="py-2 px-4 border-b text-center">{user.referred_by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const NetworkTree = () => {
  return (
    <ul className="list-disc pl-5">
      <li><a>Parent 1</a></li>
      <li><a>Parent 2</a></li>
      <li> <a>Parent 3</a>
        <ul>
          <li> <a>1st Child of 3</a>
            <ul>
              <li><a>1st grandchild</a></li>
              <li><a>2nd grandchild</a></li>
            </ul>
          </li>
          <li><a>2nd Child of 3</a></li>
          <li><a>3rd Child of 3</a></li>
        </ul>
      </li>
      <li> <a>Parent 4</a>
        <ul>
          <li><a>Parent 4's only child</a></li>
        </ul>
      </li>
    </ul>
  )
}


///////////////////// Commission Tx Table ///////////////////////////

interface CommissionTxProps {
  columns: ColumnDef<any, any>[]
  emptyMessage?: string
  startDate?: string
  endDate?: string
  month?: string
  year?: string
}

interface CommissionTxData {
  id?: number
  created_at: string
  amount: number
  transaction_type?: string
  description: string
}

interface ApiResponse {
  results: CommissionTxData[]
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export const CommissionTxTable = ({
  columns,
  emptyMessage = "No data available",
  startDate = "",
  endDate = "",
  month = "",
  year = ""
}: CommissionTxProps) => {

  const [data, setData] = useState<CommissionTxData[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)
  const [sorting, setSorting] = useState<SortingState>([])


  const fetchData = useCallback( async () => {
    const formattedStartDate = startDate ? dayjs(startDate).format("YYYY-MM-DD") : ""
    const formattedEndDate = endDate ? dayjs(endDate).format("YYYY-MM-DD") : ""

    try {
      setLoading(true)

      const res: ApiResponse = await getCommissionStatement({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        page,
        pageSize,
        month: month,
        year: year,
      })

      const processedData = res.results.map(tx => ({
        ...tx,
        created_date: dayjs(tx.created_at).format("YYYY-MM-DD"),
        created_time: dayjs(tx.created_at).format("hh:mm:ss"),
      }))
      setData(processedData)

    } catch (error) {
      console.error("Failed to fetch transactions", error)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, page, pageSize, month, year])

  useEffect(()=>{
    setPage(1)
  }, [startDate, endDate, month, year])

  useEffect(() => {
    fetchData()
  }, [startDate, endDate, month, year, page, pageSize])

  const table = useReactTable({
    data,
    columns,
    state: { 
      sorting, 
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // include only if backend sorts
    manualPagination: true,
  })

  return (
    <div className="w-full overflow-x-auto flex flex-col gap-2 p-3 bg-white rounded-xl">
      {loading && <Loading />}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-2 font-semibold text-left cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc"
                      ? " 🔼"
                      : header.column.getIsSorted() === "desc"
                      ? " 🔽"
                      : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
            table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            )))}
          </tbody>
        </table>

      {/* Pagination */}
      <div className="flex justify-end mt-4 space-x-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer"
        >
          Prev
        </button>
        <span className="px-3 py-1">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-1 border rounded cursor-pointer"
        >
          Next
        </button>
        <select
          className="border rounded px-2 py-1 text-xs cursor-pointer"
          value={pageSize}
          onChange={e => {
            const newSize = Number(e.target.value);
            setPageSize(newSize);
          }}
        >
          {[30, 40, 50, 100].map(pageSize => (
            <option key={pageSize} value={pageSize}
            >
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  )

}

/////////////////////////// New Table ///////////////////////////////

interface TableData {
  created_at: string;
  amount: number;
  request_status?: string;
  point_type?: string;
  transaction_type?: string;
  description: string;
  reference?: string;
  deposit_amount?: number;
  amount_6m_locked?: number;
  amount_6m_unlocked?: number;
  amount_1y_locked?: number;
  amount_1y_unlocked?: number;
  days_until_6m?: number;
  days_until_1y?: number;
  withdrawable_now?: number;
}

export interface TableFetchParams {
  search?: string
  status?: string
  startDate?: string
  endDate?: string
  month?: string
  year?: string
  page?: number
  pageSize?: number
}

interface TableProps {
  columns: ColumnDef<any, any>[]
  fetchData: (params: TableFetchParams) => Promise<ApiResponseTable>
  emptyMessage?: string
  enableFilters?: boolean
  enableDatePicker?: boolean
}


interface ApiResponseTable {
  results: TableData[]
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export const NewTable = ({
  columns,
  fetchData,
  emptyMessage = "No data available",
  enableFilters = true,
  enableDatePicker = true,
}: TableProps) => {

  const [data, setData] = useState<TableData[]>([])
  const [search, setSearch] = useState("")
  const [status] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [month] = useState<string>()
  const [year] = useState<string>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(30)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState<string>("")

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback( async () => {
    const formattedStartDate = startDate ? dayjs(startDate, "DD/MM/YYYY").format("YYYY-MM-DD") : ""
    const formattedEndDate = endDate ? dayjs(endDate, "DD/MM/YYYY").format("YYYY-MM-DD") : ""

    try {
      setLoading(true)

      const res: ApiResponseTable = await fetchData({
        search,
        status,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        page,
        pageSize,
        month,
        year,
      })

      const processedData = res.results.map(tx => ({
        ...tx,
        created_date: dayjs(tx.created_at).format("DD/MM/YYYY"),
        created_time: dayjs(tx.created_at).format("hh:mm:ss"),
      }))
      console.log("Res Data:", res)
      setData(processedData)

    } catch (error: any) {
      console.error("Failed to fetch transactions", error)
      setData([])
      if (error.response && error.response.status === 401 || error.response.status === 400) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false)
    }
  }, [search, status, startDate, endDate, page, pageSize, month, year])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [fetchData, search, status, startDate, endDate, month, year])

  // Fetch data when dependencies change
  useEffect(() => {
    loadData()
  }, [fetchData, search, status, startDate, endDate, page, pageSize, month, year])

  const table = useReactTable({
    data,
    columns,
    getFilteredRowModel: getFilteredRowModel(),
    state: { 
      sorting, 
      globalFilter: globalFilter || search 
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // include only if backend sorts
    manualPagination: true,
  })

    const handleClearFilters = () => {
      setSearch("")
      //setStatus("")
      setStartDate("")
      setEndDate("")
      }

    const hasActiveFilters = search || status || startDate || endDate

  return (
    <div className="w-full overflow-x-auto flex flex-col gap-2 p-3 bg-white rounded-xl">
      {loading && <Loading />}
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}

      {enableFilters && <Inputss
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search user id or username"
      />}

      {enableDatePicker && (
        <div className="flex flex-row gap-2 justify-center items-center">
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
        </div>
      )}


      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer w-full"
        >
          Clear Filters
        </button>
      )}

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-4 py-2 font-semibold text-left cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc"
                    ? " 🔼"
                    : header.column.getIsSorted() === "desc"
                    ? " 🔽"
                    : ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
          table.getRowModel().rows.map(row => (
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          )))}
        </tbody>
      </table>

    {/* Pagination */}
    <div className="flex justify-end mt-4 space-x-2">
      <button
        disabled={page === 1}
        onClick={() => setPage(p => Math.max(p - 1, 1))}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </button>
      <span className="px-3 py-1">Page {page}</span>
      <button
        onClick={() => setPage(p => p + 1)}
        className="px-3 py-1 border rounded"
      >
        Next
      </button>
      <select
        className="border rounded px-2 py-1 text-xs cursor-pointer"
        value={pageSize}
        onChange={e => {
          const newSize = Number(e.target.value);
          setPageSize(newSize);
        }}
      >
        {[30, 40, 50, 100].map(pageSize => (
          <option key={pageSize} value={pageSize}
          >
            Show {pageSize}
          </option>
        ))}
      </select>
    </div>
  </div>
  )
}
