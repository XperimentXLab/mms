import type React from "react";
import type { LevelProps } from "../pages/Network"

export interface TableColumn {
  header: string;
  accessor: string;
  render?: (value: any) => React.ReactNode;
}

interface TablesProps {
  columns: TableColumn[];
  data: any[];
  emptyMessage?: string;
}

export const Tables = ({ columns, data, emptyMessage = "No data available" }: TablesProps) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((column) => (
            <th
              key={column.accessor}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
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


export const LevelDisplay: React.FC<LevelProps> = ({ users }) => {
    if (users.length === 0) {
      return <p className="text-gray-500">No users found.</p>
    }

    return (
      <div className="w-full overflow-x-auto">
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
                <td className="py-2 px-4 border-b text-center">{user.username}</td>
                <td className="py-2 px-4 border-b text-center">{user.asset_amount ? user.asset_amount : 0.00 }</td>
                <td className="py-2 px-4 border-b text-center">{user.referred_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }


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
