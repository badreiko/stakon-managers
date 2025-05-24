export type ProjectStatus = 'active' | 'completed' | 'onHold' | 'cancelled' | 'archived';

export interface ProjectMember {
  userId: string;
  role: 'manager' | 'member';
  joinedAt: Date;
}

export interface ProjectStatistics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  estimatedTotalHours: number;
  actualTotalHours: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  manager: string; // User ID
  members: ProjectMember[];
  deadline?: Date;
  startDate: Date;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  statistics: ProjectStatistics;
}

export interface ProjectFilter {
  status?: ProjectStatus[];
  manager?: string;
  member?: string;
  tags?: string[];
  deadline?: {
    from?: Date;
    to?: Date;
  };
  search?: string;
}

export interface ProjectSortOption {
  field: keyof Project;
  direction: 'asc' | 'desc';
}

export interface ProjectListOptions {
  filters?: ProjectFilter;
  sort?: ProjectSortOption;
  limit?: number;
  page?: number;
}
