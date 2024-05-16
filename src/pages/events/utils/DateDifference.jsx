import { useEffect } from 'react';

const getWeekdayCount = (startDate, endDate) => {
  let count = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 is Sunday, 6 is Saturday
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
};

const WeekdayDifference = ({ dateBegin, onWeekdayCountCalculated }) => {
  useEffect(() => {
    // Get today's date
    const today = new Date();
    
    // Reference date (passed as a prop)
    const referenceDate = new Date(dateBegin);
    
    // Calculate the number of weekdays between today and the reference date
    const count = getWeekdayCount(today, referenceDate);
    
    // Call the callback function with the calculated count
    onWeekdayCountCalculated(count);
  }, [dateBegin, onWeekdayCountCalculated]);

  return null; // This component does not render anything itself
};

export default WeekdayDifference;

