import { useEffect, useState } from "react"
import Tables, { type Data } from "../props/Tables"
import { getAllUsers } from "../auth/endpoints"
import Loading from "../props/Loading"

const User = () => {

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const columns = [
    { header: 'User ID', accessor: 'id' },
    { header: 'Username', accessor: 'username' },
    { header: 'I/C', accessor: 'ic' },
    { header: 'Email', accessor: 'email' },
  ]

  const [data, setData] = useState<Data[]>([])

  useEffect(()=>{
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getAllUsers()
        setData(response)
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
      <Tables columns={columns} data={data}/>
      
    </div>
  )
}

export default User
