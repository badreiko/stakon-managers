export type UserRole = 'admin' | 'employee';

export interface UserWorkingHours {
  start: string; // Format: 'HH:MM'
  end: string; // Format: 'HH:MM'
  workDays: number[]; // 0 = Sunday, 1 = Monday, etc.
}

export interface UserNotificationSettings {
  email: boolean;
  inApp: boolean;
  push: boolean;
  newTask: boolean;
  statusChange: boolean;
  deadlineApproaching: boolean;
  comments: boolean;
  mentions: boolean;
}

export interface UserPerformance {
  tasksCompleted: number;
  tasksOverdue: number;
  averageCompletionTime: number; // In hours
  onTimeCompletionRate: number; // Percentage
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  position: string;
  department: string;
  phoneNumber: string;
  workingHours: UserWorkingHours;
  timezone: string;
  notificationSettings: UserNotificationSettings;
  createdAt: Date;
  lastActive: Date;
  performance?: UserPerformance;
}

export interface UserFilter {
  role?: UserRole;
  position?: string;
  search?: string;
}

export interface UserSortOption {
  field: keyof User;
  direction: 'asc' | 'desc';
}

export interface UserListOptions {
  filters?: UserFilter;
  sort?: UserSortOption;
  limit?: number;
  page?: number;
}
