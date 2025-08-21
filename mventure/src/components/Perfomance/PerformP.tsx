import Calculator from "./Calculator"


const PerformP = () => {
  return (
    <div className="flex flex-col w-full gap-4 justify-center items-center p-2">
      <h1 className="font-semibold text-2xl font-['Concert_One']">Performance</h1>

      <h6>-- Chart Monthly Profit --</h6>

      <Calculator />
    </div>
  )
}

export default PerformP
