import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress,
  useTheme,
  Grid,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  Event as EventIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO
} from 'date-fns';
import { cs } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTasks } from '../../services/taskService';
import { Task } from '../../types/task.types';

const TaskCalendar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Получение задач
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const result = await getTasks();
        setTasks(result.tasks.filter(task => task.deadline));
      } catch (error) {
        console.error('Error fetching tasks for calendar:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Обработчик клика по задаче
  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/detail/${taskId}`);
  };

  // Получаем дни текущего месяца
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Получаем задачи для конкретного дня
  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return isSameDay(taskDate, day);
    });
  };

  // Получаем цвет для статуса задачи
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#2196F3'; // Синий
      case 'inProgress':
        return '#FF9800'; // Оранжевый
      case 'review':
        return '#9C27B0'; // Фиолетовый
      case 'done':
        return '#4CAF50'; // Зеленый
      case 'cancelled':
        return '#9E9E9E'; // Серый
      default:
        return '#2196F3';
    }
  };

  // Навигация по месяцам
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper 
      sx={{ 
        p: 2, 
        height: '100%',
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
        overflow: 'auto'
      }}
    >
      {/* Заголовок и навигация */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            {t('tasks.calendar.title', 'Kalendář úkolů')}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={goToPreviousMonth} size="small">
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography variant="subtitle1">
            {format(currentDate, 'LLLL yyyy', { locale: cs })}
          </Typography>
          
          <IconButton onClick={goToNextMonth} size="small">
            <ChevronRightIcon />
          </IconButton>
          
          <Tooltip title={t('common.today', 'Dnes')}>
            <IconButton onClick={goToToday} size="small">
              <TodayIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Дни недели */}
      <Grid container sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
        {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day: string, index: number) => (
          <Grid item xs={12/7} key={index}>
            <Typography variant="body2">{day}</Typography>
          </Grid>
        ))}
      </Grid>
      
      {/* Календарная сетка */}
      <Grid container spacing={1}>
        {days.map((day: Date, index: number) => {
          const tasksForDay = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          
          return (
            <Grid item xs={12/7} key={index}>
              <Card 
                sx={{
                  height: '100%',
                  minHeight: 120,
                  backgroundColor: isCurrentMonth 
                    ? isCurrentDay 
                      ? theme.palette.mode === 'dark' ? 'rgba(63, 81, 181, 0.15)' : 'rgba(63, 81, 181, 0.05)' 
                      : theme.palette.mode === 'dark' ? '#2a2a2a' : '#fff'
                    : theme.palette.mode === 'dark' ? '#222' : '#f5f5f5',
                  opacity: isCurrentMonth ? 1 : 0.5,
                  borderRadius: 1,
                  overflow: 'hidden',
                  position: 'relative'
                }}
                variant="outlined"
              >
                <Box 
                  sx={{
                    p: 0.5, 
                    backgroundColor: isCurrentDay 
                      ? theme.palette.primary.main 
                      : theme.palette.mode === 'dark' ? '#333' : '#eee',
                    color: isCurrentDay ? '#fff' : 'inherit',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2">
                    {format(day, 'd')}
                  </Typography>
                </Box>
                
                <Box sx={{ p: 0.5, maxHeight: 100, overflow: 'auto' }}>
                  {tasksForDay.length > 0 ? (
                    tasksForDay.map(task => (
                      <Chip
                        key={task.id}
                        label={task.title}
                        size="small"
                        onClick={() => handleTaskClick(task.id)}
                        sx={{
                          mb: 0.5,
                          backgroundColor: getStatusColor(task.status),
                          color: '#fff',
                          width: '100%',
                          justifyContent: 'flex-start',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }
                        }}
                      />
                    ))
                  ) : null}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

export default TaskCalendar;
