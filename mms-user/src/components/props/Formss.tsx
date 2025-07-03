import type React from "react";

interface InputssProps {
  type: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string | number;
  label?: string;
  required?: boolean;
  className?: string;
  maxLength?: number;
  reference?: string;
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


export const InputNormal: React.FC<InputssProps> = ({
  placeholder, onChange, value, required, type
}) => {
  return (
    <input placeholder={placeholder} 
      type={type}
      className="border py-1 px-2 rounded-md w-full"
      onChange={onChange}
      value={value}
      required={required}
    />
  )
}

export const InputRef: React.FC<InputssProps> = ({
  onChange, value, required, type
}) => {
  return (
    <input placeholder={'Reference (optional)'} 
      type={type}
      className="border py-1 px-2 rounded-md"
      onChange={onChange}
      value={value}
      required={required}
    />
  )
}