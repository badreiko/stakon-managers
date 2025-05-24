export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'new' | 'inProgress' | 'review' | 'done' | 'cancelled';

export interface TaskComment {
  id: string;
  content: string;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt?: Date;
  mentions?: string[]; // User IDs
  attachments?: string[]; // File URLs
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string; // User ID
  uploadedAt: Date;
}

export interface TaskHistoryEntry {
  id: string;
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: string; // User ID
  changedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string; // User ID
  priority: TaskPriority;
  status: TaskStatus;
  project: string; // Project ID
  deadline: Date;
  estimatedTime: number; // In hours
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  history: TaskHistoryEntry[];
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  progress: number; // 0-100
  actualTime?: number; // In hours
}

export interface TaskFilter {
  assignee?: string;
  project?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  tags?: string[];
  deadline?: {
    from?: Date;
    to?: Date;
  };
  search?: string;
}

export interface TaskSortOption {
  field: keyof Task;
  direction: 'asc' | 'desc';
}

export interface TaskListOptions {
  filters?: TaskFilter;
  sort?: TaskSortOption;
  limit?: number;
  page?: number;
}
