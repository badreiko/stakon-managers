import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Avatar, 
  Button,
  IconButton,
  Divider,
  Grid,
  Card,
  CardContent,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Tab,
  Tabs,
  Menu,
  MenuItem,
  CircularProgress,
  Stack,
  Collapse,
  useMediaQuery
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Label as LabelIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Theme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskComment, TaskAttachment, TaskHistoryEntry } from '../../types/task.types';
import { User } from '../../types/user.types';
import { Project } from '../../types/project.types';
import { getTaskById, addComment, updateTask, deleteTask } from '../../services/taskService';
import { getUserById } from '../../services/userService';
import { getProjectById } from '../../services/projectService';
import TaskForm from './TaskForm';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../theme/theme';

// Компоненты для устранения дублирования
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-detail-tabpanel-${index}`}
      aria-labelledby={`task-detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

// Утилиты для цветов
const getPriorityColor = (priority: string): string => {
  return (priority in PRIORITY_COLORS) 
    ? PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] 
    : PRIORITY_COLORS.medium;
};

const getStatusColor = (status: string): string => {
  return (status in STATUS_COLORS) 
    ? STATUS_COLORS[status as keyof typeof STATUS_COLORS] 
    : STATUS_COLORS.new;
};

// Компактная карточка информации
interface InfoCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  actions?: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ 
  title, 
  icon, 
  children, 
  collapsible = false, 
  defaultExpanded = true,
  actions 
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  return (
    <Card sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ 
        bgcolor: 'background.paper', 
        p: { xs: 1.5, sm: 2 }, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        minHeight: { xs: 48, sm: 56 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography 
            variant={isMobile ? "subtitle2" : "h6"} 
            sx={{ fontWeight: 'medium' }}
          >
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {actions}
          {collapsible && (
            <IconButton 
              size="small" 
              onClick={() => setExpanded(!expanded)}
              sx={{ p: 0.5 }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
      </Box>
      
      <Collapse in={!collapsible || expanded}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </CardContent>
      </Collapse>
    </Card>
  );
};

// Компонент для отображения метаданных
interface MetadataItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}

const MetadataItem: React.FC<MetadataItemProps> = ({ icon, label, value, color }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
    <Box sx={{ color: color || 'text.secondary', display: 'flex', fontSize: { xs: 18, sm: 20 } }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ fontWeight: 'medium', wordBreak: 'break-word', lineHeight: 1.3 }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

const TaskDetail: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  // States
  const [task, setTask] = useState<Task | null>(null);
  const [assignee, setAssignee] = useState<User | null>(null);
  const [creator, setCreator] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // Мемоизированный форматтер даты
  const formatDate = useMemo(() => {
    return (date: Date | string | null | undefined) => {
      if (!date) return '-';
      try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return '-';
        return format(dateObj, isSmallMobile ? 'dd.MM.yy' : 'dd.MM.yyyy HH:mm');
      } catch {
        return '-';
      }
    };
  }, [isSmallMobile]);

  // Мемоизированная функция получения имени пользователя
  const getUserName = useMemo(() => {
    return (userId: string) => {
      if (assignee && assignee.uid === userId) return assignee.displayName;
      if (creator && creator.uid === userId) return creator.displayName;
      return userId;
    };
  }, [assignee, creator]);

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      if (!taskId) return;
      
      setLoading(true);
      try {
        const fetchedTask = await getTaskById(taskId);
        if (!fetchedTask) {
          navigate('/tasks');
          return;
        }
        
        setTask(fetchedTask);
        
        const [fetchedAssignee, fetchedCreator, fetchedProject] = await Promise.all([
          fetchedTask.assignee ? getUserById(fetchedTask.assignee) : null,
          fetchedTask.createdBy ? getUserById(fetchedTask.createdBy) : null,
          fetchedTask.project ? getProjectById(fetchedTask.project) : null
        ]);
        
        setAssignee(fetchedAssignee);
        setCreator(fetchedCreator);
        setProject(fetchedProject);
      } catch (error) {
        console.error('Error fetching task data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, navigate]);

  // Обработчики
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditTask = () => {
    setTaskFormOpen(true);
    handleMenuClose();
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    try {
      await deleteTask(task.id);
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleSendComment = async () => {
    if (!task || !currentUser || !commentText.trim()) return;
    
    setSendingComment(true);
    try {
      const newComment = await addComment(task.id, {
        content: commentText.trim(),
        createdBy: currentUser.uid,
        mentions: []
      });
      
      setTask(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [...prev.comments, newComment]
        };
      });
      
      setCommentText('');
    } catch (error) {
      console.error('Error sending comment:', error);
    } finally {
      setSendingComment(false);
    }
  };

  const handleTaskFormSuccess = async () => {
    if (!taskId) return;
    try {
      const refreshedTask = await getTaskById(taskId);
      if (refreshedTask) setTask(refreshedTask);
    } catch (error) {
      console.error('Error refreshing task:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          {t('common.notFound')}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/tasks')}>
          {t('common.backToList')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: 'auto', 
      px: { xs: 1, sm: 2, md: 3 }, 
      py: { xs: 2, sm: 3 } 
    }}>
      {/* Заголовок задачи */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: 2,
          background: (theme: Theme) => 
            `linear-gradient(to right, ${theme.palette.background.paper}, ${getStatusColor(task.status)}15)`,
          border: (theme: Theme) => `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
              <Chip 
                label={t(`tasks.priorities.${task.priority}`)} 
                size="small" 
                sx={{ 
                  bgcolor: `${getPriorityColor(task.priority)}20`,
                  color: getPriorityColor(task.priority),
                  fontWeight: 'bold',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }} 
              />
              <Chip 
                label={t(`tasks.statuses.${task.status}`)} 
                size="small" 
                sx={{ 
                  bgcolor: getStatusColor(task.status),
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }} 
              />
            </Stack>
            <Typography 
              variant={isSmallMobile ? "h5" : "h4"} 
              component="h1" 
              sx={{ fontWeight: 'bold', mb: 1, wordBreak: 'break-word' }}
            >
              {task.title}
            </Typography>
          </Box>
          
          <IconButton 
            onClick={handleMenuOpen}
            sx={{ 
              bgcolor: 'background.paper', 
              boxShadow: 1,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
        
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          <Grid item xs={12} sm={4}>
            <MetadataItem 
              icon={<CalendarIcon />}
              label={t('tasks.deadline')}
              value={formatDate(task.deadline)}
              color="error.main"
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <MetadataItem 
              icon={<TimeIcon />}
              label={t('tasks.estimatedTime')}
              value={`${task.estimatedTime} ${t('common.hours')}`}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <MetadataItem 
              icon={<PersonIcon />}
              label={t('tasks.assignee')}
              value={assignee ? assignee.displayName : '-'}
              color="primary.main"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} md={8}>
          {/* Основная информация о задаче */}
          <InfoCard
            title={t('tasks.details.basicInfo')}
            icon={<AssignmentIcon fontSize="small" />}
            actions={
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditTask}
                size="small"
                sx={{ borderRadius: 1.5 }}
              >
                {t('common.edit')}
              </Button>
            }
          >
            <Stack spacing={3}>
              {/* Описание */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                  {t('tasks.description')}
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    borderRadius: 1, 
                    bgcolor: 'background.default',
                    maxHeight: { xs: 150, sm: 200 },
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {task.description || t('common.noDescription')}
                  </Typography>
                </Paper>
              </Box>
              
              {/* Прогресс */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                  {t('tasks.details.progress')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={task.progress} 
                    sx={{ 
                      flex: 1,
                      height: 8, 
                      borderRadius: 2,
                      bgcolor: 'background.default',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: task.progress >= 100 ? 'success.main' : 'primary.main'
                      }
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: task.progress >= 100 ? 'success.main' : 'primary.main',
                      minWidth: '45px'
                    }}
                  >
                    {task.progress}%
                  </Typography>
                </Box>
              </Box>
              
              {/* Время */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <MetadataItem 
                      icon={<TimeIcon />}
                      label={t('tasks.estimatedTime')}
                      value={`${task.estimatedTime} ${t('common.hours')}`}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <MetadataItem 
                      icon={<TimeIcon />}
                      label={t('tasks.details.actualTime')}
                      value={task.actualTime ? `${task.actualTime} ${t('common.hours')}` : '-'}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </InfoCard>
          
          {/* Вкладки */}
          <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant={isSmallMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isSmallMobile ? "auto" : false}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': { 
                  fontWeight: 'medium',
                  py: { xs: 1, sm: 1.5 },
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '0.95rem' },
                  minWidth: { xs: 120, sm: 'auto' }
                }
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                    </svg>
                    {isSmallMobile ? t('tasks.comments').slice(0, 8) : t('tasks.comments')}
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachFileIcon fontSize="small" />
                    {isSmallMobile ? t('tasks.attachments').slice(0, 8) : t('tasks.attachments')}
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <HistoryIcon fontSize="small" />
                    {isSmallMobile ? t('tasks.details.history').slice(0, 8) : t('tasks.details.history')}
                  </Box>
                } 
              />
            </Tabs>

            {/* Содержимое вкладок */}
            <TabPanel value={tabValue} index={0}>
              {/* Комментарии */}
              <Stack spacing={3}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={isSmallMobile ? 2 : 3}
                    placeholder={t('tasks.addComment')}
                    value={commentText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCommentText(e.target.value)}
                    disabled={sendingComment}
                    variant="outlined"
                    size={isSmallMobile ? "small" : "medium"}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        bgcolor: 'background.paper'
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="contained"
                      endIcon={sendingComment ? null : <SendIcon />}
                      onClick={handleSendComment}
                      disabled={!commentText.trim() || sendingComment}
                      size={isSmallMobile ? "small" : "medium"}
                      sx={{ borderRadius: 1.5 }}
                    >
                      {sendingComment ? <CircularProgress size={20} /> : t('common.send')}
                    </Button>
                  </Box>
                </Paper>
                
                {task.comments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      {t('tasks.noComments')}
                    </Typography>
                  </Box>
                ) : (
                  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <List sx={{ p: 0 }}>
                      {task.comments.map((comment, index) => (
                        <React.Fragment key={comment.id}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{ 
                              p: { xs: 1.5, sm: 2 },
                              bgcolor: index % 2 === 0 ? 'background.default' : 'background.paper'
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ 
                                  bgcolor: getPriorityColor(task.priority),
                                  width: { xs: 32, sm: 40 },
                                  height: { xs: 32, sm: 40 },
                                  fontSize: { xs: '0.8rem', sm: '1rem' }
                                }}
                              >
                                {getUserName(comment.createdBy).charAt(0)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  mb: 0.5,
                                  flexDirection: { xs: 'column', sm: 'row' },
                                  alignItems: { xs: 'flex-start', sm: 'center' },
                                  gap: { xs: 0.5, sm: 0 }
                                }}>
                                  <Typography 
                                    variant={isSmallMobile ? "body2" : "subtitle2"} 
                                    sx={{ fontWeight: 'bold' }}
                                  >
                                    {getUserName(comment.createdBy)}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary" 
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 0.5,
                                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                    }}
                                  >
                                    <CalendarIcon fontSize="inherit" />
                                    {formatDate(comment.createdAt)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  sx={{ 
                                    mt: 1, 
                                    whiteSpace: 'pre-wrap', 
                                    lineHeight: 1.5,
                                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                  }}
                                >
                                  {comment.content}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < task.comments.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                )}
              </Stack>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Вложения */}
              {task.attachments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    {t('common.noAttachments')}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {task.attachments.map((attachment) => (
                    <Grid item xs={12} sm={6} key={attachment.id}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AttachFileIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle2" noWrap>
                              {attachment.name}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                          >
                            <CalendarIcon fontSize="inherit" />
                            {formatDate(attachment.uploadedAt)}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button 
                              size="small" 
                              href={attachment.url} 
                              target="_blank"
                              variant="outlined"
                              sx={{ borderRadius: 1.5 }}
                            >
                              {t('common.download')}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* История */}
              {task.history.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    {t('common.noHistory')}
                  </Typography>
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <List sx={{ p: 0 }}>
                    {task.history.map((entry, index) => (
                      <React.Fragment key={entry.id}>
                        <ListItem 
                          alignItems="flex-start"
                          sx={{ 
                            p: { xs: 1.5, sm: 2 },
                            bgcolor: index % 2 === 0 ? 'background.default' : 'background.paper'
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: 'primary.main',
                                width: { xs: 32, sm: 40 },
                                height: { xs: 32, sm: 40 }
                              }}
                            >
                              <HistoryIcon fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                mb: 0.5,
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                gap: { xs: 0.5, sm: 0 }
                              }}>
                                <Typography 
                                  variant={isSmallMobile ? "body2" : "subtitle2"} 
                                  sx={{ fontWeight: 'bold' }}
                                  >
                                 {getUserName(entry.changedBy)}
                               </Typography>
                               <Typography 
                                 variant="caption" 
                                 color="text.secondary" 
                                 sx={{ 
                                   display: 'flex', 
                                   alignItems: 'center', 
                                   gap: 0.5,
                                   fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                 }}
                               >
                                 <CalendarIcon fontSize="inherit" />
                                 {formatDate(entry.changedAt)}
                               </Typography>
                             </Box>
                           }
                           secondary={
                             <Box sx={{ mt: 1 }}>
                               <Typography 
                                 variant="body2" 
                                 color="text.primary" 
                                 sx={{ 
                                   fontWeight: 'medium',
                                   fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                 }}
                               >
                                 {t('tasks.details.changedField', { field: entry.field })}
                               </Typography>
                               <Paper 
                                 variant="outlined" 
                                 sx={{ 
                                   mt: 1, 
                                   p: { xs: 1, sm: 1.5 }, 
                                   borderRadius: 1.5, 
                                   bgcolor: 'background.paper' 
                                 }}
                               >
                                 <Grid container spacing={1}>
                                   <Grid item xs={12} sm={6}>
                                     <Box>
                                       <Typography 
                                         variant="caption" 
                                         color="text.secondary" 
                                         sx={{ display: 'block', mb: 0.5 }}
                                       >
                                         {t('common.from')}:
                                       </Typography>
                                       <Typography 
                                         variant="body2" 
                                         color="error.main" 
                                         sx={{ 
                                           fontStyle: 'italic',
                                           fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                           wordBreak: 'break-word'
                                         }}
                                       >
                                         {entry.oldValue || '-'}
                                       </Typography>
                                     </Box>
                                   </Grid>
                                   <Grid item xs={12} sm={6}>
                                     <Box>
                                       <Typography 
                                         variant="caption" 
                                         color="text.secondary" 
                                         sx={{ display: 'block', mb: 0.5 }}
                                       >
                                         {t('common.to')}:
                                       </Typography>
                                       <Typography 
                                         variant="body2" 
                                         color="success.main" 
                                         sx={{ 
                                           fontWeight: 'medium',
                                           fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                           wordBreak: 'break-word'
                                         }}
                                       >
                                         {entry.newValue || '-'}
                                       </Typography>
                                     </Box>
                                   </Grid>
                                 </Grid>
                               </Paper>
                             </Box>
                           }
                         />
                       </ListItem>
                       {index < task.history.length - 1 && <Divider />}
                     </React.Fragment>
                   ))}
                 </List>
               </Paper>
             )}
           </TabPanel>
         </Card>
       </Grid>
       
       {/* Правая боковая панель - исправленная */}
       <Grid item xs={12} md={4}>
         <Box sx={{ 
           position: { md: 'sticky' }, 
           top: { md: 24 },
           height: 'fit-content'
         }}>
           <Stack spacing={2}>
             {/* Проект - компактная версия */}
             <InfoCard
               title={t('tasks.project')}
               icon={<BusinessIcon fontSize="small" />}
               collapsible={isMobile}
               defaultExpanded={!isMobile}
             >
               {project ? (
                 <Stack spacing={2}>
                   <Paper 
                     variant="outlined" 
                     sx={{ 
                       p: { xs: 1.5, sm: 2 }, 
                       borderRadius: 2,
                       bgcolor: 'background.default',
                       borderLeft: '3px solid',
                       borderColor: 'primary.main'
                     }}
                   >
                     <Typography 
                       variant={isSmallMobile ? "body1" : "subtitle1"} 
                       gutterBottom 
                       sx={{ fontWeight: 'bold', lineHeight: 1.3 }}
                     >
                       {project.name}
                     </Typography>
                     <Typography 
                       variant="body2" 
                       color="text.secondary" 
                       sx={{ 
                         lineHeight: 1.5,
                         fontSize: { xs: '0.8rem', sm: '0.875rem' },
                         display: '-webkit-box',
                         WebkitLineClamp: 2,
                         WebkitBoxOrient: 'vertical',
                         overflow: 'hidden'
                       }}
                     >
                       {project.description}
                     </Typography>
                   </Paper>
                   
                   <Box sx={{ 
                     display: 'flex', 
                     flexDirection: { xs: 'row', sm: 'column' },
                     gap: { xs: 2, sm: 1 }
                   }}>
                     <MetadataItem 
                       icon={<CalendarIcon />}
                       label={t('projects.startDate')}
                       value={formatDate(project.startDate)}
                       color="primary.main"
                     />
                     <MetadataItem 
                       icon={<CalendarIcon />}
                       label={t('projects.deadline')}
                       value={formatDate(project.deadline)}
                       color="error.main"
                     />
                   </Box>
                 </Stack>
               ) : (
                 <Box sx={{ textAlign: 'center', py: 2 }}>
                   <Typography color="text.secondary" variant="body2">
                     {t('common.noProject')}
                   </Typography>
                 </Box>
               )}
             </InfoCard>
             
             {/* Теги - компактная версия */}
             <InfoCard
               title={t('tasks.tags')}
               icon={<LabelIcon fontSize="small" />}
               collapsible={isMobile}
               defaultExpanded={!isMobile}
             >
               {task.tags.length === 0 ? (
                 <Box sx={{ textAlign: 'center', py: 2 }}>
                   <Typography color="text.secondary" variant="body2">
                     {t('common.noTags')}
                   </Typography>
                 </Box>
               ) : (
                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                   {task.tags.map((tag) => (
                     <Chip 
                       key={tag} 
                       label={tag} 
                       size="small"
                       sx={{ 
                         borderRadius: 1,
                         bgcolor: 'background.default',
                         fontSize: { xs: '0.7rem', sm: '0.75rem' },
                         height: { xs: 24, sm: 28 },
                         '&:hover': { bgcolor: 'action.hover' }
                       }}
                     />
                   ))}
                 </Box>
               )}
             </InfoCard>
             
             {/* Создатель - компактная версия */}
             <InfoCard
               title={t('tasks.details.createdBy')}
               icon={<PersonIcon fontSize="small" />}
               collapsible={isMobile}
               defaultExpanded={!isMobile}
             >
               {creator ? (
                 <Stack spacing={2}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                     <Avatar 
                       src={creator.photoURL || undefined} 
                       alt={creator.displayName}
                       sx={{ 
                         width: { xs: 40, sm: 48 }, 
                         height: { xs: 40, sm: 48 }, 
                         bgcolor: 'primary.main',
                         boxShadow: 1,
                         fontSize: { xs: '1rem', sm: '1.2rem' }
                       }}
                     >
                       {creator.displayName.charAt(0)}
                     </Avatar>
                     <Box sx={{ minWidth: 0, flex: 1 }}>
                       <Typography 
                         variant={isSmallMobile ? "body1" : "subtitle1"} 
                         sx={{ fontWeight: 'bold', wordBreak: 'break-word', lineHeight: 1.3 }}
                       >
                         {creator.displayName}
                       </Typography>
                       <Typography 
                         variant="body2" 
                         color="text.secondary" 
                         sx={{ 
                           fontSize: { xs: '0.75rem', sm: '0.875rem' },
                           wordBreak: 'break-word',
                           lineHeight: 1.2
                         }}
                       >
                         {creator.position || creator.email}
                       </Typography>
                     </Box>
                   </Box>
                   
                   <Paper 
                     variant="outlined" 
                     sx={{ 
                       p: { xs: 1.5, sm: 2 }, 
                       borderRadius: 2,
                       bgcolor: 'background.default'
                     }}
                   >
                     <Stack spacing={1}>
                       <Box sx={{ 
                         display: 'flex', 
                         justifyContent: 'space-between', 
                         alignItems: 'center',
                         gap: 1
                       }}>
                         <Typography variant="caption" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
                           {t('tasks.details.createdAt')}:
                         </Typography>
                         <Typography 
                           variant="body2" 
                           sx={{ 
                             display: 'flex', 
                             alignItems: 'center', 
                             gap: 0.5,
                             fontSize: { xs: '0.75rem', sm: '0.875rem' },
                             textAlign: 'right'
                           }}
                         >
                           <CalendarIcon fontSize="inherit" />
                           {formatDate(task.createdAt)}
                         </Typography>
                       </Box>
                       <Divider />
                       <Box sx={{ 
                         display: 'flex', 
                         justifyContent: 'space-between', 
                         alignItems: 'center',
                         gap: 1
                       }}>
                         <Typography variant="caption" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
                           {t('tasks.details.updatedAt')}:
                         </Typography>
                         <Typography 
                           variant="body2" 
                           sx={{ 
                             display: 'flex', 
                             alignItems: 'center', 
                             gap: 0.5,
                             fontSize: { xs: '0.75rem', sm: '0.875rem' },
                             textAlign: 'right'
                           }}
                         >
                           <CalendarIcon fontSize="inherit" />
                           {formatDate(task.updatedAt)}
                         </Typography>
                       </Box>
                     </Stack>
                   </Paper>
                 </Stack>
               ) : (
                 <Box sx={{ textAlign: 'center', py: 2 }}>
                   <Typography color="text.secondary" variant="body2">
                     {t('common.noData')}
                   </Typography>
                 </Box>
               )}
             </InfoCard>
           </Stack>
         </Box>
       </Grid>
     </Grid>
     
     {/* Меню действий */}
     <Menu
       anchorEl={menuAnchorEl}
       open={Boolean(menuAnchorEl)}
       onClose={handleMenuClose}
       PaperProps={{
         sx: { minWidth: 160 }
       }}
     >
       <MenuItem onClick={handleEditTask}>
         <EditIcon fontSize="small" sx={{ mr: 1 }} />
         {t('common.edit')}
       </MenuItem>
       <MenuItem onClick={handleDeleteTask} sx={{ color: 'error.main' }}>
         <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
         {t('common.delete')}
       </MenuItem>
     </Menu>
     
     {/* Диалог редактирования задачи */}
     {taskFormOpen && (
       <TaskForm
         task={task}
         open={taskFormOpen}
         onClose={() => setTaskFormOpen(false)}
         onSuccess={handleTaskFormSuccess}
       />
     )}
   </Box>
 );
};

export default TaskDetail;