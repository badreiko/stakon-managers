// src/components/tasks/TaskCalendar.tsx
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
  Tooltip,
  Alert,
  Fade
} from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  Event as EventIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
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
  isValid,
  parseISO
} from 'date-fns';
import { cs } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTasks } from '../../services/taskService';
import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import { PRIORITY_COLORS, STATUS_COLORS } from '../../theme/theme';

interface TaskCalendarProps {
  onTaskClick?: (taskId: string) => void;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ onTaskClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');

  // Получение задач
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getTasks();
        
        // Фильтруем задачи с валидными датами
        const validTasks = result.tasks.filter(task => {
          if (!task.deadline) return false;
          
          const deadline = task.deadline instanceof Date 
            ? task.deadline 
            : new Date(task.deadline);
            
          return isValid(deadline);
        });
        
        console.log('Calendar: загружено задач с валидными датами:', validTasks.length);
        setTasks(validTasks);
      } catch (error) {
        console.error('Error fetching tasks for calendar:', error);
        setError('Chyba při načítání úkolů kalendáře');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Мемоизированные дни календаря
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Начинаем с понедельника
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Фильтрованные задачи
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;
      return true;
    });
  }, [tasks, selectedStatus, selectedPriority]);

  // Получаем задачи для конкретного дня
  const getTasksForDay = (day: Date): Task[] => {
    return filteredTasks.filter(task => {
      try {
        const taskDate = task.deadline instanceof Date 
          ? task.deadline 
          : new Date(task.deadline);
        
        return isValid(taskDate) && isSameDay(taskDate, day);
      } catch (error) {
        console.error('Error comparing dates for task:', task.id, error);
        return false;
      }
    });
  };

  // Обработчик клика по задаче
  const handleTaskClick = (taskId: string) => {
    if (onTaskClick) {
      onTaskClick(taskId);
    } else {
      // Исправленный путь навигации
      navigate(`/tasks/detail/${taskId}`);
    }
  };

  // Получаем цвет для приоритета
  const getPriorityColor = (priority: TaskPriority): string => {
    return PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
  };

  // Получаем цвет для статуса
  const getStatusColor = (status: TaskStatus): string => {
    return STATUS_COLORS[status] || STATUS_COLORS.new;
  };

  // Навигация по месяцам
  const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const goToToday = () => setCurrentDate(new Date());
  const refreshTasks = () => window.location.reload();

  // Получаем статистику для текущего месяца
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const monthTasks = filteredTasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return taskDate >= monthStart && taskDate <= monthEnd;
    });
    
    return {
      total: monthTasks.length,
      completed: monthTasks.filter(t => t.status === 'done').length,
      overdue: monthTasks.filter(t => t.status !== 'done' && new Date(t.deadline) < new Date()).length,
      today: monthTasks.filter(t => isSameDay(new Date(t.deadline), new Date())).length
    };
  }, [filteredTasks, currentDate]);

  // Рендер состояния загрузки
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ color: '#FF6B35' }} />
          <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
            Načítání kalendáře úkolů...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Рендер состояния ошибки
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={refreshTasks}>
              Zkusit znovu
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Paper 
      sx={{ 
        p: 3, 
        height: '100%',
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
        overflow: 'auto',
        borderRadius: 2
      }}
      elevation={2}
    >
      {/* Заголовок и навигация */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarIcon sx={{ mr: 2, color: '#FF6B35', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Kalendář úkolů
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {monthStats.total} úkolů • {monthStats.completed} dokončeno • {monthStats.today} dnes
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Aktualizovat">
            <IconButton onClick={refreshTasks} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <Tooltip title="Předchozí měsíc">
            <IconButton onClick={goToPreviousMonth} size="small">
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          
          <Typography variant="h6" sx={{ mx: 2, minWidth: 200, textAlign: 'center', fontWeight: 500 }}>
            {format(currentDate, 'LLLL yyyy', { locale: cs })}
          </Typography>
          
          <Tooltip title="Další měsíc">
            <IconButton onClick={goToNextMonth} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <Tooltip title="Dnes">
            <IconButton onClick={goToToday} size="small" sx={{ 
              bgcolor: isToday(currentDate) ? '#FF6B35' : 'transparent',
              color: isToday(currentDate) ? 'white' : 'inherit',
              '&:hover': {
                bgcolor: isToday(currentDate) ? '#E55A24' : 'rgba(255, 107, 53, 0.1)'
              }
            }}>
              <TodayIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Фильтры */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">Filtry:</Typography>
        </Box>
        
        {/* Фильтр по статусу */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Vše"
            size="small"
            variant={selectedStatus === 'all' ? 'filled' : 'outlined'}
            onClick={() => setSelectedStatus('all')}
            sx={{ bgcolor: selectedStatus === 'all' ? '#FF6B35' : 'transparent' }}
          />
          {(['new', 'inProgress', 'review', 'done'] as TaskStatus[]).map(status => (
            <Chip
              key={status}
              label={t(`tasks.statuses.${status}`)}
              size="small"
              variant={selectedStatus === status ? 'filled' : 'outlined'}
              onClick={() => setSelectedStatus(status)}
              sx={{ 
                bgcolor: selectedStatus === status ? getStatusColor(status) : 'transparent',
                color: selectedStatus === status ? 'white' : 'inherit'
              }}
            />
          ))}
        </Box>
      </Box>
      
      {/* Дни недели */}
      <Grid container sx={{ mb: 2 }}>
        {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day: string, index: number) => (
          <Grid item xs={12/7} key={index}>
            <Box sx={{ 
              textAlign: 'center', 
              py: 1, 
              bgcolor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
              borderRadius: 1,
              mx: 0.5
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {day}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      
      {/* Календарная сетка */}
      <Grid container spacing={1}>
        {calendarDays.map((day: Date, index: number) => {
          const tasksForDay = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const hasOverdueTasks = tasksForDay.some(task => 
            task.status !== 'done' && new Date(task.deadline) < new Date()
          );
          
          return (
            <Grid item xs={12/7} key={index}>
              <Card 
                sx={{
                  height: 140,
                  backgroundColor: isCurrentMonth 
                    ? isCurrentDay 
                      ? theme.palette.mode === 'dark' ? 'rgba(255, 107, 53, 0.15)' : 'rgba(255, 107, 53, 0.05)'
                      : theme.palette.mode === 'dark' ? '#2a2a2a' : '#fff'
                    : theme.palette.mode === 'dark' ? '#222' : '#f8f9fa',
                  opacity: isCurrentMonth ? 1 : 0.6,
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                  border: isCurrentDay 
                    ? '2px solid #FF6B35' 
                    : hasOverdueTasks 
                      ? '1px solid #f44336'
                      : '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: isCurrentMonth ? 'translateY(-2px)' : 'none',
                    boxShadow: isCurrentMonth ? 3 : 1,
                  }
                }}
                variant="outlined"
              >
                {/* Заголовок дня */}
                <Box 
                  sx={{
                    p: 1, 
                    backgroundColor: isCurrentDay 
                      ? '#FF6B35'
                      : hasOverdueTasks
                        ? '#ffebee'
                        : theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
                    color: isCurrentDay ? '#fff' : 'inherit',
                    textAlign: 'center',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    position: 'relative'
                  }}
                >
                  <Typography variant="body2" sx={{ 
                    fontWeight: isCurrentDay ? 600 : 400,
                    fontSize: '0.875rem'
                  }}>
                    {format(day, 'd')}
                  </Typography>
                  
                  {/* Индикатор количества задач */}
                  {tasksForDay.length > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 4,
                        backgroundColor: isCurrentDay ? 'rgba(255,255,255,0.3)' : '#FF6B35',
                        color: isCurrentDay ? 'white' : 'white',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}
                    >
                      {tasksForDay.length}
                    </Box>
                  )}
                </Box>
                
                {/* Задачи дня */}
                <Box sx={{ p: 0.5, height: 'calc(100% - 40px)', overflow: 'auto' }}>
                  {tasksForDay.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {tasksForDay.slice(0, 3).map(task => (
                        <Fade in={true} key={task.id} timeout={300}>
                          <Chip
                            label={task.title}
                            size="small"
                            onClick={() => handleTaskClick(task.id)}
                            sx={{
                              backgroundColor: getPriorityColor(task.priority),
                              color: '#fff',
                              width: '100%',
                              justifyContent: 'flex-start',
                              cursor: 'pointer',
                              fontSize: '0.65rem',
                              height: 22,
                              borderRadius: 1,
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                opacity: 0.8,
                                transform: 'scale(1.02)',
                                boxShadow: 2
                              },
                              '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                padding: '0 8px',
                                fontWeight: 500
                              }
                            }}
                          />
                        </Fade>
                      ))}
                      
                      {/* Показать "еще X задач" если их больше 3 */}
                      {tasksForDay.length > 3 && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            textAlign: 'center', 
                            color: 'text.secondary',
                            fontSize: '0.65rem',
                            mt: 0.5,
                            cursor: 'pointer',
                            '&:hover': { color: '#FF6B35' }
                          }}
                          onClick={() => {
                            // Можно открыть модальное окно со всеми задачами дня
                            console.log('Show all tasks for day:', tasksForDay);
                          }}
                        >
                          +{tasksForDay.length - 3} dalších
                        </Typography>
                      )}
                    </Box>
                  ) : isCurrentMonth ? (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      opacity: 0.3
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Žádné úkoly
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Легенда */}
      <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Legenda priorit:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map(priority => (
            <Box key={priority} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: 1,
                  backgroundColor: getPriorityColor(priority)
                }} 
              />
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                {t(`tasks.priorities.${priority}`)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default TaskCalendar;