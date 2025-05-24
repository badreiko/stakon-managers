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
import { Task, TaskStatus } from '../types/task.types';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Fetch tasks from Firestore
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const { tasks: fetchedTasks } = await getTasks();
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);
  
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

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title={t('dashboard.activeTasks')} 
            value={stats.activeTasks} 
            icon={<TaskIcon />} 
            color={PRIORITY_COLORS.medium}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title={t('dashboard.overdueTasks')} 
            value={stats.overdueTasks} 
            icon={<OverdueIcon />} 
            color={PRIORITY_COLORS.critical}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title={t('dashboard.todayTasks')} 
            value={stats.todayTasks} 
            icon={<TodayIcon />} 
            color={PRIORITY_COLORS.high}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title={t('dashboard.completedThisWeek')} 
            value={stats.completedThisWeek} 
            icon={<CompletedIcon />} 
            color="#4CAF50"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.upcomingDeadlines')}
              </Typography>
              <List>
                {upcomingDeadlines.map((deadline, index) => (
                  <React.Fragment key={deadline.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getPriorityColor(deadline.priority) }}>
                          <TaskIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" component="span">
                              {deadline.title}
                            </Typography>
                            <Chip 
                              icon={<CalendarIcon fontSize="small" />} 
                              label={deadline.deadline} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box display="flex" alignItems="center" mt={0.5}>
                            <PersonIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                            <Typography variant="body2" component="span" color="text.secondary">
                              {deadline.assignee}
                            </Typography>
                            <Chip 
                              label={t(`tasks.priorities.${deadline.priority}`)} 
                              size="small" 
                              sx={{ 
                                ml: 1, 
                                bgcolor: getPriorityColor(deadline.priority) + '20',
                                color: getPriorityColor(deadline.priority),
                                fontSize: '0.7rem',
                                height: 20
                              }} 
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < upcomingDeadlines.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Task Status Chart */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.tasksByStatus')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
              {/* Подсчет задач по статусам */}
              {[
                { status: 'new' as TaskStatus, label: t('tasks.statuses.new') },
                { status: 'inProgress' as TaskStatus, label: t('tasks.statuses.inProgress') },
                { status: 'review' as TaskStatus, label: t('tasks.statuses.review') },
                { status: 'done' as TaskStatus, label: t('tasks.statuses.done') },
                { status: 'cancelled' as TaskStatus, label: t('tasks.statuses.cancelled') }
              ].map(statusItem => {
                const count = tasks.filter(task => task.status === statusItem.status).length;
                // Высота столбца зависит от количества задач
                const height = count === 0 ? 20 : Math.min(40 + count * 20, 200);
                
                return (
                  <Box key={statusItem.status} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ 
                      height, 
                      width: 40, 
                      bgcolor: STATUS_COLORS[statusItem.status], 
                      mb: 1, 
                      borderRadius: 1 
                    }} />
                    <Typography variant="body2">{statusItem.label}</Typography>
                    <Typography variant="subtitle2">{count}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.recentActivity')}
              </Typography>
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem key={activity.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            <strong>{activity.task.assignee}</strong> {t(`status.${activity.task.status}`)}: <em>{activity.task.title}</em>
                          </Typography>
                        }
                        secondary={activity.time}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Team Workload */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.tasksByAssignee')}
              </Typography>
              <List>
                {/* Группировка задач по исполнителям */}
                {Array.from(new Set(tasks.map(task => task.assignee)))
                  .filter(assignee => assignee) // Фильтруем пустые значения
                  .slice(0, 5) // Показываем только первых 5 исполнителей
                  .map((assignee, index) => {
                    const assigneeTasks = tasks.filter(task => task.assignee === assignee);
                    const activeTasks = assigneeTasks.filter(task => 
                      task.status !== 'done' && task.status !== 'cancelled'
                    ).length;
                    
                    // Процент выполнения для визуализации
                    const completionPercent = Math.min(
                      100, 
                      assigneeTasks.length > 0 
                        ? (assigneeTasks.filter(t => t.status === 'done').length / assigneeTasks.length) * 100 
                        : 0
                    );
                    
                    return (
                      <ListItem key={assignee} divider>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                              {assignee}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {activeTasks} {t('dashboard.activeTasks')}
                            </Typography>
                          </Box>
                          
                          {/* Прогресс-бар выполнения задач */}
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
                      </ListItem>
                    );
                  })
                }
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
