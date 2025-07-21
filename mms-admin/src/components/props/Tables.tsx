import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { getAllTransactions, type rangeTypeT } from "../auth/endpoints";
import Loading from "./Loading";
import type { TransactioDetail } from "../pages/Transactionss";

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
  needDate?: boolean
  action?: ActionProps
  emptyMessage?: string;
  enableFilters?: boolean;
  enableSorting?: boolean;
  enablePagination?: boolean;
}


export interface Data {
  id?: string
  username?: string
  asset_amount?: number
  created_date: string;
  amount: string;
  request_status?: string;
  point_type?: string;
  transaction_type?: string;
  description: string;
  receiver?: string;
  reference?: string;
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
          ? (info) => col.render?.(info.getValue())
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
    <div className="w-full overflow-x-auto flex flex-col gap-2 p-3 bg-white rounded-xl">

      {enableFilters && (
          <input
            type="text"
            className=" border rounded px-2 py-1 text-xs"
            placeholder={`Enter filter keyword`}
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
          />

        )}

        {needDate &&
        <div className="flex flex-row gap-2 justify-center items-center">
          <DatePicker
            className="flex border rounded px-2 py-1 text-xs"
            selected={startDate}
            onChange={date => setStartDate(date)}
            dateFormat="dd/MM/yyyy"
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
            dateFormat="dd/MM/yyyy"
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