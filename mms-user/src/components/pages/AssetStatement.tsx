import { NewTable } from "../props/Tables"
import {getAssetTx, getDepositLock } from "../auth/endpoints"
import Buttons from "../props/Buttons"
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { ColumnDef } from "@tanstack/react-table"
import { useRef } from "react";
dayjs.extend(utc);
dayjs.extend(timezone);


export const WithdrawalAssetStatement = () => {

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const columns: ColumnDef<any, any>[] = [
    { header: "Date", 
      accessorKey: "created_date",
      cell: info => info.getValue()
    },
    { header: "Time", 
      accessorKey: "created_time",
      cell: info => info.getValue()
    },
    { header: "Amount Locked (50%)", 
      accessorKey: "amount_6m_locked",
      cell: info => info.getValue()
    },
    { header: 'Days Left', 
      accessorKey: 'days_until_6m',
      cell: info => info.getValue()
    },
    { header: "Amount Locked (50%)", 
      accessorKey: "amount_1y_locked",
      cell: info => info.getValue()
    },
    { header: 'Days Left', 
      accessorKey: 'days_until_1y',
      cell: info => info.getValue()
    },
    { header: "Available Withdraw", 
      accessorKey: "withdrawable_now",
      cell: info => (
        <input
          type="text"
          placeholder={info.row.original.withdrawable_now}
          ref={(el) => {
            inputRefs.current[info.row.original.id] = el;
          }}
          className="px-2 py-1 border rounded"
        />
        
      )
    },
    { header: "Action", 
      accessorKey: "action",
      cell: info => ( 
      <div className="flex gap-2">
        {(info.row.original.days_until_6m < 0 || info.row.original.days_until_1y < 0) ? (
          <Buttons
            type="button"
            //onClick={() => handleWithdraw(info.row.original.id)}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Withdraw
          </Buttons>
        ): 
        <Buttons
          type="button"
          disabled={true}
        >Withdraw</Buttons>
        }
      </div>
      )
    },
  ]
  
/*
  const handleWithdraw = (id: string) => {
    const withdraw = inputRefs.current[id]?.value; //call api insert the withdraw amount
    // call an API to update the status
  }
*/

  return (
    <div className="flex flex-col gap-2">

      <span className="font-semibold bg-white p-2 rounded-lg">
        Withdrawal Statement
      </span>

      <NewTable columns={columns}
        fetchData={getDepositLock}
        enableFilters={false}
      />
    </div>
  )
}


export const AssetStatement = () => {

  const columnsTable: ColumnDef<any, any>[] = [
  { header: "Date", 
    accessorKey: "created_date",
    cell: info => info.getValue()
    },
  { header: "Time", 
    accessorKey: "created_time", 
    cell: info => info.getValue() 
  },
  { header: "Status", 
    accessorKey: "status",
    cell: info => info.getValue() ?? '-'
  },
  { header: "Transaction Type",
    accessorKey: "transaction_type",
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
        Asset Statement
      </span>

      <NewTable
        columns={columnsTable}
        fetchData={getAssetTx}
        enableFilters={false}
      />
    </div>
  )
}
