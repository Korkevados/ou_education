/** @format */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CALENDAR_CONFIG } from "@/lib/config";

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="border border-gray-200 w-full pt-[100%] md:pt-[70%] relative"
        />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const dateString = date.toISOString().split("T")[0];
      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();

      const dayEvents = CALENDAR_CONFIG.dummyEvents[dateString] || [];

      days.push(
        <div
          key={day}
          className={cn(
            "border border-gray-200 w-full pt-[100%] md:pt-[70%] relative cursor-pointer transition-colors",
            isSelected ? "bg-sky-50 border-sky-200" : "hover:bg-gray-100"
          )}
          onClick={() => setSelectedDate(date)}>
          <div className="absolute inset-0 p-2 md:p-1.5">
            <div className="flex justify-between items-start">
              <span
                className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-sky-600" : "text-gray-700"
                )}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <span className="inline-block w-2 h-2 bg-sky-400 rounded-full" />
              )}
            </div>
            {/* Only show event details on md screens and above */}
            <div className="hidden md:block mt-0.5 space-y-0.5">
              {dayEvents.map((event, index) => (
                <div
                  key={index}
                  className="text-xs bg-sky-100 text-sky-700 p-0.5 rounded truncate">
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  return (
    <div className="flex flex-col max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-4">
          <h3 className="text-lg font-semibold mb-6 text-right">לוח חודשי</h3>
          <Button variant="outline" size="sm" onClick={prevMonth}>
            חודש קודם
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            חודש הבא
          </Button>
        </div>
        <h3 className="text-lg font-semibold">
          {CALENDAR_CONFIG.monthNames[currentMonth.getMonth()]}{" "}
          {currentMonth.getFullYear()}
        </h3>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-0.5 min-h-0 max-w-full overflow-hidden">
        {CALENDAR_CONFIG.weekDays.map((day) => (
          <div
            key={day}
            className="text-center py-1 md:py-0.5 text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
        {generateCalendarDays()}
      </div>
    </div>
  );
};

export default Calendar;
