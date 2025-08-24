import { NavLink } from "react-router-dom"
import Body from "./Body"
import Side from "./Side"
import { Transition } from "@headlessui/react"
import { useEffect, useState } from "react"
import { AboutUsSimple } from "../About/AboutUs"
import { FAQEntry } from "../FAQ/FAQs"


const Home = () => {

  const [isMount, setIsMount] = useState<boolean>(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMount(true), 100);
    return () => clearTimeout(timer);
  }, [isMount]);


  return (
    <div className="flex flex-col gap-4">

      <Body />
      <Side />

      <Transition show={isMount}
        enterFrom="translate-y-100 ease-in-out"
        enterTo="translate-y-0"
      >
        <div className="transition-all duration-700 bg-black text-white rounded-t-2xl text-shadow-amber-400 text-shadow-xs">
          <AboutUsSimple />
        </div>
      </Transition>

      <NavLink to="/faqs" className={"flex flex-col gap-2"}>
        <span className={`font-['Concert_One'] text-2xl`}>FAQs</span>
        <FAQEntry 
          question="Who can join MVenture?"
          answer={["Anyone 18+ — from first-time investors to seasoned pros, locally or abroad."]}
        />
        <FAQEntry
          question="Is there a minimum investment amount?"
          answer={["Yes, MVenture has a low minimum investment requirement, making it accessible for a wide range of investors which is 500 USDT."]}
        />
      </NavLink>

      <NavLink to="/contact" className={`font-['Concert_One'] text-2xl`}>Still got more question? Contact us.</NavLink>
    </div>
  )
}

export default Home
