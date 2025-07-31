
import { NewTable } from "../props/Tables"
import { getAllUsers } from "../auth/endpoints"
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { ColumnDef } from "@tanstack/react-table";
dayjs.extend(utc);
dayjs.extend(timezone);

const User = () => {

  const columnsUserDetails: ColumnDef<any, any>[] = [
    { header: 'Joined Date', 
      accessorKey: 'created_date',
      cell: info => info.getValue()
     },
    { header: 'Joined Time', 
      accessorKey: 'created_time',
      cell: info => info.getValue()
     },
    { header: 'User ID', 
      accessorKey: 'id',
      cell: info => info.getValue()
     },
    { header: 'Username', 
      accessorKey: 'username',
      cell: info => {
        const row = info.row.original
        if (!row) return null;

        return (
          <span className={`${(row.asset_amount || 0) < 200 ? 'text-slate-400' : 'text-black'}`}> 
            {row.username}
          </span>
        )
      }
     },
    { header: 'I/C', 
      accessorKey: 'ic',
      cell: info => info.getValue()
     },
    { header: 'Email', 
      accessorKey: 'email',
      cell: info => info.getValue()
     },
    { header: 'Referral ID', 
      accessorKey: 'referred_by',
      cell: info => info.getValue()
     },
    { header: 'Asset', 
      accessorKey: 'asset_amount',
      cell: info => info.getValue() ?? '0'
     },
    { header: 'Register Point', 
      accessorKey: 'master_point',
      cell: info => info.getValue() ?? '0'
    },
    { header: 'Profit Point', 
      accessorKey: 'profit_point',
      cell: info => info.getValue() ?? '0'
     },
    { header: 'Commission Point', 
      accessorKey: 'commission_point',
      cell: info => info.getValue() ?? '0'
     },
    { header: 'Verification', 
      accessorKey: 'verification_status',
      cell: info => info.getValue()
     },
  ]

  return (
    <div className="flex flex-col gap-3 m-4 justify-center">

      <span className="text-white">All Users</span>

      <NewTable 
        columns={columnsUserDetails}
        fetchData={getAllUsers}
        enableDatePicker={true}
      />

    </div>
  )
}

export default User
