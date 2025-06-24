

const Updating = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex relative p-5 m-5 items-center justify-center">
        <div className="flex absolute animate-spin rounded-full h-105 w-105 border-b-2 border-red-600 mb-4"></div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-bold text-center">We are currently upgrading...</span>
          <p className="text-center">Please check back later.</p>
          <p className="text-center">Thank you for your patience!</p>   
          <img src="../mmsventure.jpeg" alt="MMS Logo" className="h-40" />
        </div>
      </div>
    </div>
  )
}    

export default Updating
