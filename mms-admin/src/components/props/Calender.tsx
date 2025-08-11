import { useState } from "react";
import { GrCaretNext, GrCaretPrevious } from "react-icons/gr";

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
}

const generateCalendar = (year: number, month: number): CalendarDay[] => {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const startDay = startOfMonth.getDay(); // Sunday = 0
  const today = new Date();

  const days: CalendarDay[] = [];

  // Previous month's trailing days
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
    });
  }

  // Current month
  for (let i = 1; i <= endOfMonth.getDate(); i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
    });
  }

  // Next month's leading days
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
    });
  }

  return days;
}

const isSameDay = (a: Date, b: Date): boolean => {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}


const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface profitsData {
  daily_profit_rate?: number
  active_day_profit?: number
  active_month_profit?: number
  active_year_profit?: number
}

interface CalendarProps {
  data: profitsData[];
}

export const Calendar: React.FC<CalendarProps> = ({ data }: {data: profitsData[]}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = generateCalendar(year, month);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="flex flex-col mx-auto p-4 border rounded bg-white w-full">
      <h2 className="flex justify-center font-bold">Calendar Profit (%)</h2>
      <div className="header flex justify-between items-center mb-4">
        <button onClick={goToPrevMonth}
          className="cursor-pointer"
        ><GrCaretPrevious /></button>
        <h2>
          {currentDate.toLocaleString('default', { month: 'long' })} {year}
        </h2>
        <button onClick={goToNextMonth}
          className="cursor-pointer"        
        ><GrCaretNext /></button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="font-bold text-center">{day}</div>
        ))}

        {days.map((day, idx) => {
          const profitForDay = data.find(item => item.active_day_profit === day.date.getDate() && item.active_month_profit === day.date.getMonth() + 1 && item.active_year_profit === day.date.getFullYear())
          return (
          <div
            key={idx}
            className={`flex flex-col items-center p-2 text-center rounded ${
              day.isToday ? 'bg-indigo-500 text-white font-semibold' : ''
            } ${!day.isCurrentMonth ? 'text-gray-400' : ''}`}
          >
            <span className="font-semibold">
              {day.date.getDate()}
            </span>
            <span className={`${!day.isCurrentMonth ? 'text-gray-400'  : `${profitForDay ? `text-green-400` : 'text-black'}`}`}>
              {profitForDay?.daily_profit_rate ?? '0.00' }
            </span>
          </div>
        )})}
      </div>
      
    </div>
  );
};
