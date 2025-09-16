import { useState } from "react"
import { NewTable} from "../props/Tables"
import Loading from "../props/Loading"
import { downloadExcelVerification, getAllUsers, processVeri } from "../auth/endpoints"
import Buttons, { RejectionInput } from "../props/Buttons"
import type { ColumnDef } from "@tanstack/react-table"
import { NotiErrorAlert, NotiSuccessAlert } from "../props/Noti"


const Verifications = () => {

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleApprove = async (id: string) => {
    try {
      setLoading(true)
        await processVeri({
          user_id: id,
          action: 'Approve'
        })
      NotiSuccessAlert('Verification approved')
    } catch (error: any) {
      setErrorMessage(error.response.data.error)
      NotiErrorAlert(error.response.data.error)
    } finally {
      setLoading(false)
    }
  }


  const handleReject = async (id: string, reason: string) => {
    try {
      setLoading(true);
      await processVeri({
        user_id: id,
        action: 'Reject',
        reject_reason: reason || 'Try again'
      })
      NotiSuccessAlert('Verification rejected');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Something went wrong');
      NotiErrorAlert(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };


  const handleViewDoc = (url: string | null | undefined) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  /*
  const handleWelcomeB = async (id: string, username: string) => {
    try {
      setLoading(true)
      await grantFreeCampro(id)
      alert(`Welcome bonus granted ${username}`)
    } catch (error: any) {
      setErrorMessage(error.response.data.error)
    } finally {
      setLoading(false)
    }
  }
  */

  const columns: ColumnDef<any, any>[] = [
    { header: 'First Name', 
      accessorKey: 'first_name',
      cell: info => info.getValue() ?? '-'
     },
    { header: 'Last Name', 
      accessorKey: 'last_name',
      cell: info => info.getValue() ?? '-'
     },
    { header: 'I/C', 
      accessorKey: 'ic',
      cell: info => info.getValue() ?? '-'
     },
    { header: 'Address Line', 
      accessorKey: 'address_line',
      cell: info => info.getValue() ?? '-'
     },
    { header: 'City', 
      accessorKey: 'address_city',
      cell: info => info.getValue() ?? '-'
     },
    { header: 'State', 
      accessorKey: 'address_state',
      cell: info => info.getValue() ?? '-'
     },
    { header: 'Postcode', 
      accessorKey: 'address_postcode',
      cell: info => info.getValue() ?? '-'
     },
    { header: 'Country', 
      accessorKey: 'address_country',
      cell: info => info.getValue() ?? '-'
     },
    { header: 'Document', 
      accessorKey: 'ic_document_url',
      cell: info => {
        const value = info.getValue()
        return (
        <button
          onClick={() => handleViewDoc(value)}
          disabled={value ? false : true}
          className={`px-3 py-1 rounded ${ value ? 'bg-black text-white cursor-pointer hover:bg-gray-800' : 'bg-gray-300 cursor-not-allowed'}`}
        >
          View
        </button>
      )}
    },
    { header: 'Action', 
      accessorKey: 'id',
      cell: info => {
        const row = info.row.original
        if (!row) return null;

        if (row.verification_status === 'REQUIRES_ACTION') {
          return 'User needs to upload document first.';
        }

        return (
          <div className="flex gap-2 items-center">
            <Buttons
              type="button"
              onClick={() => handleApprove(row.id)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
            >
              Approve
            </Buttons>

            <RejectionInput
              id={row.id} 
              onReject={handleReject} 
              initialReason={row.reject_reason || ''}
            />
          </div>
        );
      }
    },
    /*
    { header: 'Welcome Bonus', 
      accessorKey: 'id',
      cell: info => {

        const row = info.row.original;
        if (!row) return null;

        return(
          <div>
            {!row.is_campro ?
              <Buttons
                type="button"
                onClick={() => handleWelcomeB(row.id, row.username)}
                className="px-3 py-1 rounded bg-green-500 text-white cursor-pointer hover:bg-green-600"
              >
                Grant
              </Buttons> : 
              <span className="text-green-500">Granted</span>
            }
          </div>
      )}
    },
    */
    { header: 'Status', 
      accessorKey: 'verification_status',
      cell: info => info.getValue()
    },
    /*
    { header: 'Asset', 
      accessorKey: 'asset_amount',
      cell: info => info.getValue() ?? '0'
    },
    { header: 'Promo Code',
      accessorKey: 'promocode',
      cell: info => info.getValue() ?? '-'
    }
    */
  ]

  return (
    <div className="flex flex-col gap-2 justify-center m-3">
      {loading && <Loading />}
      <span className="text-white">Verification</span>

      <div className="flex flex-col gap-1">
      {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span>}
        <NewTable columns={columns}
          fetchData={getAllUsers}
          enableDatePicker={false}
          enableStatusCampro={true}
          enableExport={true}
          downloadExcel={downloadExcelVerification}
        />
      </div>
    </div>
  )
}

export default Verifications
