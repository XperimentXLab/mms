import { useEffect, useMemo, useState } from "react"
import { Tables } from "../props/Tables"
import Loading from "../props/Loading"
import { getAllUsers, grantFreeCampro, processVeri } from "../auth/endpoints"
import Buttons, { RejectionInput } from "../props/Buttons"

interface userDetail {
  id: string
  username: string
  first_name: string
  last_name: string
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
}


const Verifications = () => {

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [userDetailss, setUserDetailss] = useState<userDetail[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await getAllUsers()
      setUserDetailss(response)
    } catch (error: any) {
      setErrorMessage(error.response.data.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleApprove = (id: string) => {
    const fetchData = async () => {
      try {
        setLoading(true)
          await processVeri({
            user_id: id,
            action: 'Approve'
          })
        setUserDetailss(prev => prev.map(user => 
          user.id === id ? { 
            ...user, 
            verification_status: 'APPROVED' 
          } 
            : user
        ))
        alert('Verification approved')
      } catch (error: any) {
        setErrorMessage(error.response.data.error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }


  const handleReject = (id: string, reason: string) => {
    const fetchData = async () => {
      if (!reason) {
        alert('Please fill the rejection reason')
      }
      try {
        setLoading(true);
        await processVeri({
          user_id: id,
          action: 'Reject',
          reject_reason: reason
        });
        setUserDetailss(prev => prev.map(user =>
          user.id === id ? {
            ...user,
            verification_status: 'REJECTED',
            reject_reason: reason
          } : user
        ));
        alert('Verification rejected');
      } catch (error: any) {
        setErrorMessage(error.response?.data?.error || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };


  const handleViewDoc = (url: string | null | undefined) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleWelcomeB = (id: string) => {
    const fetchData = async () => {
      try {
        setLoading(true)
        await grantFreeCampro(id)
        alert('Welcome bonus granted')
      } catch (error: any) {
        setErrorMessage(error.response.data.error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }

  const columns = useMemo(() => [
    { header: 'First Name', 
      accessor: 'first_name',
      render: (value: string) => value ? value : '-'
     },
    { header: 'Last Name', 
      accessor: 'last_name',
      render: (value: string) => value ? value : '-'
     },
    { header: 'I/C', 
      accessor: 'ic',
      render: (value: number) => value
     },
    { header: 'Address Line', 
      accessor: 'address_line',
      render: (value: string) => value ? value : '-'
     },
    { header: 'City', 
      accessor: 'address_city',
      render: (value: string) => value ? value : '-'
     },
    { header: 'State', 
      accessor: 'address_state',
      render: (value: string) => value ? value : '-'
     },
    { header: 'Postcode', 
      accessor: 'address_postcode',
      render: (value: string) => value ? value : '-'
     },
    { header: 'Country', 
      accessor: 'address_country',
      render: (value: string) => value ? value : '-'
     },
    { header: 'Status', 
      accessor: 'verification_status',
      render: (value: string) => value
    },
    { header: 'Document', 
      accessor: 'ic_document_url',
      render: (value: string) => (
        <button
          onClick={() => handleViewDoc(value)}
          disabled={value ? false : true}
          className={`px-3 py-1 rounded ${ value ? 'bg-black text-white cursor-pointer hover:bg-gray-800' : 'bg-gray-300 cursor-not-allowed'}`}
        >
          View
        </button>
      )
    },
    { header: 'Action', 
      accessor: 'id',
 render: (id: string) => {
  const row = userDetailss.find(user => user.id === id);
  if (!row) return null;

  if (row.verification_status === 'REQUIRES_ACTION') {
    return 'User needs to upload document first.';
  }

  return (
    <div className="flex gap-2 items-center">
      <Buttons
        type="button"
        onClick={() => handleApprove(id)}
        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Approve
      </Buttons>

      <RejectionInput
        id={id} 
        onReject={handleReject} 
        initialReason={row.reject_reason | 'Try again'}
      />
    </div>
      );
    }
    },
    { header: 'Welcome Bonus', 
      accessor: 'is_campro',
      render: (value: userDetail) => (
        <div>
          {!value.is_campro ?
            <Buttons
              type="button"
              onClick={() => handleWelcomeB(value.id)}
              className="px-3 py-1 rounded bg-green-500 text-white cursor-pointer hover:bg-green-600"
            >
              Grant
            </Buttons> : 
            <span className="text-green-500">Granted</span>
          }
        </div>
      )
    },
    { header: 'Promo Code',
      accessor: 'promocode',
      render: (value: string) => value ? value : '-'
    }

  ], [userDetailss])

  const data = userDetailss

  return (
    <div className="flex flex-col gap-2 justify-center m-3">
      {loading && <Loading />}
      <span className="text-white">Verification</span>

      <div className="flex flex-col gap-1">
        {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span>}
        <Tables columns={columns} data={data}
          enableFilters={true}
          enableSorting={true}
          enablePagination={true}
        />
      </div>
    </div>
  )
}

export default Verifications
