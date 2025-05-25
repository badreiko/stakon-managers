import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Avatar,
  Chip,
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
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AccessTime as AccessTimeIcon,
  WorkOutline as WorkOutlineIcon,
  LocationOn as LocationOnIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types/user.types';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`team-tabpanel-${index}`}
      aria-labelledby={`team-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `team-tab-${index}`,
    'aria-controls': `team-tabpanel-${index}`,
  };
};

const roleColors: Record<UserRole, string> = {
  admin: '#F44336',
  employee: '#2196F3'
};

const Team: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'employee' as UserRole,
    phoneNumber: '',
    workingHours: {
      start: '09:00',
      end: '17:00',
      workDays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    timezone: 'Europe/Prague',
    department: '',
    position: ''
  });

  // Проверка, есть ли текущий пользователь в списке
  const ensureCurrentUserInList = async (fetchedUsers: User[], currentAuthUser: any) => {
    // Проверяем, есть ли текущий пользователь в списке
    const currentUserInList = fetchedUsers.find(
      user => user.uid === currentAuthUser.uid || user.email.toLowerCase() === currentAuthUser.email?.toLowerCase()
    );
    
    if (!currentUserInList && currentAuthUser.email) {
      console.log('Current user not found in the list, adding...', currentAuthUser);
      
      try {
        // Создаем базовые данные пользователя в Firestore
        const userRef = doc(db, 'users', currentAuthUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Если документ пользователя не существует, создаем его
          const now = new Date();
          await setDoc(userRef, {
            email: currentAuthUser.email,
            displayName: currentAuthUser.displayName || currentAuthUser.email.split('@')[0],
            photoURL: currentAuthUser.photoURL || '',
            role: 'employee', // По умолчанию сотрудник
            position: '',
            department: '',
            phoneNumber: '',
            workingHours: {
              start: '09:00',
              end: '17:00',
              workDays: [1, 2, 3, 4, 5]
            },
            timezone: 'Europe/Prague',
            notificationSettings: {
              email: true,
              inApp: true,
              push: false,
              newTask: true,
              statusChange: true,
              deadlineApproaching: true,
              comments: true,
              mentions: true
            },
            createdAt: now,
            lastActive: now,
            performance: {}
          });
          
          // Получаем обновленные данные пользователя
          const updatedUserDoc = await getDoc(userRef);
          if (updatedUserDoc.exists()) {
            const newUser: User = {
              uid: currentAuthUser.uid,
              email: currentAuthUser.email,
              displayName: currentAuthUser.displayName || currentAuthUser.email.split('@')[0],
              photoURL: currentAuthUser.photoURL || '',
              role: 'employee' as UserRole,
              position: '',
              department: '',
              phoneNumber: '',
              workingHours: {
                start: '09:00',
                end: '17:00',
                workDays: [1, 2, 3, 4, 5]
              },
              timezone: 'Europe/Prague',
              notificationSettings: {
                email: true,
                inApp: true,
                push: false,
                newTask: true,
                statusChange: true,
                deadlineApproaching: true,
                comments: true,
                mentions: true
              },
              createdAt: now,
              lastActive: now,
              performance: {
                tasksCompleted: 0,
                tasksOverdue: 0,
                averageCompletionTime: 0,
                onTimeCompletionRate: 0
              }
            };
            
            // Добавляем пользователя в список
            const updatedUsers: User[] = [...fetchedUsers, newUser];
            return updatedUsers;
          }
        }
      } catch (error) {
        console.error('Error adding current user to the list:', error);
      }
    }
    
    return fetchedUsers;
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        console.log('Fetching users from Firestore...');
        let fetchedUsers = await getUsers();
        console.log('Fetched users:', fetchedUsers);
        
        // Проверяем, есть ли текущий пользователь в списке
        if (currentUser) {
          fetchedUsers = await ensureCurrentUserInList(fetchedUsers, currentUser);
        }
        
        setUsers(fetchedUsers);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        alert(`Chyba při načítání uživatelů: ${error.message || String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle edit user
  const handleEditUser = () => {
    if (!selectedUser) return;
    
    setFormData({
      email: selectedUser.email,
      password: '',
      displayName: selectedUser.displayName,
      role: selectedUser.role,
      phoneNumber: selectedUser.phoneNumber || '',
      workingHours: selectedUser.workingHours || {
        start: '09:00',
        end: '17:00',
        workDays: [1, 2, 3, 4, 5] // Monday to Friday
      },
      timezone: selectedUser.timezone || 'Europe/Prague',
      department: selectedUser.department || '',
      position: selectedUser.position || ''
    });
    
    setUserFormOpen(true);
    handleMenuClose();
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.uid);
      
      // Update the users list in the UI
      setUsers(users.filter(user => user.uid !== selectedUser.uid));
      
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        // Создаем копию объекта, чтобы избежать ошибки с распространением типов
        const parentObj = prev[parent as keyof typeof prev] as Record<string, any>;
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Проверка, есть ли пользователь с таким email в списке
  const findUserByEmail = (email: string) => {
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  };

  // Handle form submit
  const handleFormSubmit = async () => {
    if (!currentUser) return;
    
    setFormLoading(true);
    try {
      if (selectedUser) {
        // Update existing user
        const updatedUser = await updateUser(selectedUser.uid, {
          displayName: formData.displayName,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
          workingHours: {
            start: formData.workingHours.start,
            end: formData.workingHours.end,
            workDays: formData.workingHours.workDays
          },
          timezone: formData.timezone,
          department: formData.department,
          position: formData.position
        });
        
        // Update the user in the UI
        setUsers(users.map(user => 
          user.uid === updatedUser.uid ? updatedUser : user
        ));
        
        console.log('User updated successfully:', updatedUser);
      } else {
        // Проверяем, является ли это текущим авторизованным пользователем
        const isCurrentUser = currentUser.email?.toLowerCase() === formData.email.toLowerCase();
        
        // Проверяем, существует ли пользователь с таким email в списке
        const existingUser = findUserByEmail(formData.email);
        
        if (isCurrentUser || existingUser) {
          // Это текущий пользователь или пользователь с таким email уже существует
          const userId = isCurrentUser ? currentUser.uid : existingUser!.uid;
          
          // Обновляем данные существующего пользователя
          const updatedUser = await updateUser(userId, {
            displayName: formData.displayName,
            role: formData.role,
            phoneNumber: formData.phoneNumber,
            workingHours: {
              start: formData.workingHours.start,
              end: formData.workingHours.end,
              workDays: formData.workingHours.workDays
            },
            timezone: formData.timezone,
            department: formData.department,
            position: formData.position,
            notificationSettings: {
              email: true,
              inApp: true,
              push: false,
              newTask: true,
              statusChange: true,
              deadlineApproaching: true,
              comments: true,
              mentions: true
            }
          });
          
          if (existingUser) {
            // Обновляем пользователя в UI
            setUsers(users.map(user => 
              user.uid === updatedUser.uid ? updatedUser : user
            ));
          } else {
            // Добавляем нового пользователя в UI
            setUsers(prevUsers => [updatedUser, ...prevUsers]);
          }
          
          console.log('User data updated successfully:', updatedUser);
          alert(`Uživatelské údaje byly úspěšně aktualizovány.`);
        } else {
          // Создаем нового пользователя
          const newUser = await createUser(
            formData.email,
            formData.password,
            {
              displayName: formData.displayName,
              role: formData.role,
              phoneNumber: formData.phoneNumber,
              workingHours: {
                start: formData.workingHours.start,
                end: formData.workingHours.end,
                workDays: formData.workingHours.workDays
              },
              timezone: formData.timezone,
              department: formData.department,
              position: formData.position,
              notificationSettings: {
                email: true,
                inApp: true,
                push: false,
                newTask: true,
                statusChange: true,
                deadlineApproaching: true,
                comments: true,
                mentions: true
              }
            }
          );
          
          // Добавляем нового пользователя в UI
          setUsers(prevUsers => [newUser, ...prevUsers]);
          
          console.log('User created successfully:', newUser);
        }
      }
      
      // Close the form
      setUserFormOpen(false);
      setSelectedUser(null);
      
      // Reset the form
      setFormData({
        email: '',
        password: '',
        displayName: '',
        role: 'employee',
        phoneNumber: '',
        workingHours: {
          start: '09:00',
          end: '17:00',
          workDays: [1, 2, 3, 4, 5] // Monday to Friday
        },
        timezone: 'Europe/Prague',
        department: '',
        position: ''
      });
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(`Chyba při ukládání uživatele: ${error.message || String(error)}`);
    } finally {
      setFormLoading(false);
    }
  };
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Filter users by role
  const filterUsersByRole = (role: UserRole | 'all') => {
    if (role === 'all') return users;
    return users.filter(user => user.role === role);
  };
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="team tabs"
          sx={{ mb: 2 }}
        >
          <Tab label={t('team.allMembers')} {...a11yProps(0)} />
          <Tab label={t('team.admins')} {...a11yProps(1)} />
          <Tab label={t('team.employees')} {...a11yProps(2)} />
        </Tabs>
      </Box>
      
      {/* All members tab */}
      <TabPanel value={tabValue} index={0}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Tým
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={() => {
                setSelectedUser(null);
                setUserFormOpen(true);
              }}
            >
              Přidat uživatele
            </Button>
          </Box>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Uživatel</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Pozice</TableCell>
                <TableCell>Oddělení</TableCell>
                <TableCell>Kontakt</TableCell>
                <TableCell>Pracovní doba</TableCell>
                <TableCell>Akce</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                      Načítám uživatele...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <PersonAddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Žádní uživatelé
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Zatím nejsou žádní uživatelé v systému. Přidejte nového uživatele kliknutím na tlačítko "Přidat uživatele".
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filterUsersByRole('all')
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.uid} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={user.photoURL || undefined} 
                            alt={user.displayName}
                            sx={{ width: 40, height: 40, mr: 2 }}
                          >
                            {getInitials(user.displayName)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {user.displayName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role === 'admin' ? 'Administrátor' : 'Zaměstnanec'} 
                          size="small" 
                          sx={{ 
                            bgcolor: `${roleColors[user.role]}20`,
                            color: roleColors[user.role],
                            fontWeight: 500
                          }} 
                        />
                      </TableCell>
                      <TableCell>{user.position || '-'}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2">{user.email}</Typography>
                        </Box>
                        {user.phoneNumber ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                            <Typography variant="body2">{user.phoneNumber}</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
                            <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">Není zadáno</Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2">
                            {user.workingHours?.start || '09:00'} - {user.workingHours?.end || '17:00'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2">{user.timezone || 'Europe/Prague'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          aria-label="Více akcí"
                          onClick={(event: React.MouseEvent<HTMLElement>) => handleMenuOpen(event, user)}
                          size="small"
                          sx={{ color: 'primary.main' }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filterUsersByRole('all').length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Řádků na stránku:"
            labelDisplayedRows={({ from, to, count }: { from: number; to: number; count: number }) => `${from}-${to} z ${count}`}
          />
        </TableContainer>
      </TabPanel>
      
      {/* Admins tab */}
// ...
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filterUsersByRole('admin').length === 0 ? (
            <Typography variant="body1" sx={{ py: 2 }}>
              {t('team.noAdmins')}
            </Typography>
          ) : (
            filterUsersByRole('admin').map(user => (
              <Card key={user.uid} sx={{ width: 300 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      src={user.photoURL || undefined} 
                      alt={user.displayName}
                      sx={{ width: 56, height: 56, mr: 2 }}
                    >
                      {!user.photoURL && getInitials(user.displayName)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        {user.displayName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Chip 
                          label={t(`team.roles.${user.role}`)} 
                          size="small" 
                          sx={{ 
                            bgcolor: `${roleColors[user.role]}20`,
                            color: roleColors[user.role],
                            mt: 0.5
                          }} 
                        />
                      </Box>
                    </Box>
                    {userData?.role === 'admin' && (
                      <IconButton
                        size="small"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleMenuOpen(e, user)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WorkOutlineIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {user.position}
                    </Typography>
                  </Box>
                  
                  {user.department && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {user.department}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {user.workingHours.start} - {user.workingHours.end}
                    </Typography>
                  </Box>
                  
                  {user.phoneNumber && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {user.phoneNumber}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {user.email}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<EmailIcon />}>
                    {t('team.sendEmail')}
                  </Button>
                </CardActions>
              </Card>
            ))
          )}
        </Box>
      </TabPanel>
      
      {/* Employees tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filterUsersByRole('employee').length === 0 ? (
            <Typography variant="body1" sx={{ py: 2 }}>
              {t('team.noEmployees')}
            </Typography>
          ) : (
            filterUsersByRole('employee').map(user => (
              <Card key={user.uid} sx={{ width: 300 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      src={user.photoURL || undefined} 
                      alt={user.displayName}
                      sx={{ width: 56, height: 56, mr: 2 }}
                    >
                      {!user.photoURL && getInitials(user.displayName)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        {user.displayName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Chip 
                          label={t(`team.roles.${user.role}`)} 
                          size="small" 
                          sx={{ 
                            bgcolor: `${roleColors[user.role]}20`,
                            color: roleColors[user.role],
                            mt: 0.5
                          }} 
                        />
                      </Box>
                    </Box>
                    {userData?.role === 'admin' && (
                      <IconButton
                        size="small"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleMenuOpen(e, user)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WorkOutlineIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {user.position}
                    </Typography>
                  </Box>
                  
                  {user.department && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {user.department}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {user.workingHours.start} - {user.workingHours.end}
                    </Typography>
                  </Box>
                  
                  {user.phoneNumber && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {user.phoneNumber}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {user.email}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<EmailIcon />}>
                    {t('team.sendEmail')}
                  </Button>
                </CardActions>
              </Card>
            ))
          )}
        </Box>
      </TabPanel>
      
      {/* User actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditUser}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={handleDeleteUser}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>
      
      {/* User form dialog */}
      <Dialog 
        open={userFormOpen} 
        onClose={() => setUserFormOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedUser ? t('team.editUser') : t('team.addUser')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {!selectedUser && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      name="email"
                      label={t('auth.email')}
                      type="email"
                      fullWidth
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="password"
                      label={t('auth.password')}
                      type="password"
                      fullWidth
                      value={formData.password}
                      onChange={handleFormChange}
                      required
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <TextField
                  name="displayName"
                  label={t('team.displayName')}
                  fullWidth
                  value={formData.displayName}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('team.role')}</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    label={t('team.role')}
                  >
                    <MenuItem value="admin">{t('team.roles.admin')}</MenuItem>
                    <MenuItem value="employee">{t('team.roles.employee')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phoneNumber"
                  label={t('team.phoneNumber')}
                  fullWidth
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="workingHours.start"
                  label={t('team.workingHoursStart')}
                  type="time"
                  fullWidth
                  value={formData.workingHours.start}
                  onChange={handleFormChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="workingHours.end"
                  label={t('team.workingHoursEnd')}
                  type="time"
                  fullWidth
                  value={formData.workingHours.end}
                  onChange={handleFormChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="timezone"
                  label={t('team.timezone')}
                  fullWidth
                  value={formData.timezone}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="department"
                  label={t('team.department')}
                  fullWidth
                  value={formData.department}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="position"
                  label={t('team.position')}
                  fullWidth
                  value={formData.position}
                  onChange={handleFormChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserFormOpen(false)}>
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

export default Team;
