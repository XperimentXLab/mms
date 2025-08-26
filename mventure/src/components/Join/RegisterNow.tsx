import { Transition } from "@headlessui/react"
import { useEffect, useState } from "react";


const RegisterNow = () => {

  const [isMount, setIsMount] = useState<boolean>(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMount(true), 100);
    return () => clearTimeout(timer);
  }, [isMount]);

  return (
    <Transition
      show={isMount}
      enter="transition ease-out duration-700"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="transition ease-in duration-500"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      <a href="https://mmsventure.io/register"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-all duration-300 ease-in-out cursor-pointer px-6 py-3 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 text-white font-semibold rounded-full shadow-lg hover:scale-105 hover:shadow-xl"
      >Register Now 🚀</a>
    </Transition>
  )
}

export default RegisterNow
