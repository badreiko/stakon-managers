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
import { format } from 'date-fns';
import { Project } from '../../types/project.types';

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
                {project.startDate ? format(new Date(project.startDate), 'dd.MM.yyyy') : '-'}
              </TableCell>
              <TableCell>
                {project.deadline ? format(new Date(project.deadline), 'dd.MM.yyyy') : '-'}
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
