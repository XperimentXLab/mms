import { useEffect, useRef, useState } from "react"
import { Outlet, useNavigate } from "react-router"
import { GiHamburgerMenu } from "react-icons/gi";
import { NavLinkss } from "../props/theLinks";
import Loading from "../props/Loading";
import { logout, getUsername } from "../auth/endpoints";
import Buttons from "../props/Buttons";
import { useAutoLogout } from "../auth/api";
import { NotiSuccessAlert } from "../props/Noti";

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
      NotiSuccessAlert('Logout successful.')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
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

  useAutoLogout();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUsername()
        setUsername(response)
      } catch (error) {
        console.error('Error fetching user details:', error)
      }
    }
    fetchData()
  }, [])

  const Logout = () => {
    return (
      <div className="inset-0 flex fixed justify-center items-baseline mt-50 z-50">
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

  //const toggleMenu = document.getElementById('toggleMenu');
/*
  document.addEventListener('click', (event) => {
    if (!toggleMenu.contains(event.target)) {
      toggleMenu.classList.add('hidden'); // Tailwind handles hiding it
    }
  });
*/

  return (
    <div className="flex flex-col relative bg-black ">

      <div className="fixed top-0 left-0 right-0 z-20">
        <header className="flex justify-between items-center m-1 rounded-2xl py-2 px-3 bg-linear-to-r from-blue-800 to-rose-500 bg-linear border border-black">
          <GiHamburgerMenu className="cursor-pointer" onClick={toggleOpen}/>
          <div className="flex items-center gap-4">

            <div className="flex flex-col items-center">
              <span className="text-xs">{date}</span>
              <span className="text-xs">{time}</span>
            </div>

            <img src="../mmsventure.jpeg" alt="MMS Logo" className="w-10 h-10 rounded-full" />

            <div className="flex flex-col cursor-default">
              <span className="font-semibold text-sm">Money Management Solution</span>
              <span>Welcome, {username}</span>
            </div>

          </div>   
        </header>

        <div className="flex relative">
        {open && 
        <nav ref={menuRef} className="absolute flex flex-col -mt-1 ml-1 w-fit h-fit gap-1 rounded-2xl items-center bg-red-500 px-1 py-3">
          <NavLinkss to={'/'} className="hover:shadow-md shadow-indigo-800">Home</NavLinkss>
          <NavLinkss to={'/profile'} className="hover:shadow-md shadow-indigo-800">Profile</NavLinkss>
          <NavLinkss to={'/network'} className="hover:shadow-md shadow-indigo-800">Network</NavLinkss>
          <NavLinkss to={'/wallet'} className="hover:shadow-md shadow-indigo-800">Wallet</NavLinkss>
          <NavLinkss to={'/asset'} className="hover:shadow-md shadow-indigo-800">Asset</NavLinkss>
          <NavLinkss to={'/others'} className="hover:shadow-md shadow-indigo-800">Others</NavLinkss>
          <Buttons type="button" onClick={handleLogout}
            className="hover:bg-black hover:text-white active:bg-black active:text-white py-1 px-3 rounded-lg cursor-pointer"
          >Logout</Buttons>
        </nav>
        }
      </div>
      </div>


      {openLogout && <Logout />}

      <div className="mt-17 pb-5 bg-cover w-full min-h-screen md:bg-[url(/BG-MMS-DESKTOP.png)] bg-[url(/BG-MMS-MOBILE.png)]">
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
