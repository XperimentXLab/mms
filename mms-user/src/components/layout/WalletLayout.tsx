import { Outlet } from "react-router-dom"
import { NavLinkss } from "../props/theLinks"
import { useState } from "react"
import Buttons from "../props/Buttons"


const WalletLayout = () => {

  const [open, setOpen] = useState(false)
  const toggleMenu = () => {
    setOpen(!open);
  }

  return (
    <div className="flex flex-col items-center p-4 relative">
      <nav className="flex gap-2 bg-white rounded-xl py-1 w-full justify-center items-center">
        <NavLinkss to="" >Wallet</NavLinkss>
        <Buttons type="button" onClick={toggleMenu} 
          className={`hover:cursor-pointer hover:bg-black hover:text-white active:bg-black active:text-white ${open ? 'bg-black text-white' : 'bg-gray-200 text-black' }  px-3 py-1 rounded-lg`}
          >Statement</Buttons>
      </nav>

      {open && <nav className="absolute flex flex-col sm:flex-row bg-gray-200 p-2 rounded-2xl gap-2 justify-center w-fit mt-9 z-10">
        <NavLinkss to="statement/profit">Personal Profit</NavLinkss>
        <NavLinkss to="statement/commission">Commission</NavLinkss>
        <NavLinkss to="statement/transfer">Transfer</NavLinkss>
        <NavLinkss to="statement/convert">Convert</NavLinkss>
        <NavLinkss to="statement/withdrawal">Withdrawal</NavLinkss>
      </nav>}

      <div className="w-full my-4">
        <Outlet />
      </div>
      
    </div>
  )
}

export default WalletLayout
