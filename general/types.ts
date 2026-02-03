export interface TransactionItem {
  id: string;
  description: string;
  amount: number;
  icon?: string; // e.g., 'laptop', 'martini', 'guitar'
  date?: string;
  isRecurring?: boolean;
  completed?: boolean;
}

export interface MonthData {
  id: string;
  name: string;
  status: 'ACTV' | 'PEND' | 'CLSD';
}

export type CategoryType = 'TARGET' | 'INCOME' | 'FIXED_COST' | 'VARIABLE_COST';

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO string or 'DD/MM/YYYY'
  type: 'MEETING' | 'TASK' | 'REMINDER' | 'EVENT';
  completed: boolean;
}
