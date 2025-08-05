

const Footer = () => {
  return (
    <div className="w-full">
      
      <div className="bg-red-600 px-2 py-1 grid grid-cols-3 gap-3">

        <div className="flex flex-col gap-1">
          <h2>About Us</h2>
          <span>This is us. Please pay attention</span>

          <h2>Join Us</h2> {/* Link to login */}
        </div>

        <div className="flex flex-col gap-1">
          <h2>Our Services</h2>
          <span>- Service 1</span>
          <span>- Service 2</span>
        </div>

        <div className="flex flex-col gap-1">
          <h2>Contact Us</h2>
          <span>WhatsApp</span>
          <span>Email</span>
          <span>Phone No</span>
        </div>
        
      </div>

    </div>
  )
}

export default Footer
