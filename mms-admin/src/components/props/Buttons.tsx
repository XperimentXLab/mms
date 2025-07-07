import { useState } from "react"


interface ButtonProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  type: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const Buttons: React.FC<ButtonProps> = ({
  className,
  children,
  onClick,
  type,
  disabled
}) => {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
    className={className ? className : `font-semibold bg-black text-white active:bg-red-600 active:text-black hover:bg-red-600 hover:text-black hover:cursor-pointer py-1 px-2 rounded-md`}>
      {children}
    </button>
  )
}

export default Buttons

export const RejectionInput = ({ 
  id, 
  onReject,
  initialReason = ''
}: { 
  id: string, 
  onReject: (id: string, reason: string) => void,
  initialReason?: string
}) => {
  const [reason, setReason] = useState(initialReason);

  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Rejection reason"
        className="px-2 py-1 border rounded"
      />
      <Buttons
        type="button"
        onClick={() => onReject(id, reason)}
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        disabled={!reason.trim()}
      >
        Reject
      </Buttons>
    </div>
  );
};

