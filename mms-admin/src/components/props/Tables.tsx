import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { getAllTransactions, type rangeTypeT } from "../auth/endpoints";
import Loading from "./Loading";
import type { TransactioDetail } from "../pages/Transactionss";
import { Inputss } from "./Formss";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface TableColumn {
  header: string;
  accessor: string;
  render?: (value: any) => React.ReactNode;
}

type requestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
interface ActionProps {
  request_status: requestStatus;
  onClick: () => void; 
}

interface TablesProps {
  columns: TableColumn[];
  data: any[];
  action?: ActionProps
  emptyMessage?: string;
}


export interface Data {
  id?: string
  created_at?: string
  username: string
  first_name: string
  last_name: string
  asset_amount: number
  ic: string
  wallet_address: string | null
  address_line: string | null
  address_city: string | null
  address_state: string | null
  address_postcode: string | null
  address_country: string | null
  verification_status: 'REQUIRES_ACTION' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  ic_document_url?: string | null
  is_campro?: boolean
  reject_reason?: string | null
  promocode?: string | null
  referred_by?: string | null
  master_point?: number
  profit_point?: number
  commission_point?: number
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
          ? (info) => col.render?.(info.getValue())
          : undefined,
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-x-auto flex flex-col gap-2 p-3 bg-white rounded-xl">

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={
                    header.column.getCanSort()
                    ? header.column.getToggleSortingHandler() 
                    : undefined
                  } 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
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
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
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

////////////////////////////////////////////////////

export const RequestTable = ({ columns, data, emptyMessage = "No data available" }: TablesProps) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((column) => (
            <th
              key={column.accessor}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.length > 0 ? (
          data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={`${rowIndex}-${column.accessor}`} className="px-6 py-4 whitespace-nowrap">
                  {column.render ? column.render(row[column.accessor]) : row[column.accessor]}
                </td>
              ))}
              {columns.map((column) => (
                <td key={`${rowIndex}-${column.accessor}`} className="px-6 py-4 whitespace-nowrap">
                  {column.render ? column.render(row[column.accessor]) : row[column.accessor]}
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
  );
};


////////////////////////////////////////////////////

interface TxTableProps {
  columns: ColumnDef<any, any>[]
  emptyMessage?: string
  search?: string
  status?: string
  transactionType?: string
  pointType?: string
  startDate?: string
  endDate?: string
  month?: number
  year?: number
}

interface ApiResponse {
  results: TransactioDetail[]
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export const TxTable = ({
  columns,
  emptyMessage = "No data available",
  search = "",
  status = "",
  transactionType = "",
  pointType = "",
  startDate = "",
  endDate = "",
  month,
  year,
}: TxTableProps) => {

  const [data, setData] = useState<TransactioDetail[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(30)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState<string>("")
  const [rangeType, setRangeType] = useState<rangeTypeT>('')

  const [loading, setLoading] = useState(false)

  const fetchData = useCallback( async () => {
    const formattedStartDate = startDate ? dayjs(startDate, "DD/MM/YYYY").format("YYYY-MM-DD") : ""
    const formattedEndDate = endDate ? dayjs(endDate, "DD/MM/YYYY").format("YYYY-MM-DD") : ""

    try {
      setLoading(true)

      const res: ApiResponse = await getAllTransactions({
        search,
        status,
        transactionType,
        pointType,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        page,
        pageSize,
        rangeType,
        month,
        year,
      })



      const processedData = res.results.map(tx => ({
        ...tx,
        created_date: dayjs(tx.created_at).format("DD/MM/YYYY"),
        created_time: dayjs(tx.created_at).format("hh:mm:ss"),
      }))
      setData(processedData)

    } catch (error) {
      console.error("Failed to fetch transactions", error)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [search, status, transactionType, startDate, endDate, page, pageSize, pointType, month, year])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (month && year) {  
      setRangeType('month')
    } else {
      setRangeType('')
    }
    setPage(1)
  }, [search, status, transactionType, startDate, endDate, pointType, month, year, rangeType])

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData()
  }, [search, status, transactionType, startDate, endDate, page, pageSize, pointType, month, year, rangeType])

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



/////////////////////////// New Table ///////////////////////////////

export interface TableFetchParams {
  search?: string
  status?: string
  isCampro?: string
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
  enableStatusCampro?: boolean
}


interface ApiResponseTable {
  results: Data[]
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
  enableStatusCampro = false,
}: TableProps) => {

  const [data, setData] = useState<Data[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [isCampro, setIsCampro] = useState('')
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
        isCampro,
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
  }, [search, status, startDate, endDate, page, pageSize, month, year, isCampro])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [fetchData, search, status, startDate, endDate, month, year, isCampro])

  // Fetch data when dependencies change
  useEffect(() => {
    loadData()
    console.log(isCampro)
  }, [fetchData, search, status, startDate, endDate, page, pageSize, month, year, isCampro])

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
      setStatus("")
      setStartDate("")
      setEndDate("")
      setIsCampro("")
      }

    const hasActiveFilters = search || status || startDate || endDate || isCampro

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
        <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-2 justify-center items-center">
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

      {enableStatusCampro && <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-2 justify-center">
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Verification Status</option>
          <option value="REQUIRES_ACTION">Requires Action</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          value={isCampro}
          onChange={e => setIsCampro(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Welcome Bonus</option>
          <option value="true">Granted</option>
          <option value="false">Pending Grant</option>
        </select>
      </div>}


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
