

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

