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
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskStatus } from '../../types/task.types';
import { User } from '../../types/user.types';
import { Project } from '../../types/project.types';
import { getTasks, updateTaskStatus } from '../../services/taskService';
import { getUsers } from '../../services/userService';
import { getActiveProjects, getAllProjects } from '../../services/projectService';
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

// Sortable task item component
interface SortableTaskItemProps {
  task: Task;
  getUserById: (userId: string) => User | undefined;
  getProjectById: (projectId: string) => Project | undefined;
  getPriorityColor: (priority: string) => string;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, task: Task) => void;
  setSelectedTask: (task: Task) => void;
  setTaskFormOpen: (open: boolean) => void;
}

const SortableTaskItem = ({ 
  task, 
  getUserById, 
  getProjectById, 
  getPriorityColor, 
  handleMenuOpen, 
  setSelectedTask, 
  setTaskFormOpen 
}: SortableTaskItemProps) => {
  const { t } = useTranslation();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1
  };
  
  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      sx={{
        mb: 2,
        borderLeft: 4,
        borderColor: getPriorityColor(task.priority),
        boxShadow: isDragging ? 8 : 1,
        '&:hover': {
          boxShadow: 3
        }
      }}
      style={style}
      onClick={() => {
        setSelectedTask(task);
        setTaskFormOpen(true);
      }}
    >
      <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Chip 
            label={t(`tasks.priorities.${task.priority}`)} 
            size="small" 
            sx={{ 
              bgcolor: `${getPriorityColor(task.priority)}20`,
              color: getPriorityColor(task.priority),
              fontWeight: 'bold'
            }} 
          />
          <IconButton 
            size="small" 
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              handleMenuOpen(e, task);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom noWrap>
          {task.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {task.assignee && getUserById(task.assignee) && (
            <Tooltip title={getUserById(task.assignee)?.displayName || ''}>
              <Avatar 
                src={getUserById(task.assignee)?.photoURL} 
                alt={getUserById(task.assignee)?.displayName}
                sx={{ width: 24, height: 24, mr: 1 }}
              >
                {getUserById(task.assignee)?.displayName?.charAt(0)}
              </Avatar>
            </Tooltip>
          )}
          
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
  );
};

// Column component
interface ColumnProps {
  column: { id: TaskStatus; title: string; color: string };
  tasks: Task[];
  getUserById: (userId: string) => User | undefined;
  getProjectById: (projectId: string) => Project | undefined;
  getPriorityColor: (priority: string) => string;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, task: Task) => void;
  setSelectedTask: (task: Task) => void;
  setTaskFormOpen: (open: boolean) => void;
}

