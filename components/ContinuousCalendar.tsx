'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


interface CalendarEvent {
  title: string;
  date: Date;
}

interface ContinuousCalendarProps {
  onClick?: (_day:number, _month: number, _year: number) => void;
  events?: CalendarEvent[];

}

interface EventFormProps {
  onSave: (event: {
    title: string;
    date: Date;
    time: string;
    description: string;
    recurrence: string;
  }) => void;
  onCancel: () => void;
  defaultDate: Date;
}

const recurrenceOptions = ['None', 'Daily', 'Weekly', 'Monthly', 'Custom'];

const EventForm: React.FC<EventFormProps> = ({ onSave, onCancel, defaultDate }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState('None');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title,
      date: defaultDate,
      time,
      description,
      recurrence,
    });
  };

  return (
    <div className="flex flex-col space-y-2">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="border rounded p-1" />
      <input type="time" value={time} onChange={e => setTime(e.target.value)} className="border rounded p-1" />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="border rounded p-1" />
      <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className="border rounded p-1">
        {recurrenceOptions.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <div className="flex justify-between">
        <button onClick={onCancel} className="text-sm text-gray-500">Cancel</button>
        <button onClick={handleSubmit} className="text-sm text-blue-600">Save</button>
      </div>
    </div>
  );
};


export const ContinuousCalendar: React.FC<ContinuousCalendarProps> = ({ onClick }) => {
  const today = new Date();
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const monthOptions = monthNames.map((month, index) => ({ name: month, value: `${index}` }));
  const [showEventForm, setShowEventForm] = useState(false);

  const addEvent = (event: {
  title: string;
  date: Date;
  time: string;
  description: string;
  recurrence: string;
}) => {
  const key = `${event.date.getFullYear()}-${event.date.getMonth()}-${event.date.getDate()}`;
  const newEvent: CalendarEvent = {
    title: `${event.title} @ ${event.time}`, // customize this as needed
    date: event.date,
  };

  setEventsMap(prev => ({
    ...prev,
    [key]: [...(prev[key] || []), newEvent],
  }));

  setShowEventForm(false);
};



  const scrollToDay = (monthIndex: number, dayIndex: number) => {
    const targetDayIndex = dayRefs.current.findIndex(
      (ref) => ref && ref.getAttribute('data-month') === `${monthIndex}` && ref.getAttribute('data-day') === `${dayIndex}`,
    );

    const targetElement = dayRefs.current[targetDayIndex];

    if (targetDayIndex !== -1 && targetElement) {
      const container = document.querySelector('.calendar-container');
      const elementRect = targetElement.getBoundingClientRect();
      const is2xl = window.matchMedia('(min-width: 1536px)').matches;
      const offsetFactor = is2xl ? 3 : 2.5;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const offset = elementRect.top - containerRect.top - (containerRect.height / offsetFactor) + (elementRect.height / 2);

        container.scrollTo({
          top: container.scrollTop + offset,
          behavior: 'smooth',
        });
      } else {
        const offset = window.scrollY + elementRect.top - (window.innerHeight / offsetFactor) + (elementRect.height / 2);
  
        window.scrollTo({
          top: offset,
          behavior: 'smooth',
        });
      }
    }
  };

  const handlePrevYear = () => setYear((prevYear) => prevYear - 1);
  const handleNextYear = () => setYear((prevYear) => prevYear + 1);

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const monthIndex = parseInt(event.target.value, 10);
    setSelectedMonth(monthIndex);
    scrollToDay(monthIndex, 1);
  };

  const handleTodayClick = () => {
    setYear(today.getFullYear());
    scrollToDay(today.getMonth(), today.getDate());
  };



  const handleDayClick = (day: number, month: number, year: number) => {
    if (!onClick) return;

    const dayEl = dayRefs.current.find(
      (ref) =>
        ref &&
        ref.getAttribute('data-month') === `${month}` &&
        ref.getAttribute('data-day') === `${day}`
    );

    if (dayEl) {
      const rect = dayEl.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setPopupData({
        x: rect.left + rect.width / 2,
        y: rect.top + scrollTop + rect.height / 2,
        day,
        month,
        year,
      });
    }

    onClick(day, month, year);
  };


  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const startEditing = (index: number, currentTitle: string) => {
    setEditingIndex(index);
    setEditedTitle(currentTitle);
  };
  
  



