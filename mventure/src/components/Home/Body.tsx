
import { Transition } from "@headlessui/react"
import { useEffect, useState } from "react"
import { GiPointing } from "react-icons/gi"

const Body = () => {

  const [isMount, setIsMount] = useState<boolean>(false)

  useEffect(() => {
    setTimeout(() => {
      setIsMount(true)
    }, 100)
  }, [isMount])
  

  return (
    <div className="flex flex-col gap-4 backdrop-blur-xl p-3">

      <h2 className="font-bold text-4xl md:text-5xl font-['Prosto_One']">Grow Your Wealth. We Handle the Crypto.</h2>

      <Transition show={isMount}
        enterFrom="-translate-x-70 ease-out"
        enterTo="translate-x-0"
      >
        <span className="transition-all duration-3000 hover:-translate-y-2">
          <GiPointing />
          Our expert fund managers trade crypto for you, aiming for consistent growth on your assets. It’s a simple way to get into crypto and grow your money without the hassle.
        </span>
      </Transition>

      <Transition show={isMount}
        enterFrom="translate-x-70 ease-in-out"
        enterTo="translate-x-0"
      >
        <span className="transition-all duration-3000  hover:-translate-y-2">
          <GiPointing />
          Financial freedom and long-term peace of mind come from having passive income.
        </span>
      </Transition>

    </div>
  )
}

export default Body
