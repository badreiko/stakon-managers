import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectStatus } from '../types/project.types';
import { User } from '../types/user.types';
import { getProjects, createProject, updateProject, archiveProject } from '../services/projectService';
import { getUsers } from '../services/userService';

const statusColors: Record<ProjectStatus, string> = {
  active: '#4CAF50',
  completed: '#2196F3',
  onHold: '#FFC107',
  cancelled: '#F44336',
  archived: '#9E9E9E'
};

const Projects: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: '',
    status: 'active' as ProjectStatus,
    deadline: ''
  });

  // Fetch projects and users
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedProjects = await getProjects();
        const fetchedUsers = await getUsers();
        
        setProjects(fetchedProjects);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle edit project
  const handleEditProject = () => {
    if (!selectedProject) return;
    
    setFormData({
      name: selectedProject.name,
      description: selectedProject.description,
      manager: selectedProject.manager,
      status: selectedProject.status,
      deadline: selectedProject.deadline ? format(selectedProject.deadline, 'yyyy-MM-dd') : ''
    });
    
    setProjectFormOpen(true);
    handleMenuClose();
  };

  // Handle archive project
  const handleArchiveProject = async () => {
    if (!selectedProject) return;
    
    try {
      await archiveProject(selectedProject.id);
      
      // Update the project in the UI
      setProjects(projects.map(project => 
        project.id === selectedProject.id ? { ...project, status: 'archived' } : project
      ));
      
      handleMenuClose();
    } catch (error) {
      console.error('Error archiving project:', error);
    }
  };

  // Handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submit
  const handleFormSubmit = async () => {
    if (!currentUser) return;
    
    setFormLoading(true);
    try {
      if (selectedProject) {
        // Update existing project
        const updatedProject = await updateProject(selectedProject.id, {
          name: formData.name,
          description: formData.description,
          manager: formData.manager,
          status: formData.status,
          deadline: formData.deadline ? new Date(formData.deadline) : undefined
        });
        
        // Update the project in the UI
        setProjects(projects.map(project => 
          project.id === selectedProject.id ? updatedProject : project
        ));
      } else {
        // Create new project
        const newProject = await createProject({
          name: formData.name,
          description: formData.description,
          manager: formData.manager,
          status: formData.status,
          deadline: formData.deadline ? new Date(formData.deadline) : undefined,
          startDate: new Date(),
          createdBy: currentUser.uid,
          members: [],
          tags: []
        } as any);
        
        // Add the new project to the UI
        setProjects([...projects, newProject]);
      }
      
      // Close the form
      setProjectFormOpen(false);
      setSelectedProject(null);
      
      // Reset the form
      setFormData({
        name: '',
        description: '',
        manager: '',
        status: 'active',
        deadline: ''
      });
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setFormLoading(false);
    }
  };

  // Get user by ID
  const getUserById = (userId: string) => {
    return users.find(user => user.uid === userId);
  };

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd.MM.yyyy');
  };

  // Calculate project progress
  const calculateProgress = (project: Project) => {
    if (!project.statistics) return 0;
    
    const { totalTasks, completedTasks } = project.statistics;
    if (totalTasks === 0) return 0;
    
    return Math.round((completedTasks / totalTasks) * 100);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('projects.title')}
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedProject(null);
            setProjectFormOpen(true);
          }}
        >
          {t('projects.newProject')}
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {project.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleMenuOpen(e, project)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Chip 
                    label={t(`projects.statuses.${project.status}`)} 
                    size="small" 
                    sx={{ 
                      bgcolor: `${statusColors[project.status]}20`,
                      color: statusColors[project.status],
                      mb: 2
                    }} 
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {project.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">
                        {project.manager && getUserById(project.manager) 
                          ? getUserById(project.manager)?.displayName 
                          : t('common.unassigned')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">
                        {project.deadline 
                          ? formatDate(project.deadline) 
                          : t('common.noDeadline')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">
                        {project.statistics 
                          ? `${project.statistics.completedTasks}/${project.statistics.totalTasks} ${t('tasks.title')}`
                          : `0/0 ${t('tasks.title')}`}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('projects.statistics.progress')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={calculateProgress(project)} 
                          sx={{ 
                            height: 10, 
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: calculateProgress(project) >= 100 ? 'success.main' : 'primary.main'
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {calculateProgress(project)}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" color="primary">
                    {t('common.view')}
                  </Button>
                  <Button size="small" color="primary" onClick={() => {
                    setSelectedProject(project);
                    handleEditProject();
                  }}>
                    {t('common.edit')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Project menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditProject}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleArchiveProject}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          {t('projects.archive')}
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>
      
      {/* Project form dialog */}
      <Dialog 
        open={projectFormOpen} 
        onClose={() => setProjectFormOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedProject ? t('projects.edit') : t('projects.newProject')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label={t('projects.projectName')}
                  fullWidth
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label={t('projects.description')}
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('projects.manager')}</InputLabel>
                  <Select
                    name="manager"
                    value={formData.manager}
                    onChange={handleFormChange}
                    label={t('projects.manager')}
                  >
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
                          {user.displayName}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('projects.status')}</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    label={t('projects.status')}
                  >
                    <MenuItem value="active">{t('projects.statuses.active')}</MenuItem>
                    <MenuItem value="completed">{t('projects.statuses.completed')}</MenuItem>
                    <MenuItem value="onHold">{t('projects.statuses.onHold')}</MenuItem>
                    <MenuItem value="cancelled">{t('projects.statuses.cancelled')}</MenuItem>
                    <MenuItem value="archived">{t('projects.statuses.archived')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="deadline"
                  label={t('projects.deadline')}
                  type="date"
                  fullWidth
                  value={formData.deadline}
                  onChange={handleFormChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectFormOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained" 
            color="primary"
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={24} /> : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;