const updateEventTitle = (index: number, newTitle: string) => {
  if (popupData) {
    const key = `${popupData.year}-${popupData.month}-${popupData.day}`;
    const updatedEvents = [...(eventsMap[key] || [])];
    updatedEvents[index].title = newTitle;
    setEventsMap((prev) => ({
      ...prev,
      [key]: updatedEvents,
    }));
  }
  setEditingIndex(null);
};

const dragDataRef = useRef<{
  fromDay: number;
  fromMonth: number;
  fromYear: number;
} | null>(null);

const handleDragStart = (
  e: React.DragEvent,
  day: number,
  month: number,
  year: number
) => {
  dragDataRef.current = { fromDay: day, fromMonth: month, fromYear: year };
};

const handleDrop = (
  e: React.DragEvent,
  toDay: number,
  toMonth: number,
  toYear: number
) => {
  if (!dragDataRef.current) return;

  const { fromDay, fromMonth, fromYear } = dragDataRef.current;

  const fromKey = `${fromYear}-${fromMonth}-${fromDay}`;
  const toKey = `${toYear}-${toMonth}-${toDay}`;

  const draggedEvents = eventsMap[fromKey] || [];
  const existingEvents = eventsMap[toKey] || [];

  if (draggedEvents.length === 0) return;

  // Move all events (customize logic if needed)
  setEventsMap((prev) => {
    const updated = { ...prev };
    delete updated[fromKey];
    updated[toKey] = [...existingEvents, ...draggedEvents];
    return updated;
  });

  dragDataRef.current = null;
};


