import { FaPhoneFlip, FaWhatsapp } from "react-icons/fa6"
import { MdOutlineEmail } from "react-icons/md"
import { NavLink } from "react-router-dom"


const Footer = () => {
  return (
    <div className="w-full bottom-0">
      
      <div className="bg-red-600 px-2 py-1 grid grid-cols-3 gap-3">

        <div className="flex flex-col gap-1">
          <NavLink to="/join">Join Us</NavLink>
          <span>How it works</span>
          <span>Who Can Join</span>
        </div>

        <div className="flex flex-col gap-1">
          <NavLink to="/about">About Us</NavLink>
          <NavLink to="/faqs">FAQs</NavLink >
        </div>

        <div className="flex flex-col gap-1">
          <NavLink to="/contact">Contact Us</NavLink>
          <div className="flex flex-row gap-2 hover:cursor-pointer">
            <FaWhatsapp />
            <MdOutlineEmail />
            <FaPhoneFlip />
            </div>
        </div>
        
      </div>

    </div>
  )
}

export default Footer
