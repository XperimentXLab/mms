import { Transition } from "@headlessui/react"
import { useEffect, useState } from "react"


const WhoCanJoin = () => {

  const [isMount, setIsMount] = useState<boolean>(false)

  useEffect(() => {
    setTimeout(() => {
      setIsMount(true)
    }, 100)
  }, [isMount])

  return (
    <Transition show={isMount}
      enterFrom={"scale-25"}
      enterTo={"opacity-100"}
    >
      <div className="flex flex-col gap-2 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 p-3 transition-all shadow-md shadow-blue-800 duration-500 rounded-2xl items-center">
        <h1 className="text-2xl font-['Concert_One']">Who Can Join Us?</h1>

        <span>
          <strong className="font-['Stylish']">Individuals:</strong> For both local residents and non-residents, as long as they are 18 years or older. A low minimum investment makes it accessible to a wide audience.
        </span>

        <span>
          <strong className="font-['Stylish']">Corporate Investors:</strong> Companies and other organizations that interested invest their funds.
        </span>

        <span>
          <strong className="font-['Stylish']">Investors with a Long-Term Horizon:</strong> Unit trusts are a suitable option for those who can invest for a longer period to take advantage of the compounding effect.
        </span>
      </div>
    </Transition>
  )
}

export default WhoCanJoin
