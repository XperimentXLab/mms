import { NewTable } from "../props/Tables"
import {getAssetTx, getDepositLock, withdrawAsset } from "../auth/endpoints"
import Buttons from "../props/Buttons"
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { ColumnDef } from "@tanstack/react-table"
import { useRef, useState } from "react";
import { NotiErrorAlert, NotiSuccessAlert } from "../props/Noti";
import Loading from "../props/Loading";
dayjs.extend(utc);
dayjs.extend(timezone);


export const WithdrawalAssetStatement = () => {

  const [loading, setLoading] = useState<boolean>(false)
  const isSunday = dayjs().tz('Asia/Kuala_Lumpur').day() === 0; 

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const columns: ColumnDef<any, any>[] = [
    { header: "Date", 
      accessorKey: "created_datetime",
      cell: info => info.getValue()
    },
    { header: "Amount Locked (50%)", 
      accessorKey: "amount_6m_locked",
      cell: info => {
        const amountLocked = info.row.original.amount_6m_locked
        const amountUnlocked = info.row.original.amount_6m_unlocked
        return amountLocked - amountUnlocked
      }
    },
    { header: 'Days Left', 
      accessorKey: 'days_until_6m',
      cell: info => info.getValue()
    },
    { header: "Amount Locked (50%)", 
      accessorKey: "amount_1y_locked",
      cell: info => {
        const amountLocked = info.row.original.amount_1y_locked
        const amountUnlocked = info.row.original.amount_1y_unlocked
        return amountLocked - amountUnlocked
      }
    },
    { header: 'Days Left', 
      accessorKey: 'days_until_1y',
      cell: info => info.getValue()
    },
    { header: "Available Withdraw", 
      accessorKey: "withdrawable_now",
      cell: info => (
        <input
          type="number"
          placeholder={info.row.original.withdrawable_now?.toString() || "0"}
          max={info.row.original.withdrawable_now}
          step="10"
          ref={(el) => {
            inputRefs.current[info.row.original.id] = el;
          }}
          className="px-2 py-1 border rounded"
        />
        
      )
    },
    { header: "Action", 
      accessorKey: "action",
      cell: info => {

        return (
        <div className="flex gap-2">
          <Buttons
            type="button"
            disabled={!isSunday}
            onClick={() => handleWithdraw(info.row.original.id)}
            className={`px-3 py-1 rounded ${
              isSunday 
                ? 'bg-green-500 text-white hover:bg-green-600 hover:cursor-pointer' 
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            Withdraw
          </Buttons>
        </div>
        )
      }
    },
  ]
  
  const handleWithdraw = async (depositLockId: string) => {
    
    const withdrawAmount = inputRefs.current[depositLockId]?.value

    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      NotiErrorAlert("Please enter a valid withdrawal amount");
      return;
    }

    try {
      setLoading(true)
      await withdrawAsset({
        amount: Number(withdrawAmount)
      })
      NotiSuccessAlert("Withdrawal request submitted! Please wait for approval. Your request will be updated in 48 hours.")
    } catch (error: any) {
      NotiErrorAlert(error.response.data.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {loading && <Loading />}

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
    accessorKey: "created_datetime",
    cell: info => info.getValue()
  },
  { header: "Status", 
    accessorKey: "request_status",
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
