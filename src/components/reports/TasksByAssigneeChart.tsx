import React from 'react';
import { Box, Typography, LinearProgress, Avatar } from '@mui/material';
import { Task } from '../../types/task.types';
import { User } from '../../types/user.types';

const TasksByAssigneeChart: React.FC<{ tasks: Task[], users: User[] }> = ({ tasks, users }) => {
  // Группируем задачи по исполнителям
  const tasksByAssignee = tasks.reduce((acc, task) => {
    const assigneeId = task.assignee || 'unassigned';
    acc[assigneeId] = (acc[assigneeId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Сортируем по количеству задач (от большего к меньшему)
  const sortedAssignees = Object.entries(tasksByAssignee)
    .sort(([, countA], [, countB]) => countB - countA);

  const getUserName = (userId: string): string => {
    if (userId === 'unassigned') return 'Nepřiřazeno';
    const user = users.find(u => u.uid === userId);
    return user ? (user.displayName || user.email || userId) : userId;
  };

  const getRandomColor = (userId: string): string => {
    // Генерируем псевдослучайный цвет на основе userId
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colors = [
      '#1976D2', '#2196F3', '#03A9F4', '#00BCD4', // Синие
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39', // Зеленые
      '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', // Оранжевые
      '#F44336', '#E91E63', '#9C27B0', '#673AB7'  // Красные/фиолетовые
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {sortedAssignees.map(([assigneeId, count]) => {
        const total = tasks.length;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const userName = getUserName(assigneeId);
        const color = assigneeId === 'unassigned' ? '#9E9E9E' : getRandomColor(assigneeId);
        
        return (
          <Box key={assigneeId} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ minWidth: 120, display: 'flex', alignItems: 'center', gap: 1 }}>
              {assigneeId !== 'unassigned' && (
                <Avatar 
                  sx={{ width: 24, height: 24, fontSize: '0.8rem' }}
                  alt={userName}
                >
                  {userName.charAt(0).toUpperCase()}
                </Avatar>
              )}
              <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                {userName}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: color
                  }
                }}
              />
            </Box>
            <Box sx={{ minWidth: 60 }}>
              <Typography variant="body2" color="text.secondary">
                {count} ({Math.round(percentage)}%)
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default TasksByAssigneeChart;
