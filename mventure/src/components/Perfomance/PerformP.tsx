import Calculator from "./Calculator"
import PerformChart from "./PerformChart"


const PerformP = () => {
  return (
    <div className="flex flex-col w-full gap-5 justify-center items-center p-2">
      <h1 className="font-semibold text-3xl font-['Prosto_One']">Performance</h1>

      <span className="text-xl font-semibold">
        Words for the performance section describing its features and benefits.
      </span>

      <div className="grid md:grid-cols-2 grid-cols-1 gap-5 w-full justify-center items-center">
      
        <div className="flex flex-col gap-3">
          <span className="text-lg">
            Monitor and achieve your financial goals with our performance tracking.
          </span>
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl pb-10 ">
            <PerformChart />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-lg">
            Calculate potential returns with our
            intuitive tools.
          </span>

          <Calculator />
        </div>
        
      </div>
    </div>
  )
}

export default PerformP
