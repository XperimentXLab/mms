

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
  disabled,
}) => {
  return (
    <button type={type} onClick={onClick} 
    className={className ? className : `font-semibold ${disabled ? 'bg-gray-300 cursor-not-allowed' : `bg-black text-white active:bg-red-600 active:text-black hover:bg-red-600 hover:text-black cursor-pointer`} py-1 px-2 rounded-md w-full`}>
      {children}
    </button>
  )
}

export default Buttons

