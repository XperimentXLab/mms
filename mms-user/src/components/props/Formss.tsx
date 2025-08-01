import type React from "react";
import { useState } from "react";
import { BiSolidShow } from "react-icons/bi";
import { GrFormViewHide } from "react-icons/gr";

type InputP = 'text' | 'email' | 'password' | 'number';

interface InputssProps {
  type: InputP;
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

  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';

  return (
    <div className={`grid gap-2 relative grid-row-2`}>
      <span className="font-semibold">{label}</span>
      <input type={isPasswordField ? (showPassword ? 'text' : 'password') : type} 
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
        className="absolute right-2 transform translate-y-10 cursor-pointer"
      >
        {showPassword ? <GrFormViewHide /> : <BiSolidShow />}
      </button>
    )}
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