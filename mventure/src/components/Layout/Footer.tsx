import { NavLink } from "react-router-dom"


const Footer = () => {
  return (
    <div className="fixed w-full bottom-0">
      
      <div className="bg-red-600 px-2 py-1 grid grid-cols-3 gap-3">

        <div className="flex flex-col gap-1">
          <NavLink to="/about">About Us</NavLink>
          <span>This is us. Please pay attention</span>

          <NavLink to="/faqs">FAQs</NavLink >
        </div>

        <div className="flex flex-col gap-1">
          <NavLink to="/join">Join Us</NavLink>
          <span>How it works</span>
          <span>Who Can Join</span>
        </div>

        <div className="flex flex-col gap-1">
          <NavLink to="/contact">Contact Us</NavLink>
          <span>WhatsApp</span>
          <span>Email</span>
          <span>Phone No</span>
        </div>
        
      </div>

    </div>
  )
}

export default Footer