const Column = ({ 
  column, 
  tasks, 
  getUserById, 
  getProjectById, 
  getPriorityColor, 
  handleMenuOpen, 
  setSelectedTask, 
  setTaskFormOpen 
}: ColumnProps) => {
  const { t } = useTranslation();
  
  return (
    <Paper
      sx={{
        bgcolor: column.color,
        p: 2,
        height: '100%',
        overflowY: 'auto',
        transition: 'background-color 0.2s ease',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          {t(column.title)}
        </Typography>
        <Chip 
          label={tasks.length} 
          size="small" 
          sx={{ bgcolor: 'white' }} 
        />
      </Box>
      
      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <SortableTaskItem
            key={task.id}
            task={task}
            getUserById={getUserById}
            getProjectById={getProjectById}
            getPriorityColor={getPriorityColor}
            handleMenuOpen={handleMenuOpen}
            setSelectedTask={setSelectedTask}
            setTaskFormOpen={setTaskFormOpen}
          />
        ))}
      </SortableContext>
    </Paper>
  );
};

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
        // Используем тот же подход, что и в Dashboard
        const { tasks: fetchedTasks } = await getTasks();
        const fetchedUsers = await getUsers();
        const fetchedProjects = await getAllProjects(); // Используем getAllProjects вместо getActiveProjects
        
        console.log('KanbanBoard: Загружено задач:', fetchedTasks.length);
        console.log('KanbanBoard: Загружено пользователей:', fetchedUsers.length);
        console.log('KanbanBoard: Загружено проектов:', fetchedProjects.length);
        
        setTasks(fetchedTasks);
        setUsers(fetchedUsers);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error('KanbanBoard: Ошибка загрузки данных:', error);
        // Устанавливаем пустые массивы в случае ошибки
        setTasks([]);
        setUsers([]);
        setProjects([]);
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
    setSelectedTask(null);
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
  };

  // State for drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };
  
  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const taskId = active.id.toString();
    const overId = over.id.toString();
    
    // If the task is not dropped on a column, ignore
    if (!overId.startsWith('column-')) return;
    
    // Extract the column status from the over ID (format: 'column-{status}')
    const newStatus = overId.replace('column-', '') as TaskStatus;
    
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus || !currentUser) return;
    
    try {
      // Optimistically update the UI
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
      
      // Update in the database
      await updateTaskStatus(taskId, newStatus, currentUser.uid);
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert the UI if there's an error
      setTasks([...tasks]);
    }
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

  // Get all unique tags from tasks
  const allTags = Array.from(new Set(tasks.flatMap(task => task.tags)));

  return (
    <Box sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('tasks.kanban.title')}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
          >
            {t('common.filter')}
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedTask(null);
              setTaskFormOpen(true);
            }}
          >
            {t('tasks.newTask')}
          </Button>
        </Box>
      </Box>
      
      {filterMenuOpen && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('common.filter')}
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="assignee-filter-label">{t('tasks.assignee')}</InputLabel>
                <Select
                  labelId="assignee-filter-label"
                  name="assignee"
                  value={filters.assignee}
                  onChange={handleFilterChange}
                  input={<OutlinedInput label={t('tasks.assignee')} />}
                >
                  <MenuItem value="">
                    <em>{t('common.all')}</em>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.uid} value={user.uid}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {user.photoURL ? (
                          <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 24, height: 24, mr: 1 }} />
                        ) : (
                          <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                            {user.displayName.charAt(0)}
                          </Avatar>
                        )}
                        {user.displayName}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="project-filter-label">{t('tasks.project')}</InputLabel>
                <Select
                  labelId="project-filter-label"
                  name="project"
                  value={filters.project}
                  onChange={handleFilterChange}
                  input={<OutlinedInput label={t('tasks.project')} />}
                >
                  <MenuItem value="">
                    <em>{t('common.all')}</em>
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="tags-filter-label">{t('tasks.tags')}</InputLabel>
                <Select
                  labelId="tags-filter-label"
                  name="tags"
                  multiple
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
                  {allTags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      {tag}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleFilterReset}>
                {t('common.reset')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
              gap: 2,
              height: 'calc(100vh - 200px)',
              overflowX: 'auto',
              pb: 2
            }}
          >
            {columns.map((column) => (
              <div key={`column-${column.id}`} id={`column-${column.id}`}>
                <Column
                  column={column}
                  tasks={groupedTasks[column.id]}
                  getUserById={getUserById}
                  getProjectById={getProjectById}
                  getPriorityColor={getPriorityColor}
                  handleMenuOpen={handleMenuOpen}
                  setSelectedTask={setSelectedTask}
                  setTaskFormOpen={setTaskFormOpen}
                />
              </div>
            ))}
          </Box>
          
          {/* Drag overlay for the currently dragged task */}
          <DragOverlay>
            {activeId && (() => {
              const task = tasks.find(t => t.id === activeId);
              if (!task) return null;
              
              return (
                <Card
                  sx={{
                    mb: 2,
                    borderLeft: 4,
                    borderColor: getPriorityColor(task.priority),
                    boxShadow: 8,
                    opacity: 0.8,
                    width: '100%'
                  }}
                >
                  <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom noWrap>
                      {task.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {task.assignee && getUserById(task.assignee) && (
                        <Avatar 
                          src={getUserById(task.assignee)?.photoURL} 
                          alt={getUserById(task.assignee)?.displayName}
                          sx={{ width: 24, height: 24, mr: 1 }}
                        >
                          {getUserById(task.assignee)?.displayName?.charAt(0)}
                        </Avatar>
                      )}
                      
                      <Chip 
                        label={t(`tasks.priorities.${task.priority}`)} 
                        size="small" 
                        sx={{ 
                          bgcolor: `${getPriorityColor(task.priority)}20`,
                          color: getPriorityColor(task.priority),
                          fontWeight: 'bold'
                        }} 
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <CalendarIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">
                          {format(new Date(task.deadline), 'dd.MM.yyyy')}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })()}
          </DragOverlay>
        </DndContext>
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
