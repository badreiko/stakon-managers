import React, { useState, useEffect } from 'react';
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
  CircularProgress
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
  Flag as FlagIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `task-detail-tab-${index}`,
    'aria-controls': `task-detail-tabpanel-${index}`,
  };
}

// Get priority color
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

// Get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return STATUS_COLORS.new;
    case 'inProgress':
      return STATUS_COLORS.inProgress;
    case 'review':
      return STATUS_COLORS.review;
    case 'done':
      return STATUS_COLORS.done;
    case 'cancelled':
      return STATUS_COLORS.cancelled;
    default:
      return STATUS_COLORS.new;
  }
};

const TaskDetail: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
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
  const [commentMenuAnchorEl, setCommentMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<TaskComment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch task and related data
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
        
        // Fetch assignee
        if (fetchedTask.assignee) {
          const fetchedAssignee = await getUserById(fetchedTask.assignee);
          setAssignee(fetchedAssignee);
        }
        
        // Fetch creator
        if (fetchedTask.createdBy) {
          const fetchedCreator = await getUserById(fetchedTask.createdBy);
          setCreator(fetchedCreator);
        }
        
        // Fetch project
        if (fetchedTask.project) {
          const fetchedProject = await getProjectById(fetchedTask.project);
          setProject(fetchedProject);
        }
      } catch (error) {
        console.error('Error fetching task data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, navigate]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle comment menu open
  const handleCommentMenuOpen = (event: React.MouseEvent<HTMLElement>, comment: TaskComment) => {
    event.stopPropagation();
    setCommentMenuAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };

  // Handle comment menu close
  const handleCommentMenuClose = () => {
    setCommentMenuAnchorEl(null);
    setSelectedComment(null);
  };

  // Handle edit task
  const handleEditTask = () => {
    setTaskFormOpen(true);
    handleMenuClose();
  };

  // Handle delete task
  const handleDeleteTask = async () => {
    if (!task) return;
    
    try {
      await deleteTask(task.id);
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Handle task form close
  const handleTaskFormClose = () => {
    setTaskFormOpen(false);
  };

  // Handle task form success
  const handleTaskFormSuccess = async () => {
    if (!taskId) return;
    
    // Refresh task data
    try {
      const refreshedTask = await getTaskById(taskId);
      if (refreshedTask) {
        setTask(refreshedTask);
      }
    } catch (error) {
      console.error('Error refreshing task:', error);
    }
  };

  // Handle send comment
  const handleSendComment = async () => {
    if (!task || !currentUser || !commentText.trim()) return;
    
    setSendingComment(true);
    try {
      const newComment = await addComment(task.id, {
        content: commentText.trim(),
        createdBy: currentUser.uid,
        mentions: []
      });
      
      // Update the task with the new comment
      setTask(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [...prev.comments, newComment]
        };
      });
      
      // Clear the comment text
      setCommentText('');
    } catch (error) {
      console.error('Error sending comment:', error);
    } finally {
      setSendingComment(false);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd.MM.yyyy HH:mm');
  };

  // Get user by ID (from already fetched users)
  const getUserName = async (userId: string) => {
    if (assignee && assignee.uid === userId) return assignee.displayName;
    if (creator && creator.uid === userId) return creator.displayName;
    
    try {
      const user = await getUserById(userId);
      return user ? user.displayName : userId;
    } catch (error) {
      console.error('Error fetching user:', error);
      return userId;
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip 
            label={t(`tasks.priorities.${task.priority}`)} 
            size="small" 
            sx={{ 
              bgcolor: `${getPriorityColor(task.priority)}20`,
              color: getPriorityColor(task.priority),
              fontWeight: 'bold',
              mr: 2
            }} 
          />
          <Typography variant="h4" component="h1">
            {task.title}
          </Typography>
        </Box>
        
        <Box>
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {t('tasks.details.basicInfo')}
                </Typography>
                <Button
                  startIcon={<EditIcon />}
                  onClick={handleEditTask}
                >
                  {t('common.edit')}
                </Button>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('tasks.assignee')}
                      </Typography>
                      <Typography variant="body1">
                        {assignee ? assignee.displayName : '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FlagIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('tasks.priority')}
                      </Typography>
                      <Typography variant="body1">
                        {t(`tasks.priorities.${task.priority}`)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AssignmentIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('tasks.status')}
                      </Typography>
                      <Chip 
                        label={t(`tasks.statuses.${task.status}`)} 
                        size="small" 
                        sx={{ 
                          bgcolor: getStatusColor(task.status),
                          color: 'text.primary'
                        }} 
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('tasks.deadline')}
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(task.deadline)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimeIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('tasks.estimatedTime')}
                      </Typography>
                      <Typography variant="body1">
                        {task.estimatedTime} {t('common.hours')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimeIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('tasks.details.actualTime')}
                      </Typography>
                      <Typography variant="body1">
                        {task.actualTime ? `${task.actualTime} ${t('common.hours')}` : '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('tasks.details.progress')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={task.progress} 
                          sx={{ 
                            height: 10, 
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: task.progress >= 100 ? 'success.main' : 'primary.main'
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {task.progress}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('tasks.description')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {task.description || t('common.noDescription')}
              </Typography>
            </CardContent>
          </Card>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="task detail tabs">
              <Tab label={t('tasks.comments')} {...a11yProps(0)} />
              <Tab label={t('tasks.attachments')} {...a11yProps(1)} />
              <Tab label={t('tasks.details.history')} {...a11yProps(2)} />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder={t('tasks.addComment')}
                value={commentText}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCommentText(e.target.value)}
                disabled={sendingComment}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<SendIcon />}
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || sendingComment}
                >
                  {sendingComment ? <CircularProgress size={24} /> : t('common.send')}
                </Button>
              </Box>
            </Box>
            
            {task.comments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  {t('tasks.noComments')}
                </Typography>
              </Box>
            ) : (
              <List>
                {task.comments.map((comment) => (
                  <React.Fragment key={comment.id}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        comment.createdBy === currentUser?.uid && (
                          <IconButton 
                            edge="end" 
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleCommentMenuOpen(e, comment)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {/* In a real app, we would fetch the user's avatar */}
                          {getUserName(comment.createdBy).then(name => name.charAt(0))}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">
                              {getUserName(comment.createdBy).then(name => name)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(comment.createdAt)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                          >
                            {comment.content}
                          </Typography>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {task.attachments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  {t('common.noAttachments')}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {task.attachments.map((attachment) => (
                  <Grid item xs={12} sm={6} md={4} key={attachment.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AttachFileIcon sx={{ mr: 1 }} />
                          <Typography variant="subtitle2" noWrap>
                            {attachment.name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatDate(attachment.uploadedAt)}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <Button size="small" href={attachment.url} target="_blank">
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
            {task.history.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  {t('common.noHistory')}
                </Typography>
              </Box>
            ) : (
              <List>
                {task.history.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          <HistoryIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">
                              {getUserName(entry.changedBy).then(name => name)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(entry.changedAt)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{ mt: 1 }}
                          >
                            {t('tasks.details.changedField', { field: entry.field })}
                            <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {t('common.from')}: {entry.oldValue}
                              </Typography>
                              <br />
                              <Typography variant="caption" color="text.secondary">
                                {t('common.to')}: {entry.newValue}
                              </Typography>
                            </Box>
                          </Typography>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </TabPanel>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('tasks.project')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {project ? (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    {project.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {project.description}
                  </Typography>
                </>
              ) : (
                <Typography color="text.secondary">
                  {t('common.noProject')}
                </Typography>
              )}
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('tasks.tags')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {task.tags.length === 0 ? (
                <Typography color="text.secondary">
                  {t('common.noTags')}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {task.tags.map((tag) => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      icon={<LabelIcon />} 
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('tasks.details.createdBy')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {creator && (
                  <>
                    <Avatar 
                      src={creator.photoURL || undefined} 
                      alt={creator.displayName}
                      sx={{ width: 40, height: 40, mr: 2 }}
                    >
                      {creator.displayName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {creator.displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {creator.position}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('tasks.details.createdAt')}: {formatDate(task.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('tasks.details.updatedAt')}: {formatDate(task.updatedAt)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Task menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditTask}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleDeleteTask}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>
      
      {/* Comment menu */}
      <Menu
        anchorEl={commentMenuAnchorEl}
        open={Boolean(commentMenuAnchorEl)}
        onClose={handleCommentMenuClose}
      >
        <MenuItem onClick={handleCommentMenuClose}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleCommentMenuClose}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>
      
      {/* Task form dialog */}
      {taskFormOpen && (
        <TaskForm
          task={task}
          open={taskFormOpen}
          onClose={handleTaskFormClose}
          onSuccess={handleTaskFormSuccess}
        />
      )}
    </Box>
  );
};

export default TaskDetail;
