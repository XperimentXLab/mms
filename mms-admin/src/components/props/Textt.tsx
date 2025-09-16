interface SpannnProps {
  children: React.ReactNode
  label: string
}

const Spannn: React.FC<SpannnProps> = ({ children, label }) => {
  return (
    <div className="flex gap-2 text-md">
      <span className="font-bold">{label}: </span>
      <span className="font-mono">{children}
      </span>
    </div>
  )
}
export default Spannn


interface FixedTextProps {
  text: string | number
  label: string
  className?: string
}

export const FixedText: React.FC<FixedTextProps> = ({ text, label, className }) => {
  return (
    <div className={className ? className : 'flex w-full gap-2 bg-gray-200 border py-1 px-2 rounded-md'}>
      <span className='font-bold'>{label}: </span>
      <span className="font-mono">{text}</span>
    </div>
  )
}
