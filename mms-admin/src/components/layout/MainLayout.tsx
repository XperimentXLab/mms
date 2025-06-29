import { useEffect, useRef, useState } from "react"
import { Outlet, useNavigate } from "react-router"
import { GiHamburgerMenu } from "react-icons/gi";
import { NavLinkss } from "../props/theLinks";
import Loading from "../props/Loading";
import Buttons from "../props/Buttons";
import { logout, userDetails } from "../auth/endpoints";


const MainLayout = () => {

  const date = new Date().toLocaleDateString()
  const time = new Date().toLocaleTimeString()

  const navigate = useNavigate()
  const [loading, setLoading] = useState<boolean>(false)

  const [open, setOpen] = useState<boolean>(false)
  const toggleOpen = () => {
    return setOpen(!open)
  }

  const [openLogout, setOpenLogout] = useState<boolean>(false)
  const handleLogout = () => {
    setOpenLogout(!openLogout)
  }
  const confirmLogout = async () => {
    try {
      setLoading(true)
      await logout()
      alert('Logout successful.')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setOpenLogout(false)
      setLoading(false)
    }
  }


  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const handleClickOutside = (event: Event) => {
       if (menuRef.current && event.target && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [])


  const [username, setUsername] = useState<string>('')
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await userDetails()
        setUsername(response.username)
      } catch (error) {
        console.error('Error fetching user details:', error)
      }
    }
    fetchData()
  }, [])

  const Logout = () => {
    return (
      <div className="inset-0 flex fixed justify-center items-baseline mt-50">
        <div className="flex">
          <div className="flex flex-col gap-3 p-8 z-30 border rounded-lg backdrop-blur-sm bg-white/30">
            <h1 className="font-bold text-md">Are you sure to logout</h1>
            <button type="button" onClick={confirmLogout}
              className="cursor-pointer hover:bg-black hover:text-white active:bg-black active:text-white py-1 px-3 rounded-lg border"          
            >Logout</button>
            <button type="button" onClick={handleLogout}
              className="cursor-pointer hover:bg-black hover:text-white active:bg-black active:text-white py-1 px-3 rounded-lg border"
            >Cancel</button>
          </div>
        </div>

      </div>
    )
  }

  return (
    <div className="flex flex-col relative">

      <div className="fixed top-0 left-0 right-0 z-20">
        <header className="flex justify-between items-center border border-black py-2 px-3 bg-linear-to-r from-red-600 to-rose-300 bg-linear">
          <GiHamburgerMenu className="cursor-pointer" onClick={toggleOpen}/>
          <div className="flex items-center gap-4">

            <div className="flex flex-col items-center">
              <span className="text-xs">{date}</span>
              <span className="text-xs">{time}</span>
            </div>

            <img src="./mmsventure.jpeg" alt="MMS Logo" className="w-10 h-10 rounded-full" />

            <div className="flex flex-col cursor-default">
              <span className="font-semibold">Money Management Solution</span>
              <span>Welcome, {username}</span>
            </div>

          </div>   
        </header>

        <div className="flex relative">
        {open && 
        <nav ref={menuRef} className="absolute flex flex-col w-fit h-fit gap-1 items-center bg-red-500 px-1 py-3">
          <NavLinkss to={'/'}>Dashboard</NavLinkss>
          <NavLinkss to={'/setup'}>Setup</NavLinkss>
          <NavLinkss to={'/operation'}>Operation</NavLinkss>
          <NavLinkss to={'/users'}>Users</NavLinkss>
          <NavLinkss to={'/verification'}>Verification</NavLinkss>
          <NavLinkss to={'/asset/requests'}>Asset Request</NavLinkss>
          <NavLinkss to={'/withdraw/requests'}>Withdraw Request</NavLinkss>
          <NavLinkss to={'/transaction'}>Transaction</NavLinkss>
          <Buttons type="button" onClick={handleLogout}
            className="hover:bg-black hover:text-white active:bg-black active:text-white py-1 px-3 rounded-lg cursor-pointer"
          >Logout</Buttons>
        </nav>
        }
      </div>
      </div>


      {openLogout && <Logout />}

      <div className="h-full mt-15 mb-5 md:bg-[url(../BG-MMS-DESKTOP.png)] bg-[url(../BG-MMS-MOBILE.png)]">
        <Outlet />
      </div>


      <footer className="fixed flex bottom-0 p-1 bg-white">
        <h1>&copy; 2025 MMS All rights reserved.</h1>
      </footer>

      {loading && <Loading />}

    </div>
  )
}

export default MainLayout
