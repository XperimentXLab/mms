import { FaPhoneFlip, FaWhatsapp } from "react-icons/fa6"
import { MdOutlineEmail } from "react-icons/md"
import { NavLink } from "react-router-dom"


const Footer = () => {
  return (
    <div className="w-full bottom-0">
      
      <div className="bg-red-600 px-5 py-3 grid grid-cols-3 gap-3">

        <div className="flex flex-col gap-1">
          <NavLink to="/join" className={"hover:text-amber-500  hover:font-semibold"}>Join Us</NavLink>
          <NavLink to='/performance' className={"hover:text-amber-500 hover:font-semibold"}>Performance</NavLink>
        </div>

        <div className="flex flex-col gap-1">
          <NavLink to="/about" className={"hover:text-amber-500 hover:font-semibold"}>About Us</NavLink>
          <NavLink to="/faqs" className={"hover:text-amber-500 hover:font-semibold"}>FAQs</NavLink >
        </div>

        <div className="flex flex-col gap-1">
          <NavLink to="/contact" className={"hover:text-amber-500 hover:font-semibold"}>Contact Us</NavLink>
          <div className="flex flex-row gap-2 hover:cursor-pointer">
            <FaWhatsapp />
            <MdOutlineEmail />
            <FaPhoneFlip />
            </div>
        </div>
        
      </div>

      <h1 className="flex justify-center bg-gray-500 text-white">&copy; 2025 MMS All rights reserved.</h1>

    </div>
  )
}

export default Footer
