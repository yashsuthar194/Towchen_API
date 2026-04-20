import { Injectable } from '@nestjs/common';

@Injectable()
export class DateService {
  /**
   * Formats a date into a human-readable string.
   * 
   * @param date - The date to format (Date object, string, or number)
   * @param includeTime - Whether to include the time in the output
   * @returns Formatted date string
   * 
   * @example
   * dateService.format(new Date(), true) // Jun 28 2025, 10:04 AM
   * dateService.format(new Date(), false) // Jun 28 2025
   */
  format(date: Date | string | number, includeTime: boolean = true): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '';
    }

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();

    let result = `${month} ${day} ${year}`;

    if (includeTime) {
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      
      const strHours = String(hours).padStart(2, '0');
      result += `, ${strHours}:${minutes} ${ampm}`;
    }

    return result;
  }
}
