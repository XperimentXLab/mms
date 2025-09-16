import { ToastContainer, toast } from "react-toastify"

interface NotiProps {
  toastText?: any
  children?: React.ReactNode
}


export const NotiSuccess: React.FC<NotiProps> = ({
  toastText,
  children,
}) => {

  const notify = () => toast.success(toastText)

  return (
    <div className="p-1 rounded-lg bg-white text-black justify-center flex ">
      <button onClick={notify} className="cursor-pointer">{children}</button>
      <ToastContainer toastClassName={'text-red-500'} />

    </div>
  )
}


export const NotiError: React.FC<NotiProps> = ({
  toastText,
  children,
}) => {

  const notify = () => toast.error(toastText)

  return (
    <div className="p-1 rounded-lg bg-white text-black justify-center flex ">
      <button onClick={notify} className="cursor-pointer">{children}</button>
      <ToastContainer toastClassName={'text-red-500'} />

    </div>
  )
}


export const NotiInfo: React.FC<NotiProps> = ({
  toastText,
  children,
}) => {

  const notify = () => toast.info(toastText)

  return (
    <div className="p-1 rounded-lg bg-white text-black justify-center flex ">
      <button onClick={notify} className="cursor-pointer">{children}</button>
      <ToastContainer />

    </div>
  )
}


export const NotiSuccessAlert = (toastText: any) => {
  toast.success(toastText, {
    style: { zIndex: 1500 }
  })
}
export const NotiErrorAlert = (toastText: any) => {
  toast.error(toastText, {
    style: { zIndex: 1500 }
  })
}
export const NotiInfoAlert = (toastText: any) => {
  toast.info(toastText, {
    style: { zIndex: 1500 }
  })
}

