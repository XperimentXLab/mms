
const Loading = () => {
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-white/70">
      <div className="grid grid-cols-2 justify-center items-center animate-spin w-8 h-8 z-50">
        <div className="flex justify-center items-center bg-amber-700 w-3 h-3"></div>
        <div className="flex justify-center items-center bg-amber-700 w-3 h-3"></div>
        <div className="flex justify-center items-center bg-amber-700 w-3 h-3"></div>
        <div className="flex justify-center items-center bg-amber-700 w-3 h-3"></div>
      </div>
    </div>
  )
}

export default Loading
