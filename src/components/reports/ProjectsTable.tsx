import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip 
} from '@mui/material';
import { format, isValid } from 'date-fns';
import { Project } from '../../types/project.types';

// Безопасная функция форматирования даты
const safeFormatDate = (date: string | Date | null | undefined, formatStr: string = 'dd.MM.yyyy'): string => {
  if (!date) return '-';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime()) || !isValid(dateObj)) {
      console.warn('Invalid date value:', date);
      return '-';
    }
    
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return '-';
  }
};

const ProjectsTable: React.FC<{ projects: Project[] }> = ({ projects }) => {
  // Сортируем проекты по статусу (сначала активные) и дате создания
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    
    // Если статусы одинаковые, сортируем по дате создания (новые сверху)
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'on_hold':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>Název projektu</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Datum zahájení</TableCell>
            <TableCell>Termín dokončení</TableCell>
            <TableCell>Počet úkolů</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedProjects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.name}</TableCell>
              <TableCell>
                <Chip 
                  label={project.status} 
                  size="small" 
                  color={getStatusColor(project.status) as any}
                />
              </TableCell>
              <TableCell>
                {safeFormatDate(project.startDate)}
              </TableCell>
              <TableCell>
                {safeFormatDate(project.deadline)}
              </TableCell>
              <TableCell>{project.statistics?.totalTasks || 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProjectsTable;
