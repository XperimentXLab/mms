import { VscActivateBreakpoints } from "react-icons/vsc"
import HowItWorks from "./HowItWorks"
import WhoCanJoin from "./WhoCanJoin"


const JoinUs = () => {
  return (
    <div className="flex flex-col md:flex-row gap-2">

      <div className="p-2 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-2xl font-['Prosto_One']">Why Join Us?</h2>

          <ul className="list-inside">
            <li>
              <VscActivateBreakpoints />
              <strong className="font-['Stylish']">Expert Management:</strong> Your funds are managed professionally with years of market expertise.
            </li>

            <li>
              <VscActivateBreakpoints />
              <strong className="font-['Stylish']">Low-Risk Strategy:</strong> We prioritize stability and long-term growth.
            </li>

            <li>
              <VscActivateBreakpoints />
              <strong className="font-['Stylish']">Ethical Investing:</strong> Our portfolio is built on a foundation of responsible and ethical assets.            
            </li>

            <li>
              <VscActivateBreakpoints />
              <strong className="font-['Stylish']">Time-Saving:</strong> Enjoy a truly passive investing experience.            
            </li>
          </ul>
        </div>

        <WhoCanJoin />

      </div>

      <HowItWorks />
      
    </div>
  )
}

export default JoinUs
