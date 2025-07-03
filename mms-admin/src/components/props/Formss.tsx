import type React from "react";


interface InputssProps {
  type: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string | number;
  label: string;
  required?: boolean;
  className?: string;
  maxLength?: number;
  currentValue?: number | undefined;
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


export const InputwithVal: React.FC<InputssProps> = ({
  type,
  placeholder,
  onChange,
  value,
  label,
  required,
  className,
  maxLength,
  currentValue
}) => {
  return (
    <div className="grid grid-row-2 gap-2">
      <span className="font-semibold">{label}</span>
      <div className="grid grid-cols-2 gap-2 ">
        <span className="border px-2 py-1 rounded-md bg-gray-200">
          <strong className="font-semibold">Current Value:</strong> {currentValue} %</span>
        <input type={type} placeholder={placeholder} 
          onChange={onChange}
          value={value}
          className={className ? className : "border py-1 px-2 rounded-md"} 
          required={required}
          maxLength={maxLength}
        />
      </div>
    </div>
  )
}


