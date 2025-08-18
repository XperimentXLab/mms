import HowItWorks from "./HowItWorks"
import WhoCanJoin from "./WhoCanJoin"


const JoinUs = () => {
  return (
    <div className="flex flex-col gap-2">

      <span className="bg-amber-300 p-2">
        <h2 className="font-bold text-xl font-['Prosto_One']">Why Join Us?</h2>

        <ul className="list-inside list-decimal">
          <li>
            <strong className="font-['Stylish']">Expert Management:</strong> Your funds are managed professionally with years of market expertise.
          </li>

          <li>
            <strong className="font-['Stylish']">Low-Risk Strategy:</strong> We prioritize stability and long-term growth.
          </li>

          <li>
            <strong className="font-['Stylish']">Ethical Investing:</strong> Our portfolio is built on a foundation of responsible and ethical assets.            
          </li>

          <li>
            <strong className="font-['Stylish']">Time-Saving:</strong> Enjoy a truly passive investing experience.            
          </li>
        </ul>

      </span>

      <HowItWorks />

      <WhoCanJoin />
    </div>
  )
}

export default JoinUs
