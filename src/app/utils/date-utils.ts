export function toDateInputValue(dateStr: string): string {
    if (!dateStr) return '';
    // Handles both 'YYYY-MM-DD' and ISO strings like '2024-05-20T00:00:00'
    return dateStr.length > 10 ? dateStr.substring(0, 10) : dateStr;
  }
  