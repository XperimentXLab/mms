import type React from "react";

const Formss = () => {
  return (
    <div>
      
    </div>
  )
}

type InputP = 'text' | 'email' | 'password' | 'number';

interface InputssProps {
  type: InputP;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  label: string;
  required?: boolean;
  className?: string;
  maxLength?: number;
}

export const Inputss: React.FC<InputssProps> = ({
  type,
  placeholder,
  onChange,
  value,
  label,
  required,
  className,
  maxLength,
}) => {
  return (
    <div className="grid grid-row-2 gap-2">
      <span className="font-semibold">{label}</span>
      <input type={type} placeholder={placeholder} 
        onChange={onChange}
        value={value}
        className={className ? className : "border py-1 px-2 rounded-md"} 
        required={required}
        maxLength={maxLength}
      />
    </div>
  )
}

export default Formss
