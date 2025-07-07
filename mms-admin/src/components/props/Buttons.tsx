

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


import React, { memo } from 'react';

interface RejectionInputProps {
  id: string;
  value: string;
  onChange: (id: string, value: string) => void;
  onReject: (id: string, reason: string) => void;
}

export const RejectionInput = memo(({ id, value, onChange, onReject }: RejectionInputProps) => {
  return (
    <div className="flex flex-row gap-2 items-center">
      <input
        type="text"
        placeholder="Reason for rejection"
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        className="border p-1 rounded text-sm w-full min-w-[150px]"
      />
      <Buttons
        type="button"
        disabled={!value}
        onClick={() => onReject(id, value)}
        className={`px-3 py-1 rounded ${
          value ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        Reject
      </Buttons>
    </div>
  );
});

