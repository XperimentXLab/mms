import type React from "react";


interface SelectFixedProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const SelectMonth: React.FC<SelectFixedProps> = ({
  value,
  onChange,
}) => {

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="flex px-2 py-1 flex-col w-full justify-center">
      <label className="font-semibold">Select Month</label>
      <select value={value} onChange={onChange} className="border py-1 px-2 rounded-md">
        <option value="">Select a month</option>
        {months.map((month, index) => (
          <option key={index+1} value={index+1}>{month}</option>
        ))}
      </select>
    </div>
  )
}


export const SelectYear: React.FC<SelectFixedProps> = ({
  value,
  onChange,
}) => {

  const years = Array.from({ length: 2 }, (_, i) => `${new Date().getFullYear() - i}`);

  return (
    <div className="flex px-2 py-1 flex-col w-full justify-center">
      <label className="font-semibold">Select Year</label>
      <select value={value} onChange={onChange} className="border py-1 px-2 rounded-md">
        <option value="">Select a year</option>
        {years.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  )
}