const [eventsMap, setEventsMap] = useState<Record<string, CalendarEvent[]>>({});
const [popupData, setPopupData] = useState<{
  x: number;
  y: number;
  day: number;
  month: number;
  year: number;
} | null>(null);


  const generateCalendar = useMemo(() => {
    const today = new Date();

    const daysInYear = (): { month: number; day: number }[] => {
      const daysInYear = [];
      const startDayOfWeek = new Date(year, 0, 1).getDay();

      if (startDayOfWeek < 6) {
        for (let i = 0; i < startDayOfWeek; i++) {
          daysInYear.push({ month: -1, day: 32 - startDayOfWeek + i });
        }
      }

      for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          daysInYear.push({ month, day });
        }
      }

      const lastWeekDayCount = daysInYear.length % 7;
      if (lastWeekDayCount > 0) {
        const extraDaysNeeded = 7 - lastWeekDayCount;
        for (let day = 1; day <= extraDaysNeeded; day++) {
          daysInYear.push({ month: 0, day });
        }
      }
    
      return daysInYear;
    };

    const calendarDays = daysInYear();

    const calendarWeeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      calendarWeeks.push(calendarDays.slice(i, i + 7));
    }

    const calendar = calendarWeeks.map((week, weekIndex) => (
      <div className="flex w-full" key={`week-${weekIndex}`}>
        {week.map(({ month, day }, dayIndex) => {
          const index = weekIndex * 7 + dayIndex;
          const isNewMonth = index === 0 || calendarDays[index - 1].month !== month;
          const isToday = today.getMonth() === month && today.getDate() === day && today.getFullYear() === year;

          return (
            <div
              key={`${month}-${day}`}
              ref={(el) => { dayRefs.current[index] = el; }}
              data-month={month}
              data-day={day}
              draggable={month >= 0} // only allow dragging valid days
              onDragStart={(e) => handleDragStart(e, day, month, year)}
              onDragOver={(e) => e.preventDefault()} // required to allow drop
              onDrop={(e) => handleDrop(e, day, month, year)}
              onClick={() => handleDayClick(day, month, year)}
              className={`relative z-10 m-[-0.5px] group aspect-square w-full grow cursor-pointer rounded-xl border font-medium transition-all hover:z-20 hover:border-cyan-400 sm:-m-px sm:size-20 sm:rounded-2xl sm:border-2 lg:size-36 lg:rounded-3xl 2xl:size-40`}
            >

              <span className={`absolute left-1 top-1 flex size-5 items-center justify-center rounded-full text-xs sm:size-6 sm:text-sm lg:left-2 lg:top-2 lg:size-8 lg:text-base ${isToday ? 'bg-blue-500 font-semibold text-white' : ''} ${month < 0 ? 'text-slate-400' : 'text-slate-800'}`}>
                {day}
              </span>

              {eventsMap[`${year}-${month}-${day}`] && (
                <span className="absolute bottom-1 left-1 h-2 w-2 rounded-full bg-blue-500 sm:h-2.5 sm:w-2.5 lg:h-3 lg:w-3" />
              )}

              {isNewMonth && (
                <span className="absolute bottom-0.5 left-0 w-full truncate px-1.5 text-sm font-semibold text-slate-300 sm:bottom-0 sm:text-lg lg:bottom-2.5 lg:left-3.5 lg:-mb-1 lg:w-fit lg:px-0 lg:text-xl 2xl:mb-[-4px] 2xl:text-2xl">
                  {monthNames[month]}
                </span>
              )}
              <button type="button" className="absolute right-2 top-2 rounded-full opacity-0 transition-all focus:opacity-100 group-hover:opacity-100">
                <svg className="size-8 scale-90 text-blue-500 transition-all hover:scale-100 group-focus:scale-100" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4.243a1 1 0 1 0-2 0V11H7.757a1 1 0 1 0 0 2H11v3.243a1 1 0 1 0 2 0V13h3.243a1 1 0 1 0 0-2H13V7.757Z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    ));

    return calendar;
  }, [year, eventsMap, handleDayClick]);

  

  useEffect(() => {
    const calendarContainer = document.querySelector('.calendar-container');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const month = parseInt(entry.target.getAttribute('data-month')!, 10);
            setSelectedMonth(month);
          }
        });
      },
      {
        root: calendarContainer,
        rootMargin: '-75% 0px -25% 0px',
        threshold: 0,
      },
    );

    dayRefs.current.forEach((ref) => {
      if (ref && ref.getAttribute('data-day') === '15') {
        observer.observe(ref);
      }
    });
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const popup = document.getElementById('calendar-popup');
      if (popup && !popup.contains(event.target as Node)) {
        setPopupData(null);
      }
    }

    if (popupData) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
   };
  }, [popupData]);




