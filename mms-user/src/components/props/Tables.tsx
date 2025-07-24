import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { LevelProps } from "../pages/Network"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { getCommissionStatement } from "../auth/endpoints";
import Loading from "./Loading";

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
  needDate?: boolean;
  emptyMessage?: string;
  enableFilters?: boolean;
  enableSorting?: boolean;
  enablePagination?: boolean;
}

export const Tables = ({ 
  columns, 
  data, 
  needDate = true,
  emptyMessage = "No data available",
  enableFilters = false, 
  enableSorting = false, 
  enablePagination = false,
}: TablesProps) => {
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null); 
  const [endDate, setEndDate] = useState<Date | null>(null);    
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 30,
  })

  const filteredData = useMemo(() => {
    if (!startDate && !endDate) return data;
    return data.filter(row => {
      if (!row.created_date) return false;
      const rowDate = dayjs(row.created_date).tz("Asia/Kuala_Lumpur").startOf("day");
      const start = startDate ? dayjs(startDate).tz("Asia/Kuala_Lumpur").startOf("day") : null;
      const end = endDate ? dayjs(endDate).tz("Asia/Kuala_Lumpur").startOf("day") : null;

      if (start && end) {
        return rowDate.isSameOrAfter(start) && rowDate.isSameOrBefore(end);
      }
      if (start) {
        return rowDate.isSameOrAfter(start);
      }
      if (end) {
        return rowDate.isSameOrBefore(end);
      }
      return true;
    });
    
  }, [data, startDate, endDate]);

  const columnDefs = useMemo<ColumnDef<any, any>[]>(
    () =>
      columns.map((col) => ({
        header: col.header,
        accessorKey: col.accessor,
        cell: col.render
          ? (info) => col.render?.(info.getValue(), info.row.original)
          : undefined,
        enableSorting,
      })),
    [columns, enableSorting]
  );

  const table = useReactTable({
    data: filteredData || data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter, sorting, pagination },
    onGlobalFilterChange: setGlobalFilter,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    manualGrouping: false,
    pageCount: Math.ceil(filteredData.length / pagination.pageSize),
  });

  return (
    <div className="w-full overflow-x-auto flex flex-col gap-2 p-2 bg-white rounded-xl shadow-md shadow-blue-800">

      {enableFilters && (
          <input
            type="text"
            className="border rounded px-2 py-1 text-xs"
            placeholder={`Enter filter keyword`}
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
          />

        )}
        {needDate && <div className="flex flex-row gap-2 justify-center items-center">
          <DatePicker
            className="flex border rounded px-2 py-1 text-xs"
            selected={startDate}
            onChange={date => setStartDate(date)}
            dateFormat="YYYY-MM-DD"
            placeholderText="Start date"
            selectsStart
            startDate={startDate}
            endDate={endDate}
            isClearable
          />
          <DatePicker
            className="flex border rounded px-2 py-1 text-xs"
            selected={endDate}
            onChange={date => setEndDate(date)}
            dateFormat="YYYY-MM-DD"
            placeholderText="End date"
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate ?? undefined}
            isClearable
          />

        </div>}

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={
                    enableSorting && header.column.getCanSort()
                    ? header.column.getToggleSortingHandler() 
                    : undefined
                  } 
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                  {enableSorting && header.column.getCanSort() && (
                    <span>
                      {header.column.getIsSorted() === "asc" ? " 🔼" : header.column.getIsSorted() === "desc" ? " 🔽" : ""}
                    </span>
                  )}
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

      {enablePagination && (
        <div className="flex items-center justify-between mt-2 mb-2">
          <div>
            <button
              className="px-2 py-1 border rounded mr-2 text-xs bg-amber-50 shadow-lg shadow-gray-200 cursor-pointer"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Prev
            </button>
            <button
              className="px-2 py-1 border rounded text-xs bg-amber-50 shadow-lg shadow-gray-200 cursor-pointer"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
          <span className="text-xs">
            Page{" "}
            <strong>
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </strong>
          </span>
          <select
            className="bg-amber-50 shadow-lg shadow-gray-200 border rounded px-2 py-1 text-xs cursor-pointer"
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value));
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
      )}  

    </div>
  );
};

/////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////

interface AssetWithdrawalProps {
  columns: TableColumn[];
  data: any[];
  emptyMessage?: string;
}

export const TableAssetWithdrawal = ({columns, data, emptyMessage = "No data available"}: AssetWithdrawalProps) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-2000">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((column) => (
              <th key={column.accessor} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
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
    </div>
  )
}


////////////////////////////////////////////////////////

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
        month: Number(month),
        year: Number(year),
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

/////////////////////////////////////////////////////

/*
interface TableProps {
  columns: ColumnDef<any, any>[]
  emptyMessage?: string
  startDate?: string
  endDate?: string
  month?: string
  year?: string
}

interface TableData {
  created_at: string;
  amount: number;
  point_type?: string;
  transaction_type?: string;
  description: string;
  reference?: string;
}

interface ApiResponseTable {
  results: TableData[]
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
*/