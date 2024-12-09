import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns-tz';

const DateTimePicker = ({ selectedDate, onDateChange }) => {
  const handleDateChange = (date) => {
    onDateChange(date);
  };

  // Format selected date in the desired format
  const formattedDate = format(
    selectedDate,
    "yyyy-MM-dd HH:mm:ss 'UTC' XXX",
    { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  );

  return (
    <div>
      <h3>Select Date and Time</h3>
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        showTimeSelect
        dateFormat="MMMM d, yyyy h:mm:ss aa"
        timeFormat="HH:mm:ss"
        timeIntervals={1}
      />
      <div>
        <h4>Selected Date:</h4>
        <p>{formattedDate}</p>
      </div>
    </div>
  );
};

export default DateTimePicker;
