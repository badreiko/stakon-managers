import React, { useState, useEffect } from 'react';
import { useForm, Controller, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Grid,
  Typography,
  Tabs,
  Tab,
  Chip,
  Paper,
  Slider,
  Autocomplete,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { cs } from 'date-fns/locale';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskPriority, TaskStatus } from '../../types/task.types';
import { Project } from '../../types/project.types';
import { User } from '../../types/user.types';
import { createTask, updateTask } from '../../services/taskService';
import { getAllProjects } from '../../services/projectService';
import { getUsers } from '../../services/userService';
import { db } from '../../firebase/config';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  className?: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, className, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      className={className}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `task-tab-${index}`,
    'aria-controls': `task-tabpanel-${index}`,
  };
}

interface TaskFormInputs {
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  project: string;
  deadline: Date;
  estimatedTime: number;
  tags: string[];
  progress: number;
}

interface TaskFormProps {
  task?: Task;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const schema = yup.object().shape({
  title: yup.string().required('Název úkolu je povinný'),
  description: yup.string(),
  assignee: yup.string(),
  priority: yup.string().oneOf(['critical', 'high', 'medium', 'low'] as TaskPriority[]).required(),
  status: yup.string().oneOf(['new', 'inProgress', 'review', 'done', 'cancelled'] as TaskStatus[]).required(),
  project: yup.string(),
  deadline: yup.date(),
  estimatedTime: yup.number().min(0),
  tags: yup.array().of(yup.string().defined()),
  progress: yup.number().min(0).max(100)
});

const TaskForm: React.FC<TaskFormProps> = ({ task, open, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { currentUser, userData } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TaskFormInputs>({
    resolver: yupResolver(schema) as Resolver<TaskFormInputs>,
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      assignee: task?.assignee || '',
      priority: task?.priority || 'medium',
      status: task?.status || 'new',
      project: task?.project || '',
      deadline: task?.deadline || new Date(),
      estimatedTime: task?.estimatedTime || 1,
      tags: task?.tags || [],
      progress: task?.progress || 0
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Начинаем загрузку данных для формы задачи...');
        
        // Fetch users
        console.log('Загружаем пользователей...');
        const fetchedUsers = await getUsers();
        console.log('Загружено пользователей:', fetchedUsers.length);
        setUsers(fetchedUsers);

        // Fetch projects
        console.log('Загружаем проекты...');
        try {
          const fetchedProjects = await getAllProjects();
          console.log('Загружено проектов:', fetchedProjects.length, fetchedProjects);
          setProjects(fetchedProjects);
        } catch (projectError) {
          console.error('Ошибка при загрузке проектов:', projectError);
          setSaveError(`Ошибка при загрузке проектов: ${projectError instanceof Error ? projectError.message : String(projectError)}`);
        }

        // Mock available tags (in a real app, these would come from the backend)
        setAvailableTags(['urgent', 'bug', 'feature', 'documentation', 'design', 'backend', 'frontend']);
        
        console.log('Загрузка данных для формы задачи завершена');
      } catch (error) {
        console.error('Общая ошибка при загрузке данных формы:', error);
        setSaveError(`Ошибка при загрузке данных: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        assignee: task.assignee,
        priority: task.priority,
        status: task.status,
        project: task.project,
        deadline: task.deadline,
        estimatedTime: task.estimatedTime,
        tags: task.tags,
        progress: task.progress
      });
    }
  }, [task, reset]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles(prev => [...prev, ...newFiles].slice(0, 10)); // Limit to 10 files
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: TaskFormInputs) => {
    if (!currentUser) return;
    
    setLoading(true);
    setSaveError(null);
    
    try {
      if (task) {
        // Обновление существующей задачи
        const taskRef = doc(db, 'tasks', task.id);
        
        // Сохраняем текущие значения статуса и прогресса, если они не были изменены
        const status = data.status === task.status ? task.status : data.status;
        const progress = data.progress === task.progress ? task.progress : data.progress;
        
        // Сохраняем существующие вложения и комментарии
        const attachments = task.attachments || [];
        const comments = task.comments || [];
        const history = task.history || [];
        const createdAt = task.createdAt || new Date();
        const createdBy = task.createdBy || currentUser?.uid || '';
        
        // Добавляем запись в историю об изменении задачи
        const newHistoryEntry = {
          id: Date.now().toString(),
          userId: currentUser.uid,
          action: 'update',
          timestamp: new Date(),
          details: {
            changedFields: Object.keys(data).filter(key => {
              const k = key as keyof TaskFormInputs;
              return data[k] !== (task as any)[k];
            })
          }
        };
        
        const updatedHistory = [...history, newHistoryEntry];
        
        await updateDoc(taskRef, {
          title: data.title,
          description: data.description,
          assignee: data.assignee,
          priority: data.priority,
          status: status,
          project: data.project,
          deadline: data.deadline,
          estimatedTime: data.estimatedTime,
          tags: data.tags,
          progress: progress,
          attachments: attachments,
          comments: comments,
          history: updatedHistory,
          createdBy: createdBy,
          createdAt: createdAt,
          updatedAt: new Date()
        });
      } else {
        // Создание новой задачи
        const taskData = {
          ...data,
          createdBy: currentUser?.uid || '',
          attachments: [],
          comments: [],
          history: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await addDoc(collection(db, 'tasks'), taskData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      setSaveError('Chyba při ukládání úkolu. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          maxHeight: '90vh',
          bgcolor: '#333',
          color: 'white'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          pb: 1, 
          color: 'white',
          '& .MuiTypography-root': {
            fontSize: '1.25rem',
            fontWeight: 500
          }
        }}
      >
        {task ? 'Upravit úkol' : 'Nový úkol'}
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="task form tabs"
          sx={{ 
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 'normal' },
            '& .Mui-selected': { color: '#ff5722 !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#ff5722' }
          }}
        >
          <Tab label="ZÁKLADNÍ INFORMACE" {...a11yProps(0)} />
          <Tab label="PLÁNOVÁNÍ" {...a11yProps(1)} />
          <Tab label="DOPLŇUJÍCÍ INFORMACE" {...a11yProps(2)} />
        </Tabs>
      </Box>
      
      <form onSubmit={handleSubmit(onSubmit as any)}>
        <DialogContent sx={{ bgcolor: '#333', color: 'white', p: 0 }}>
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Název úkolu *
                  </Typography>
                </Box>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      placeholder="Název úkolu"
                      error={!!errors.title}
                      helperText={errors.title ? errors.title.message as string : ''}
                      disabled={loading}
                      required
                      InputProps={{
                        sx: {
                          bgcolor: '#444',
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.2)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.3)'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ff5722'
                          }
                        }
                      }}
                    />
                  )}
                />
              </Box>
              
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Popis
                  </Typography>
                </Box>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Popis úkolu"
                      variant="outlined"
                      error={!!errors.description}
                      helperText={errors.description ? errors.description.message as string : ''}
                      disabled={loading}
                      InputProps={{
                        sx: {
                          bgcolor: '#444',
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.2)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.3)'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ff5722'
                          }
                        }
                      }}
                    />
                  )}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Projekt
                    </Typography>
                  </Box>
                  <Controller
                    name="project"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.project} disabled={loading}>
                        <Select
                          {...field}
                          displayEmpty
                          variant="outlined"
                          sx={{
                            bgcolor: '#444',
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.2)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.3)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#ff5722'
                            },
                            '& .MuiSelect-icon': {
                              color: 'white'
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>Žádný projekt</em>
                          </MenuItem>
                          {projects.map((project) => {
                            // Избегаем отображения объекта Date напрямую
                            return (
                              <MenuItem key={project.id} value={project.id}>
                                {project.name || 'Projekt bez názvu'}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Řešitel
                    </Typography>
                  </Box>
                  <Controller
                    name="assignee"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.assignee} disabled={loading}>
                        <Select
                          {...field}
                          displayEmpty
                          variant="outlined"
                          sx={{
                            bgcolor: '#444',
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.2)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.3)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#ff5722'
                            },
                            '& .MuiSelect-icon': {
                              color: 'white'
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>Žádný řešitel</em>
                          </MenuItem>
                          {users.map((user) => (
                            <MenuItem key={user.uid} value={user.uid}>
                              {user.displayName || user.email}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Priorita *
                    </Typography>
                  </Box>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.priority} disabled={loading} required>
                        <Select
                          {...field}
                          displayEmpty
                          variant="outlined"
                          sx={{
                            bgcolor: '#444',
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.2)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.3)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#ff5722'
                            },
                            '& .MuiSelect-icon': {
                              color: 'white'
                            }
                          }}
                        >
                          <MenuItem value="medium">
                            <Box sx={{ color: '#29b6f6', fontWeight: 'bold' }}>Střední</Box>
                          </MenuItem>
                          <MenuItem value="critical">
                            <Box sx={{ color: '#f44336', fontWeight: 'bold' }}>Kritická</Box>
                          </MenuItem>
                          <MenuItem value="high">
                            <Box sx={{ color: '#ff9800', fontWeight: 'bold' }}>Vysoká</Box>
                          </MenuItem>
                          <MenuItem value="low">
                            <Box sx={{ color: '#4caf50', fontWeight: 'bold' }}>Nízká</Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Status *
                    </Typography>
                  </Box>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.status} disabled={loading} required>
                        <Select
                          {...field}
                          displayEmpty
                          variant="outlined"
                          sx={{
                            bgcolor: '#444',
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.2)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.3)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#ff5722'
                            },
                            '& .MuiSelect-icon': {
                              color: 'white'
                            }
                          }}
                        >
                          <MenuItem value="new">Nový</MenuItem>
                          <MenuItem value="inProgress">V řešení</MenuItem>
                          <MenuItem value="review">Ke kontrole</MenuItem>
                          <MenuItem value="done">Hotovo</MenuItem>
                          <MenuItem value="cancelled">Zrušeno</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>
              </Box>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Termín *
                  </Typography>
                </Box>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={cs}>
                  <Controller
                    name="deadline"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        value={field.value}
                        onChange={(newValue: Date | null) => field.onChange(newValue || new Date())}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.deadline,
                            helperText: errors.deadline ? errors.deadline.message as string : '',
                            required: true,
                            sx: {
                              '& .MuiInputBase-root': {
                                bgcolor: '#444',
                                color: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255,255,255,0.2)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255,255,255,0.3)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#ff5722'
                                }
                              },
                              '& .MuiInputAdornment-root': {
                                color: 'white'
                              },
                              '& .MuiSvgIcon-root': {
                                color: 'white'
                              }
                            }
                          }
                        }}
                        disabled={loading}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Box>
              
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Odhadovaný čas (hodiny)
                  </Typography>
                </Box>
                <Controller
                  name="estimatedTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      variant="outlined"
                      placeholder="Odhadovaný čas"
                      InputProps={{ 
                        inputProps: { min: 0, step: 0.5 },
                        sx: {
                          bgcolor: '#444',
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.2)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.3)'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ff5722'
                          }
                        }
                      }}
                      error={!!errors.estimatedTime}
                      helperText={errors.estimatedTime ? errors.estimatedTime.message as string : ''}
                      disabled={loading}
                    />
                  )}
                />
              </Box>
              
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Progres
                  </Typography>
                </Box>
                <Controller
                  name="progress"
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ px: 2 }}>
                      <Slider
                        {...field}
                        valueLabelDisplay="auto"
                        step={5}
                        marks
                        min={0}
                        max={100}
                        disabled={loading}
                        sx={{
                          color: '#ff5722',
                          '& .MuiSlider-thumb': {
                            backgroundColor: '#ff5722',
                          },
                          '& .MuiSlider-track': {
                            backgroundColor: '#ff5722',
                          },
                          '& .MuiSlider-rail': {
                            backgroundColor: 'rgba(255,255,255,0.3)',
                          },
                          '& .MuiSlider-mark': {
                            backgroundColor: 'rgba(255,255,255,0.3)',
                          },
                          '& .MuiSlider-markActive': {
                            backgroundColor: '#ff5722',
                          }
                        }}
                      />
                    </Box>
                  )}
                />
              </Box>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Tagy
                  </Typography>
                </Box>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      multiple
                      freeSolo
                      options={availableTags}
                      value={field.value}
                      onChange={(_: React.SyntheticEvent, newValue: string[]) => field.onChange(newValue)}
                      renderTags={(value: string[], getTagProps: (props: { index: number }) => any) =>
                        value.map((option: string, index: number) => (
                          <Chip
                            label={option}
                            {...getTagProps({ index })}
                            key={index}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(255,87,34,0.2)',
                              color: 'white',
                              '& .MuiChip-deleteIcon': {
                                color: 'rgba(255,255,255,0.7)',
                                '&:hover': {
                                  color: 'white'
                                }
                              }
                            }}
                          />
                        ))
                      }
                      renderInput={(params: any) => (
                        <TextField
                          {...params}
                          placeholder="Přidat tag"
                          variant="outlined"
                          error={!!errors.tags}
                          helperText={errors.tags ? errors.tags.message as string : ''}
                          sx={{
                            '& .MuiInputBase-root': {
                              bgcolor: '#444',
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.2)'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.3)'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#ff5722'
                              }
                            }
                          }}
                        />
                      )}
                      disabled={loading}
                    />
                  )}
                />
              </Box>
              
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Přílohy
                  </Typography>
                </Box>
                
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 1,
                    p: 2,
                    mb: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: '#ff5722',
                      bgcolor: 'rgba(255,87,34,0.08)'
                    }
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    disabled={loading || files.length >= 10}
                  />
                  <CloudUploadIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.5)', mb: 1 }} />
                  <Typography sx={{ color: 'white' }}>
                    Přetáhněte soubory nebo klikněte pro výběr
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Maximálně 10 souborů (max. 5MB na soubor)
                  </Typography>
                </Box>
                
                {files.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#444', borderColor: 'rgba(255,255,255,0.2)' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                      Vybrané soubory ({files.length}/10)
                    </Typography>
                    
                    {files.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1,
                          borderBottom: index < files.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AttachFileIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.7)' }} />
                          <Box>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 300, color: 'white' }}>
                              {file.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveFile(index)}
                          disabled={loading}
                          sx={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Paper>
                )}
              </Box>
            </Box>
          </TabPanel>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#333', justifyContent: 'flex-end' }}>
          {saveError && (
            <Typography variant="body2" color="error" sx={{ flexGrow: 1 }}>
              {saveError}
            </Typography>
          )}
          <Button 
            onClick={onClose} 
            disabled={loading}
            sx={{ 
              color: '#ff5722', 
              '&:hover': { bgcolor: 'rgba(255,87,34,0.08)' } 
            }}
          >
            Zrušit
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ 
              bgcolor: '#ff5722', 
              '&:hover': { bgcolor: '#e64a19' },
              ml: 1 
            }}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Ukládám...' : 'Uložit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskForm;
