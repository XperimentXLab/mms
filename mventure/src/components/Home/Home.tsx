import { NavLink } from "react-router-dom"
import Body from "./Body"
import Side from "./Side"
import { Transition } from "@headlessui/react"
import { useEffect, useState } from "react"
import { AboutUsSimple } from "../About/AboutUs"


const Home = () => {

  const [isMount, setIsMount] = useState<boolean>(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMount(true), 100);
    return () => clearTimeout(timer);
  }, [isMount]);


  return (
    <div className="flex flex-col gap-3">

      <Body />
      <Side />

      <Transition show={isMount}
        enterFrom="translate-y-100 ease-in-out"
        enterTo="translate-y-0"
      >
        <div className="transition-all duration-700 bg-black text-white p-3 rounded-t-2xl text-shadow-amber-400 text-shadow-xs">
          <AboutUsSimple />
        </div>
      </Transition>

      <NavLink to="/faqs" className={`font-mono`}>FAQs</NavLink>
      
      <NavLink to="/contact" className={`font-mono`}>Still got more question? Contact us.</NavLink>
    </div>
  )
}

export default Home
