import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SearchResult } from '../types/search.types';
import { Task } from '../types/task.types';
import { Project } from '../types/project.types';
import { getTasks } from './taskService';
import { getAllProjects } from './projectService';

// Функция для поиска элементов на дашборде
export const searchDashboardItems = async (query: string): Promise<SearchResult[]> => {
  const results: SearchResult[] = [];
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) {
    return [];
  }

  try {
    // Поиск по задачам (только активные для дашборда)
    const { tasks } = await getTasks();
    const activeTasks = tasks.filter(task => 
      task.status !== 'done' && task.status !== 'cancelled'
    );

    const taskResults = activeTasks
      .filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm)) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      )
      .slice(0, 8) // Ограничиваем до 8 результатов
      .map(task => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        description: task.description ? 
          (task.description.length > 60 ? task.description.substring(0, 60) + '...' : task.description) : 
          '',
        status: task.status,
        priority: task.priority,
        dueDate: task.deadline ? new Date(task.deadline).toLocaleDateString() : undefined
      }));

    // Поиск по проектам (только активные)
    const projects = await getAllProjects();
    const activeProjects = projects.filter(project => 
      project.status === 'active'
    );

    const projectResults = activeProjects
      .filter(project => 
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm))
      )
      .slice(0, 4) // Ограничиваем до 4 результатов
      .map(project => ({
        id: project.id,
        type: 'project' as const,
        title: project.name,
        description: project.description ? 
          (project.description.length > 60 ? project.description.substring(0, 60) + '...' : project.description) : 
          ''
      }));

    results.push(...taskResults, ...projectResults);
  } catch (error) {
    console.error('Dashboard search error:', error);
  }

  return results;
};
