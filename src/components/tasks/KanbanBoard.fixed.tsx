import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Avatar, 
  Card, 
  CardContent, 
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Grid,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Button,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Add as AddIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DroppableStateSnapshot, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskStatus } from '../../types/task.types';
import { User } from '../../types/user.types';
import { Project } from '../../types/project.types';
import { getTasks, updateTaskStatus } from '../../services/taskService';
import { getUsers } from '../../services/userService';
import { getActiveProjects } from '../../services/projectService';
import TaskForm from './TaskForm';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../theme/theme';

// Define the columns for the Kanban board
const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'new', title: 'tasks.kanban.new', color: STATUS_COLORS.new },
  { id: 'inProgress', title: 'tasks.kanban.inProgress', color: STATUS_COLORS.inProgress },
  { id: 'review', title: 'tasks.kanban.review', color: STATUS_COLORS.review },
  { id: 'done', title: 'tasks.kanban.done', color: STATUS_COLORS.done },
  { id: 'cancelled', title: 'tasks.kanban.cancelled', color: STATUS_COLORS.cancelled }
];

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

const KanbanBoard: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    assignee: '',
    project: '',
    tags: [] as string[]
  });

  // Fetch tasks, users, and projects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { tasks: fetchedTasks } = await getTasks();
        const fetchedUsers = await getUsers();
        const fetchedProjects = await getActiveProjects();
        
        setTasks(fetchedTasks);
        setUsers(fetchedUsers);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group tasks by status
  const groupedTasks = columns.reduce((acc, column) => {
    acc[column.id] = tasks
      .filter(task => task.status === column.id)
      .filter(task => {
        // Apply filters
        if (filters.assignee && task.assignee !== filters.assignee) return false;
        if (filters.project && task.project !== filters.project) return false;
        if (filters.tags.length > 0 && !filters.tags.some(tag => task.tags.includes(tag))) return false;
        return true;
      });
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // Handle task menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  // Handle task menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle edit task
  const handleEditTask = () => {
    setTaskFormOpen(true);
    handleMenuClose();
  };

  // Handle task form close
  const handleTaskFormClose = () => {
    setTaskFormOpen(false);
    setSelectedTask(null);
  };

  // Handle task form success
  const handleTaskFormSuccess = () => {
    // Refresh tasks
    const fetchTasks = async () => {
      try {
        const { tasks: fetchedTasks } = await getTasks();
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
    handleTaskFormClose();
  };

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item is dropped in the same place
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Find the task that was dragged
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Update the task status
    const newStatus = destination.droppableId as TaskStatus;
    
    // Update the task in the database
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }
    
    updateTaskStatus(task.id, newStatus, currentUser.uid)
      .then(() => {
        // Update the local state
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === task.id ? { ...t, status: newStatus } : t
          )
        );
      })
      .catch(error => {
        console.error('Error updating task status:', error);
      });
  };

  // Handle filter change
  const handleFilterChange = (
    event: React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    const { name, value } = event.target;
    if (name) {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilters({
      assignee: '',
      project: '',
      tags: []
    });
  };

  // Get user by ID
  const getUserById = (userId: string) => {
    return users.find(user => user.uid === userId);
  };

  // Get project by ID
  const getProjectById = (projectId: string) => {
    return projects.find(project => project.id === projectId);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filter bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="assignee-filter-label">{t('tasks.assignee')}</InputLabel>
              <Select
                labelId="assignee-filter-label"
                id="assignee-filter"
                name="assignee"
                value={filters.assignee}
                onChange={handleFilterChange}
                label={t('tasks.assignee')}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.uid} value={user.uid}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={user.photoURL || undefined} 
                        alt={user.displayName}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      >
                        {user.displayName.charAt(0)}
                      </Avatar>
                      <Typography>{user.displayName}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="project-filter-label">{t('tasks.project')}</InputLabel>
              <Select
                labelId="project-filter-label"
                id="project-filter"
                name="project"
                value={filters.project}
                onChange={handleFilterChange}
                label={t('tasks.project')}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="tags-filter-label">{t('tasks.tags')}</InputLabel>
              <Select
                labelId="tags-filter-label"
                id="tags-filter"
                multiple
                name="tags"
                value={filters.tags}
                onChange={handleFilterChange}
                input={<OutlinedInput label={t('tasks.tags')} />}
                renderValue={(selected: unknown) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {Array.from(new Set(tasks.flatMap(task => task.tags))).map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FilterListIcon />}
              onClick={handleFilterReset}
              size="small"
            >
              {t('common.resetFilters')}
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedTask(null);
                setTaskFormOpen(true);
              }}
              size="small"
              sx={{ ml: 1 }}
            >
              {t('tasks.addTask')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${columns.length}, 1fr)`, 
            gap: 2,
            height: '100%',
            overflowX: 'auto',
            pb: 2
          }}>
            {columns.map((column) => (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <Paper
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      bgcolor: column.color,
                      p: 2,
                      height: '100%',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Typography variant="h6" component="h3">
                        {t(column.title)}
                      </Typography>
                      <Chip 
                        label={groupedTasks[column.id].length} 
                        size="small" 
                        color="primary" 
                      />
                    </Box>
                    
                    {groupedTasks[column.id].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{ 
                              mb: 2, 
                              bgcolor: snapshot.isDragging ? 'rgba(255, 255, 255, 0.9)' : 'white',
                              boxShadow: snapshot.isDragging ? 8 : 1
                            }}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Chip 
                                    label={t(`tasks.priorities.${task.priority}`)} 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: `${getPriorityColor(task.priority)}20`,
                                      color: getPriorityColor(task.priority),
                                      mr: 1
                                    }} 
                                  />
                                </Box>
                                
                                <IconButton 
                                  size="small" 
                                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleMenuOpen(e, task)}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              
                              <Typography variant="subtitle1" component="h4" gutterBottom>
                                {task.title}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Avatar 
                                  src={task.assignee ? getUserById(task.assignee)?.photoURL || undefined : undefined} 
                                  alt={task.assignee ? getUserById(task.assignee)?.displayName || '' : ''}
                                  sx={{ width: 24, height: 24, mr: 1 }}
                                >
                                  {task.assignee && getUserById(task.assignee)?.displayName.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {task.project && getProjectById(task.project)?.name}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Tooltip title={t('tasks.deadline')}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                                      <CalendarIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                      <Typography variant="caption">
                                        {format(new Date(task.deadline), 'dd.MM.yyyy')}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                </Box>
                                
                                <Box sx={{ display: 'flex' }}>
                                  {task.comments.length > 0 && (
                                    <Badge badgeContent={task.comments.length} color="primary" sx={{ mr: 1 }}>
                                      <CommentIcon fontSize="small" color="action" />
                                    </Badge>
                                  )}
                                  
                                  {task.attachments.length > 0 && (
                                    <Badge badgeContent={task.attachments.length} color="secondary">
                                      <AttachmentIcon fontSize="small" color="action" />
                                    </Badge>
                                  )}
                                </Box>
                              </Box>
                              
                              {task.tags.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                  {task.tags.slice(0, 3).map((tag) => (
                                    <Chip 
                                      key={tag} 
                                      label={tag} 
                                      size="small" 
                                      sx={{ height: 20, fontSize: '0.7rem' }} 
                                    />
                                  ))}
                                  {task.tags.length > 3 && (
                                    <Chip 
                                      label={`+${task.tags.length - 3}`} 
                                      size="small" 
                                      sx={{ height: 20, fontSize: '0.7rem' }} 
                                    />
                                  )}
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Paper>
                )}
              </Droppable>
            ))}
          </Box>
        </DragDropContext>
      )}
      
      {/* Task menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditTask}>
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          {t('common.delete')}
        </MenuItem>
      </Menu>
      
      {/* Task form dialog */}
      {taskFormOpen && (
        <TaskForm
          task={selectedTask || undefined}
          open={taskFormOpen}
          onClose={handleTaskFormClose}
          onSuccess={handleTaskFormSuccess}
        />
      )}
    </Box>
  );
};

export default KanbanBoard;
