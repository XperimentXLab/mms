import { Transition } from "@headlessui/react"
import { useEffect, useState } from "react"


const HowItWorks = () => {

  const [isMount, setIsMount] = useState<boolean>(false)

  useEffect(() => {
    setTimeout(() => {
      setIsMount(true)
    }, 100)
  }, [isMount])

  return (
    <Transition show={isMount}
      enterFrom={"translate-x-100 opacity-0"}
      enterTo={"translate-y-0 opacity-100"}
    >
      <div className="flex flex-col gap-2 bg-gray-200 p-2 rounded-2xl items-center transition-all duration-1500">

        <h2 className="text-xl font-['Concert_One']">
          How It Works: Your Path to Passive Investing
        </h2>

        <h2 className="font-semibold ">
          Primary Duties of a Fund Manager:-
        </h2>
        <ul className="list-disc list-inside">
          <li>
            Analyze financial markets to identify potential investment opportunities. 
          </li>
          <li>
            Make investment decisions, such as buying or selling assets based on the investment strategy.
          </li>
          <li>
            Manage investment portfolios to align with investors' objectives and risk levels.
          </li>
          <li>
            Continuously monitor investment performance and make adjustments when necessary.
          </li>
          <li>
            Provide regular performance reports to investors.
          </li>
        </ul>

        
        <div className="flex flex-col gap-2">
          <span>
            <strong className="font-['Stylish']">Professional Expertise:</strong> Your funds are managed by experts in investment and risk management.
          </span>
          
          <span>
            <strong className="font-['Stylish']">Better Risk Management</strong>: We minimize risk through portfolio diversification and personalized strategies.
          </span>

          <span>
            <strong className="font-['Stylish']">Wider Access:</strong> We open up investment opportunities that are hard for individuals to reach.
          </span>

          <span>
            <strong className="font-['Stylish']">Constant Monitoring:</strong> Your investments are continuously supervised by a professional team.
          </span>

          <span>
            <strong className="font-['Stylish']">Periodic Reports:</strong> Receive clear, regular reports on your investment performance.
          </span>
          
        </div>

      </div>
    </Transition>
  )
}

export default HowItWorks