const deleteEvent = (index: number) => {
    if (!popupData) return;
    const key = `${popupData.year}-${popupData.month}-${popupData.day}`;
    const updatedEvents = [...(eventsMap[key] || [])];
    updatedEvents.splice(index, 1);
    setEventsMap((prev) => ({
      ...prev,
      [key]: updatedEvents,
    }));
  };  
  return (
    <div className="no-scrollbar calendar-container max-h-full overflow-y-scroll rounded-t-2xl bg-white pb-10 text-slate-800 shadow-xl">
      <div className="sticky -top-px z-50 w-full rounded-t-2xl bg-white px-5 pt-7 sm:px-8 sm:pt-8">
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Select name="month" value={`${selectedMonth}`} options={monthOptions} onChange={handleMonthChange} />
            <button onClick={handleTodayClick} type="button" className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-100 lg:px-5 lg:py-2.5">
              Today
            </button>
            <button
              type="button"
              onClick={() => setShowEventForm(true)}
              className="whitespace-nowrap rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-gradient-to-bl focus:outline-none focus:ring-4 focus:ring-cyan-300 sm:rounded-xl lg:px-5 lg:py-2.5"
            >
              + Add Event
            </button>

          </div>
          <div className="flex w-fit items-center justify-between">
            <button
              onClick={handlePrevYear}
              className="rounded-full border border-slate-300 p-1 transition-colors hover:bg-slate-100 sm:p-2"
            >
              <svg className="size-5 text-slate-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 19-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="min-w-16 text-center text-lg font-semibold sm:min-w-20 sm:text-xl">{year}</h1>
            <button
              onClick={handleNextYear}
              className="rounded-full border border-slate-300 p-1 transition-colors hover:bg-slate-100 sm:p-2"
            >
              <svg className="size-5 text-slate-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="grid w-full grid-cols-7 justify-between text-slate-500">
          {daysOfWeek.map((day, index) => (
            <div key={index} className="w-full border-b border-slate-200 py-2 text-center font-semibold">
              {day}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full px-5 pt-4 sm:px-8 sm:pt-6">
        {generateCalendar}
      </div>

      {popupData && (
       <div
          id="calendar-popup"
          className="absolute z-50 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
          style={{ top: popupData.y, left: popupData.x, transform: 'translate(-50%, -10%)' }}
        >
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Events on {monthNames[popupData.month]} {popupData.day}, {popupData.year}
          </h3>
          <ul className="mb-2 max-h-32 overflow-y-auto text-sm text-slate-600">
            {/* {(eventsMap[`${popupData.year}-${popupData.month}-${popupData.day}`] || []).map((event, idx) => (
              <li key={idx}>• {event.title}</li>
            ))} */}

            {(eventsMap[`${popupData.year}-${popupData.month}-${popupData.day}`] || []).map((event, idx) => (
              <li key={idx} className="group flex items-center justify-between">
                {editingIndex === idx ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                       updateEventTitle(idx, editedTitle);
                      }
                    }}
                    onBlur={() => updateEventTitle(idx, editedTitle)}
                    className="mr-2 grow rounded border px-1 py-0.5 text-sm"
                  />
                ) : (
                  <span
                    onClick={() => startEditing(idx, event.title)}
                    className="mr-2 cursor-pointer"
                  >
                    • {event.title}
                  </span>
                )}

                <button
                  onClick={() => deleteEvent(idx)}
                  className="text-xs text-red-500 opacity-0 group-hover:opacity-100"
                
                >
                  ✕
                </button>
             </li>
           ))}

          </ul>

          <EventForm
            defaultDate={new Date(popupData.year, popupData.month, popupData.day)}
            onCancel={() => setPopupData(null)}
            onSave={(newEvent) => {
              const key = `${popupData.year}-${popupData.month}-${popupData.day}`;
              setEventsMap((prev) => ({
                ...prev,
                [key]: [...(prev[key] || []), {
                  title: newEvent.title,
                  date: newEvent.date,
                  time: newEvent.time,
                  description: newEvent.description,
                  recurrence: newEvent.recurrence
                }],
              }));
              setPopupData(null);
            }}
          />


          <button
            onClick={() => setPopupData(null)}
            className="mt-1 text-xs text-blue-500 underline hover:text-blue-700"
          >
            Close
          </button>
        </div>
      )}

      {showEventForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-4 rounded-xl w-96 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">New Event</h2>
            <EventForm
              defaultDate={today} // or popupData if you want to default to clicked date
              onSave={addEvent}
              onCancel={() => setShowEventForm(false)}
            />
          </div>
        </div>
      )}



    </div>
  );
};

export interface SelectProps {
  name: string;
  value: string;
  label?: string;
  options: { 'name': string, 'value': string }[];
  onChange: (_event: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

export const Select = ({ name, value, label, options = [], onChange, className }: SelectProps) => (
  <div className={`relative ${className}`}>
    {label && (
      <label htmlFor={name} className="mb-2 block font-medium text-slate-800">
        {label}
      </label>
    )}
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="cursor-pointer rounded-lg border border-gray-300 bg-white py-1.5 pl-2 pr-6 text-sm font-medium text-gray-900 hover:bg-gray-100 sm:rounded-xl sm:py-2.5 sm:pl-3 sm:pr-8"
      required
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.name}
        </option>
      ))}
    </select>
    <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-1 sm:pr-2">
      <svg className="size-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
      </svg>
    </span>
  </div>
);
