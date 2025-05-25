import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Task, TaskStatus } from '../../types/task.types';

// Цвета для разных статусов задач
const STATUS_COLORS: Record<TaskStatus, string> = {
  'new': '#2196F3',       // Синий
  'inProgress': '#FF9800', // Оранжевый
  'review': '#9C27B0',    // Фиолетовый
  'done': '#4CAF50',      // Зеленый
  'cancelled': '#9E9E9E'  // Серый
};

const TaskStatusChart: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const { t } = useTranslation();
  
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Object.entries(statusCounts).map(([status, count]) => {
        const total = tasks.length;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="body2">
                {t(`tasks.statuses.${status}`)}
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
                    bgcolor: STATUS_COLORS[status as TaskStatus]
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

export default TaskStatusChart;
