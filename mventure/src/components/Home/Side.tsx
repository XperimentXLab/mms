import { Transition } from "@headlessui/react"
import { useEffect, useState } from "react"


const Side = () => {

  const [isMount, setIsMount] = useState<boolean>(false)

  useEffect(() => {
    setTimeout(() => {
      setIsMount(true)
    }, 100)
  }, [isMount])

  return (
    <div className="flex flex-col gap-2 backdrop-blur-xl p-3">

      <h2 className="font-semibold font-['Concert_One'] text-2xl">The Benefits</h2>

      <ul className="list-inside grid md:grid-cols-3 grid-cols-1 gap-2">
        <Transition show={isMount}
          enterFrom="opacity-0"
          enterTo="opacity-100"
        >
          <li className="transition-all duration-1500 ease-in bg-indigo-400 border-2 border-indigo-600 rounded-lg p-1">
            ✨ Passive Income
          </li>
        </Transition>

        <Transition show={isMount}
          enterFrom="opacity-0"
          enterTo="opacity-100"
        >
          <li className="transition-all duration-1800 ease-in bg-indigo-400 border-2 border-indigo-600 rounded-lg p-1">
            ✨ More Time for Yourself
          </li>
        </Transition>

        <Transition show={isMount}
          enterFrom="opacity-0"
          enterTo="opacity-100"
        >
          <li className="transition-all duration-2100 ease-in bg-indigo-400 border-2 border-indigo-600 rounded-lg p-1">
            ✨ Security if You Lose Your Job
          </li>
        </Transition>
      </ul>
      
    </div>
  )
}

export default Side
