import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider,
  Paper,
  Chip
} from '@mui/material';
import { 
  Assignment as TaskIcon, 
  Warning as OverdueIcon, 
  Today as TodayIcon, 
  CheckCircle as CompletedIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import StatCard from '../components/dashboard/StatCard';
import { STATUS_COLORS, PRIORITY_COLORS } from '../theme/theme';
import { getTasks } from '../services/taskService';
import { getUsers } from '../services/userService';
import { Task, TaskStatus } from '../types/task.types';
import { User } from '../types/user.types';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Fetch tasks and users from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch tasks
        const { tasks: fetchedTasks } = await getTasks();
        setTasks(fetchedTasks);
        
        // Fetch users
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Функция для получения имени пользователя по ID
  const getUserNameById = (userId: string): string => {
    if (!userId) return 'Не назначено';
    const user = users.find(u => u.uid === userId);
    return user ? (user.displayName || user.email) : userId;
  };
  
  // Calculate dashboard statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  const stats = {
    activeTasks: tasks.filter(task => task.status !== 'done' && task.status !== 'cancelled').length,
    overdueTasks: tasks.filter(task => {
      const deadline = new Date(task.deadline);
      return task.status !== 'done' && task.status !== 'cancelled' && deadline < today;
    }).length,
    todayTasks: tasks.filter(task => {
      const deadline = new Date(task.deadline);
      return task.status !== 'done' && task.status !== 'cancelled' && 
        deadline.getDate() === today.getDate() &&
        deadline.getMonth() === today.getMonth() &&
        deadline.getFullYear() === today.getFullYear();
    }).length,
    completedThisWeek: tasks.filter(task => {
      if (task.status !== 'done') return false;
      // Используем updatedAt вместо completedAt, так как completedAt отсутствует в типе Task
      if (!task.updatedAt) return false;
      const completedDate = new Date(task.updatedAt);
      return completedDate >= weekStart && completedDate <= today;
    }).length
  };
  
  // Get upcoming deadlines (non-completed tasks sorted by deadline)
  const upcomingDeadlines = tasks
    .filter(task => task.status !== 'done' && task.status !== 'cancelled')
    .sort((a, b) => {
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      return dateA - dateB;
    })
    .slice(0, 5); // Show only 5 upcoming tasks
  
  // Get recent activity (using the latest updated tasks)
  const recentActivity = [...tasks]
    .sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA; // Sort by most recent first
    })
    .slice(0, 5) // Show only 5 recent activities
    .map(task => ({
      id: task.id,
      task: task,
      time: task.updatedAt ? format(new Date(task.updatedAt), 'HH:mm') : ''
    }));

  // Function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return PRIORITY_COLORS.critical;
      case 'high':
        return PRIORITY_COLORS.high;
      case 'medium':
        return PRIORITY_COLORS.medium;
      case 'low':
        return PRIORITY_COLORS.low;
      default:
        return PRIORITY_COLORS.medium;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('dashboard.title')}
      </Typography>

      {/* Statistics Cards - Уменьшенные по высоте */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <StatCard 
          title={t('dashboard.activeTasks')} 
          value={stats.activeTasks} 
          icon={<TaskIcon fontSize="small" />} 
          color={PRIORITY_COLORS.medium}
          sx={{ flex: 1 }}
        />
        <StatCard 
          title={t('dashboard.overdueTasks')} 
          value={stats.overdueTasks} 
          icon={<OverdueIcon fontSize="small" />} 
          color={PRIORITY_COLORS.critical}
          sx={{ flex: 1 }}
        />
        <StatCard 
          title={t('dashboard.todayTasks')} 
          value={stats.todayTasks} 
          icon={<TodayIcon fontSize="small" />} 
          color={PRIORITY_COLORS.high}
          sx={{ flex: 1 }}
        />
        <StatCard 
          title={t('dashboard.completedThisWeek')} 
          value={stats.completedThisWeek} 
          icon={<CompletedIcon fontSize="small" />} 
          color="#4CAF50"
          sx={{ flex: 1 }}
        />
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Left Column - Nadcházející termíny в виде стикеров */}
        <Box sx={{ flex: { md: '1 1 70%' } }}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2, 
              boxShadow: 3, 
              overflow: 'hidden',
              backgroundImage: (theme: any) => theme.palette.mode === 'dark' 
                ? 'linear-gradient(rgba(30, 30, 30, 0.9), rgba(30, 30, 30, 0.9)), url("/cork-board.png")' 
                : 'linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url("/cork-board.png")',
              backgroundSize: 'cover',
              p: 2
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                {t('dashboard.upcomingDeadlines')}
              </Typography>
              
              {/* Фильтры в виде пиктограмм */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  icon={<PersonIcon fontSize="small" />} 
                  label={t('filters.assignee')} 
                  size="small" 
                  variant="outlined"
                  onClick={() => {}}
                />
                <Chip 
                  icon={<OverdueIcon fontSize="small" />} 
                  label={t('filters.priority')} 
                  size="small" 
                  variant="outlined"
                  onClick={() => {}}
                />
                <Chip 
                  icon={<CalendarIcon fontSize="small" />} 
                  label={t('filters.deadline')} 
                  size="small" 
                  variant="outlined"
                  onClick={() => {}}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {upcomingDeadlines.map((deadline) => (
                <Paper 
                  key={deadline.id} 
                  elevation={3} 
                  sx={{ 
                    width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.333% - 16px)' },
                    p: 2,
                    bgcolor: (theme: any) => theme.palette.mode === 'dark' ? '#555533' : '#fffacd',
                    color: (theme: any) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                    borderRadius: 1,
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '30px',
                      height: '10px',
                      bgcolor: '#f5f5f5',
                      borderBottomLeftRadius: '5px',
                      borderBottomRightRadius: '5px',
                      boxShadow: '0 2px 2px rgba(0,0,0,0.1)'
                    },
                    transform: 'rotate(1deg)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'rotate(0deg) translateY(-5px)',
                      zIndex: 1
                    }
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {deadline.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {getUserNameById(deadline.assignee)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip 
                      label={t(`tasks.priorities.${deadline.priority}`)} 
                      size="small" 
                      sx={{ 
                        bgcolor: getPriorityColor(deadline.priority) + '20',
                        color: getPriorityColor(deadline.priority),
                        fontSize: '0.7rem',
                        height: 20
                      }} 
                    />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(deadline.deadline), 'dd.MM.yyyy')}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Card>
        </Box>

        {/* Right Column - Nedávná aktivita и Úkoly podle řešitele */}
        <Box sx={{ flex: { md: '1 1 30%' }, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch' }}>
          {/* Nedávná aktivita в виде колонки чата/новостей */}
          <Card 
            sx={{ 
              mb: 3, 
              borderRadius: 2, 
              boxShadow: 3, 
              overflow: 'hidden',
              height: { xs: '300px', sm: '350px', md: '400px' },
              display: 'flex',
              flexDirection: 'column',
              position: 'sticky',
              top: { md: '20px' },
              right: 0,
              width: '100%'
            }}
          >
            <Box sx={{ 
              p: 2, 
              bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : '#f8f9fa', 
              borderBottom: (theme: any) => `1px solid ${theme.palette.divider}`
            }}>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                {t('dashboard.recentActivity')}
              </Typography>
            </Box>
            
            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              bgcolor: (theme: any) => theme.palette.mode === 'dark' ? '#252525' : '#f5f5f5' 
            }}>
              {recentActivity.map((activity) => (
                <Box 
                  key={activity.id} 
                  sx={{ 
                    p: 2, 
                    m: 2, 
                    bgcolor: (theme: any) => theme.palette.mode === 'dark' ? '#333333' : 'white', 
                    borderRadius: 2,
                    boxShadow: 1,
                    '&:hover': { boxShadow: 2 }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 1, 
                        bgcolor: 'primary.main' 
                      }}
                    >
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" fontWeight="bold">
                      {getUserNameById(activity.task.assignee)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      {activity.time}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2">
                    {t(`status.${activity.task.status}`)}: <strong>{activity.task.title}</strong>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>

          {/* Úkoly podle řešitele под Nedávná aktivita */}
          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: 3, 
            overflow: 'hidden',
            position: { md: 'sticky' },
            bottom: { md: '20px' },
            right: 0,
            width: '100%'
          }}>
            <Box sx={{ 
              p: 2, 
              bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : '#f8f9fa', 
              borderBottom: (theme: any) => `1px solid ${theme.palette.divider}`
            }}>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                {t('dashboard.tasksByAssignee')}
              </Typography>
            </Box>
            
            <Box sx={{ p: 2 }}>
              {Array.from(new Set(tasks.map(task => task.assignee)))
                .filter(assignee => assignee)
                .slice(0, 5)
                .map((assignee) => {
                  const assigneeTasks = tasks.filter(task => task.assignee === assignee);
                  const activeTasks = assigneeTasks.filter(task => 
                    task.status !== 'done' && task.status !== 'cancelled'
                  ).length;
                  
                  const completionPercent = Math.min(
                    100, 
                    assigneeTasks.length > 0 
                      ? (assigneeTasks.filter(t => t.status === 'done').length / assigneeTasks.length) * 100 
                      : 0
                  );
                  
                  return (
                    <Box key={assignee} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {getUserNameById(assignee)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activeTasks} {t('dashboard.activeTasks')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, height: 8, mb: 1 }}>
                        <Box 
                          sx={{ 
                            width: `${completionPercent}%`, 
                            bgcolor: PRIORITY_COLORS.medium,
                            height: 8,
                            borderRadius: 1
                          }} 
                        />
                      </Box>
                    </Box>
                  );
                })
              }
            </Box>
          </Card>
        </Box>
      </Box>
      
      {/* Úkoly podle statusu в виде тонкой полоски внизу экрана */}
      <Paper 
        sx={{ 
          mt: 4, 
          p: 2, 
          borderRadius: 2, 
          boxShadow: 2, 
          bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : '#f8f9fa'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mr: 2 }}>
            {t('dashboard.tasksByStatus')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexGrow: 1, height: 30, borderRadius: 1, overflow: 'hidden' }}>
            {[
              { status: 'new' as TaskStatus, label: t('tasks.statuses.new') },
              { status: 'inProgress' as TaskStatus, label: t('tasks.statuses.inProgress') },
              { status: 'review' as TaskStatus, label: t('tasks.statuses.review') },
              { status: 'done' as TaskStatus, label: t('tasks.statuses.done') },
              { status: 'cancelled' as TaskStatus, label: t('tasks.statuses.cancelled') }
            ].map(statusItem => {
              const count = tasks.filter(task => task.status === statusItem.status).length;
              const totalTasks = tasks.length || 1; // Избегаем деления на ноль
              const widthPercent = (count / totalTasks) * 100;
              
              return (
                <Box 
                  key={statusItem.status} 
                  sx={{ 
                    width: `${widthPercent}%`, 
                    bgcolor: STATUS_COLORS[statusItem.status],
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: count > 0 ? '40px' : '0px'
                  }}
                >
                  {count > 0 && (
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {count}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
          {[
            { status: 'new' as TaskStatus, label: t('tasks.statuses.new') },
            { status: 'inProgress' as TaskStatus, label: t('tasks.statuses.inProgress') },
            { status: 'review' as TaskStatus, label: t('tasks.statuses.review') },
            { status: 'done' as TaskStatus, label: t('tasks.statuses.done') },
            { status: 'cancelled' as TaskStatus, label: t('tasks.statuses.cancelled') }
          ].map(statusItem => (
            <Box key={statusItem.status} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: STATUS_COLORS[statusItem.status],
                  mr: 0.5 
                }} 
              />
              <Typography variant="caption">{statusItem.label}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
