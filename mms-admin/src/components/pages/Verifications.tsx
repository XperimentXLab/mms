import { useEffect, useState } from "react"
import Tables from "../props/Tables"
import Loading from "../props/Loading"
import { getAllUsers, grantFreeCampro, processVeri } from "../auth/endpoints"
import Buttons from "../props/Buttons"

interface userDetail {
  id: string
  username: string
  first_name: string
  last_name: string
  ic: string
  address_line: string | null
  address_city: string | null
  address_state: string | null
  address_postcode: string | null
  address_country: string | null
  verification_status: 'REQUIRES_ACTION' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  ic_document?: string | null
  ic_document_url?: string | undefined
  is_campro?: boolean
  reject_reason?: string | null
}


const Verifications = () => {

  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [userDetailss, setUserDetailss] = useState<userDetail[]>([])
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})

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

  const handleReasonChange = (id: string, reason: string) => {
    setRejectionReasons(prev => ({ ...prev, [id]: reason }))
  }

  const handleReject = (id: string) => {
    const reason = rejectionReasons[id] || 'No reason provided'
    const fetchData = async () => {
      try {
        setLoading(true)
          await processVeri({
            user_id: id,
            action: 'Reject'
          })
        setUserDetailss(prev => prev.map(user => 
          user.id === id ? { 
            ...user, 
            verification_status: 'REJECTED', 
            reject_reason: reason } 
            : user
        ))
        alert('Verification rejected')
      } catch (error: any) {
        setErrorMessage(error.response.data.error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
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

  const columns = [
    { header: 'First Name', accessor: 'first_name' },
    { header: 'Last Name', accessor: 'last_name' },
    { header: 'I/C', accessor: 'ic' },
    { header: 'Address', accessor: 'address_line' },
    { header: 'City', accessor: 'address_city' },
    { header: 'State', accessor: 'address_state' },
    { header: 'Postcode', accessor: 'address_postcode' },
    { header: 'Country', accessor: 'address_country' },
    { header: 'Status', accessor: 'verification_status'},
    { header: 'Document', accessor: 'ic_document'},
    { header: 'Action', accessor: 'action'},
    { header: 'Welcome Bonus', accessor: 'is_campro'},

  ]

  const data = userDetailss.map(user => ({
    ...user,
    ic_document: (
      <a
        href={user.ic_document_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`px-3 py-1 rounded ${user.verification_status === 'REQUIRES_ACTION' ? 'bg-gray-300 cursor-not-allowed ' : 'bg-black text-white cursor-pointer hover:bg-gray-800'}`}
      >View</a>
    ),
    action: (
      <div>
        {user.verification_status === 'REQUIRES_ACTION' ? 
          'User need to upload document first.'
         :          
         <div className="flex gap-2">
            <Buttons
            type="button"
            onClick={() => handleApprove(user.id)}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
            >Approve</Buttons>

          
            <input
              type="text"
              placeholder="Reason for rejection"
              value={rejectionReasons[user.id] || ''}
              onChange={(e) => handleReasonChange(user.id, e.target.value)}
              className="border p-1 rounded text-sm"
            />
            <Buttons
              type="submit"
              onClick={() => handleReject(user.id)}
              disabled={!rejectionReasons[user.id]}
              className={`px-3 py-1 rounded ${rejectionReasons[user.id] ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              Reject
            </Buttons>
          </div>}
      </div>
    ),
    is_campro: (
      <div>
        {!user.is_campro ?
          <Buttons
            type="button"
            onClick={() => handleWelcomeB(user.id)}
            className="px-3 py-1 rounded bg-green-500 text-white cursor-pointer hover:bg-green-600"
          >
            Grant
          </Buttons> : 
          <span className="text-green-500">Granted</span>
        }
      </div>
    )
  }))

  return (
    <div className="flex flex-col gap-2 justify-center m-3">
      {loading && <Loading />}
      <span className="text-white">Verification</span>

      <div className="flex flex-col gap-1 ">
        {errorMessage && <span className="text-sm text-red-500">{errorMessage}</span>}
        <Tables columns={columns} data={data}/>
      </div>
    </div>
  )
}

export default Verifications
