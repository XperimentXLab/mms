import { FaPhoneFlip, FaWhatsapp } from "react-icons/fa6"
import { MdOutlineEmail } from "react-icons/md"
import type { JSX } from "react/jsx-dev-runtime";


interface InfoProps {
  icon: JSX.Element;
  contact: string;
  description: string;
  hours: string;
}

const InfoDisplay: React.FC<InfoProps>  = ({
  icon, contact, description, hours
}) => {
  return (
    <div className="flex flex-col gap-2 px-3 py-2 bg-gray-200 rounded-2xl border">
      <span className="text-2xl">{icon}</span>
      <strong>{contact}</strong>
      <span>{description}</span>
      <span className="font-semibold">{hours}</span>
    </div>
  )

}

const WhatsAppContact= () => {
  return (
    <InfoDisplay 
      icon={<FaWhatsapp />}
      contact="01X-XXXXXXXX"
      description="Chat with us on WhatsApp."
      hours="7 am - 12 am"
    />
  )
}

const CallContact = () => {
  return (
    <InfoDisplay
      icon={<FaPhoneFlip />}
      contact="01X-XXXXXXXX"
      description="Call us for more information."
      hours="9 am - 5 pm"
    />
  )
}

const EmailContact = () => {
  return (
    <InfoDisplay
      icon={<MdOutlineEmail />}
      contact="info@example.com"
      description="Email us your query."
      hours="24/7"
    />
  )
}

const ContactUs = () => {
  return (
    <div className="flex flex-col gap-4 py-3 px-2">
      <h1 className="font-semibold text-3xl font-['Prosto_One']">Contact Us</h1>

      <WhatsAppContact />
      <EmailContact />
      <CallContact />

    </div>
  )
}

export default ContactUs
