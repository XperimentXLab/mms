import type React from "react";
import { useState } from "react";
import { BiSolidShow } from "react-icons/bi";
import { GrFormViewHide } from "react-icons/gr";


type InputP = 'text' | 'email' | 'password' | 'number';

interface InputssProps {
  type: InputP;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string | number;
  label?: string;
  required?: boolean;
  className?: string;
  maxLength?: number;
  currentValue?: number | undefined;
  noNeedPercent?: boolean
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
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';

  return (
    <div className={`grid gap-2 relative ${ isPasswordField ? 'grid-rows-3' : 'grid-row-2' }`}>
      <span className="font-semibold">{label}</span>
      <input  type={isPasswordField ? (showPassword ? 'text' : 'password') : type} 
        placeholder={placeholder} 
        onChange={onChange}
        value={value}
        className={className ? className : "border py-1 px-2 rounded-md"} 
        required={required}
        maxLength={maxLength}
      />
      {isPasswordField && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
        >
          {showPassword ? <GrFormViewHide /> : <BiSolidShow />}
        </button>
      )}
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
  currentValue,
  noNeedPercent,
}) => {
  return (
    <div className="grid grid-row-2 gap-2">
      <span className="font-semibold">{label}</span>
      <div className="grid grid-cols-2 gap-2 ">
        <span className="border px-2 py-1 rounded-md bg-gray-200">
          <strong className="font-semibold">Current Value:</strong> {currentValue} {noNeedPercent ? '' : '%'}
        </span>
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
