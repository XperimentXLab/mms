import { NewTable } from "../props/Tables"
import {getAssetAvailableBalance, getAssetTx, getDepositLock, withdrawAsset } from "../auth/endpoints"
import Buttons from "../props/Buttons"
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { ColumnDef } from "@tanstack/react-table"
import { useEffect, useRef, useState } from "react";
import { NotiErrorAlert, NotiSuccessAlert } from "../props/Noti";
import Loading from "../props/Loading";
dayjs.extend(utc);
dayjs.extend(timezone);


export const WithdrawalAssetStatement = () => {

  const [loading, setLoading] = useState<boolean>(false)
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  const LEAD_DATE = dayjs.tz('2026-07-05', 'Asia/Kuala_Lumpur').startOf('day');
  const today = dayjs().tz('Asia/Kuala_Lumpur').startOf('day');
  const daysSinceLead = today.diff(LEAD_DATE, 'day');
  const isWithdrawDay = daysSinceLead >= 0 && daysSinceLead % 14 === 0;
  //const cyclesPassed = Math.floor(daysSinceLead / 14);
  /*const nextAllowedDate = daysSinceLead < 0
    ? LEAD_DATE
    : LEAD_DATE.add((cyclesPassed + 1) * 14, 'day');*/

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
      cell: info => {
        const maxAmount = info.row.original.withdrawable_now - info.row.original.freeze_amount
        return (
        <input
          type="number"
          placeholder={maxAmount.toString() || "0"}
          max={maxAmount.toString()}
          step="10"
          ref={(el) => {
            inputRefs.current[info.row.original.id] = el;
          }}
          className="px-2 py-1 border rounded"
        />
        
      )}
    },
    { header: "Action", 
      accessorKey: "action",
      cell: info => {

        return (
        <div className="flex gap-2">
          <Buttons
            type="button"
            disabled={!isWithdrawDay}
            onClick={() => handleWithdraw(info.row.original.id)}
            className={`px-3 py-1 rounded ${
              isWithdrawDay 
                ? 'bg-green-500 text-white hover:bg-green-600 hover:cursor-pointer' 
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            { 
              isWithdrawDay ? 
              'Withdraw' : 
              `Withdraw` /*Next Withdraw: ${nextAllowedDate.format('YYYY-MM-DD')}*/
            }
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
    if (Number(withdrawAmount) > 1000) {
      NotiErrorAlert("Maximum withdrawal amount is 1000");
      return;
    }

    try {
      setLoading(true)
      await withdrawAsset({
        amount: Number(withdrawAmount),
        id: depositLockId
      })
      NotiSuccessAlert("Withdrawal request submitted! Please wait for approval. Your request will be updated in 48 hours.")
      setRefreshCounter(prev => prev + 1);
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
        refreshCounter={refreshCounter}
      />
    </div>
  )
}


export const AssetStatement = () => {

  const today = dayjs().tz('Asia/Kuala_Lumpur').startOf('day');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [availableBal, setAvailableBal] = useState<number>(0)
  const [totalCompounding, setTotalCompounding] = useState<number>(0)

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const resAvailable = await getAssetAvailableBalance({
          startDate: '2025-07-01',
          endDate: today.format('YYYY-MM-DD')
        })
        setAvailableBal(resAvailable.total_available_balance || 0)
        setTotalCompounding(resAvailable.total_compounding || 0)
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

  const columnsTable: ColumnDef<any, any>[] = [
  { header: "Date", 
    accessorKey: "created_datetime",
    cell: info => info.getValue()
  },
  { header: "Status", 
    accessorKey: "request_status",
    cell: info => {
      const status = info.getValue()
      let statusColor = "text-gray-500"
      if (status === "APPROVED") {
        statusColor = "text-green-500"
      } else if (status === "REJECTED") {
        statusColor = "text-red-500"
      } 
      return <span className={statusColor}>{status}</span>
    }
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

      {loading && <Loading />}

      <aside className="font-semibold bg-white p-2 rounded-lg gap-2 items-center flex flex-col">
        
        <span> Asset Statement </span>
        <div className="flex flex-row justify-between items-center gap-3">
          <span className="bg-slate-200 px-1.5 py-0.5 rounded-lg"> Available Balance: <b>{availableBal.toFixed(2)}</b> </span>
          
          <span className="bg-slate-200 px-1.5 py-0.5 rounded-lg"> Total Compounding: <b>{totalCompounding.toFixed(2)}</b> </span>
        </div>
        {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}
      </aside>
      

      <NewTable
        columns={columnsTable}
        fetchData={getAssetTx}
        enableFilters={false}
      />
    </div>
  )
}
