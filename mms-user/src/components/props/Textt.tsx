interface SpannnProps {
  children: React.ReactNode
  label: string
  assetAmount?: number | undefined
  className?: string
}

const Spannn: React.FC<SpannnProps> = ({ children, label, assetAmount = 200, className }) => {
  return (
    <div className={`flex gap-2 text-md ${className}`}>
      <span className="font-bold">{label}: </span>
      <span className={`font-mono ${assetAmount < 200 ? 'text-slate-400' : 'text-black'}`}>{children}
      </span>
    </div>
  )
}
export default Spannn


interface FixedTextProps {
  text: string
  label: string
  className?: string
  assetAmount?: number | undefined
}

export const FixedText: React.FC<FixedTextProps> = ({ text, label, className, assetAmount = 200 }) => {
  return (
    <div className={className ? className : 'flex gap-2 bg-gray-200 border p-2 rounded-md'}>
      <span className='font-bold'>{label}: </span>
      <span className={`font-mono ${assetAmount < 200 ? 'text-slate-400' : 'text-black' }`}>{text}</span>
    </div>
  )
}
