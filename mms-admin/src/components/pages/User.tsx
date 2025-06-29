import { useEffect, useState } from "react"
import Tables, { type Data } from "../props/Tables"
import { getAllUsers } from "../auth/endpoints"
import Loading from "../props/Loading"

const User = () => {

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const columnsUserDetails = [
    { header: 'User ID', accessor: 'id' },
    { header: 'Username', accessor: 'username' },
    { header: 'I/C', accessor: 'ic' },
    { header: 'Email', accessor: 'email' },
    { header: 'Joined Date', accessor: 'created_at' },
    { header: 'Asset', accessor: 'user.asset.amount' },
    { header: 'Verification', accessor: 'verification_status' },
    { header: 'I/C Document', accessor: 'ic_document' },
  ]
  const [dataUserDetails, setDataUserDetails] = useState<Data[]>([])

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const resUserDetails = await getAllUsers()
        setDataUserDetails(resUserDetails)
      } catch (error: any) {
        setErrorMessage(error.response.data.error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  },[])

  return (
    <div className="flex flex-col gap-3 m-4 items-center">
      {loading && <Loading />}

      <span>All Users</span>
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}
      <div>
        <Tables columns={columnsUserDetails} data={dataUserDetails}/>
      </div>

    </div>
  )
}

export default User
