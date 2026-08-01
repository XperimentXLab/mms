import { Outlet } from "react-router-dom"
import { NavLinkss } from "../props/theLinks"
import Buttons from "../props/Buttons"
import { useEffect, useRef, useState } from "react"


const AssetLayout = () => {

  const [open, setOpen] = useState<boolean>(false)
  const toggleOpen = () => {
    setOpen(!open)
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

  return (
    <div className="flex flex-col items-center p-4 relative">
      <nav className="flex gap-2 bg-white p-1 w-full justify-center items-center rounded-lg">
        <NavLinkss to="">Asset</NavLinkss>
        <Buttons type="button" onClick={toggleOpen}
          className={`hover:cursor-pointer hover:bg-black hover:text-white active:bg-black active:text-white ${open ? 'bg-black text-white' : 'bg-gray-200 text-black' }  px-3 py-1 rounded-lg`}
        >Statement</Buttons>
      </nav>

      {open && <nav ref={menuRef}
      className="absolute mt-9 flex items-center justify-centerflex-wrap bg-gray-200 p-2 rounded-2xl gap-2 z-10">
        <NavLinkss to='statement'>Asset</NavLinkss>
        <NavLinkss to='statement/withdrawal'>Withdrawal</NavLinkss>
      </nav>}

      <div className="w-full my-4">
        <Outlet />
      </div>
    </div>
  )
}

export default AssetLayout
