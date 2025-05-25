import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';
import { 
  Task, 
  TaskFilter, 
  TaskSortOption, 
  TaskListOptions,
  TaskComment,
  TaskAttachment,
  TaskHistoryEntry
} from '../types/task.types';

const TASKS_COLLECTION = 'tasks';
const COMMENTS_COLLECTION = 'comments';
const ATTACHMENTS_COLLECTION = 'attachments';
const HISTORY_COLLECTION = 'history';

// Helper to convert Firestore data to Task object
const convertToTask = (doc: QueryDocumentSnapshot<DocumentData>): Task => {
  const data = doc.data();
  
  // Безопасное преобразование Timestamp в Date
  const safeToDate = (timestamp: any) => {
    if (!timestamp) return new Date();
    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      return new Date(timestamp);
    } catch (error) {
      console.error('Error converting timestamp to date:', error);
      return new Date();
    }
  };
  
  return {
    id: doc.id,
    title: data.title || '',
    description: data.description || '',
    assignee: data.assignee || '',
    priority: data.priority || 'medium',
    status: data.status || 'new',
    project: data.project || '',
    deadline: safeToDate(data.deadline),
    estimatedTime: data.estimatedTime || 0,
    tags: data.tags || [],
    attachments: data.attachments || [],
    comments: data.comments || [],
    history: data.history || [],
    createdBy: data.createdBy || '',
    createdAt: safeToDate(data.createdAt),
    updatedAt: safeToDate(data.updatedAt),
    progress: data.progress || 0,
    actualTime: data.actualTime || 0
  };
};

// Get all tasks with filtering, sorting, and pagination
export const getTasks = async (options?: TaskListOptions): Promise<{ tasks: Task[], lastDoc: QueryDocumentSnapshot | null }> => {
  try {
    // Проверка аутентификации
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('User not authenticated');
      return { tasks: [], lastDoc: null };
    }
    
    console.log('Fetching tasks for user:', currentUser.uid);
    
    const collectionRef = collection(db, TASKS_COLLECTION);
    let queryConstraints = [];

    // Apply filters
    if (options?.filters) {
      const filters = options.filters;
      
      if (filters.assignee) {
        queryConstraints.push(where('assignee', '==', filters.assignee));
      }
      
      if (filters.project) {
        queryConstraints.push(where('project', '==', filters.project));
      }
      
      if (filters.status && filters.status.length > 0) {
        // Firebase doesn't support OR queries directly, so for multiple statuses
        // we'd need to make multiple queries and combine results
        if (filters.status.length === 1) {
          queryConstraints.push(where('status', '==', filters.status[0]));
        }
      }
      
      if (filters.priority && filters.priority.length > 0) {
        if (filters.priority.length === 1) {
          queryConstraints.push(where('priority', '==', filters.priority[0]));
        }
      }
      
      if (filters.tags && filters.tags.length > 0) {
        // For tags, we use array-contains-any which can check if the array contains any of the values
        queryConstraints.push(where('tags', 'array-contains-any', filters.tags));
      }
      
      if (filters.deadline) {
        if (filters.deadline.from) {
          queryConstraints.push(where('deadline', '>=', Timestamp.fromDate(filters.deadline.from)));
        }
        if (filters.deadline.to) {
          queryConstraints.push(where('deadline', '<=', Timestamp.fromDate(filters.deadline.to)));
        }
      }
    }
    
    // Apply sorting
    if (options?.sort) {
      queryConstraints.push(orderBy(options.sort.field, options.sort.direction));
    } else {
      // Default sorting by updatedAt desc
      queryConstraints.push(orderBy('updatedAt', 'desc'));
    }
    
    // Apply pagination
    if (options?.limit) {
      queryConstraints.push(limit(options.limit));
    }
    
    // Create the query with all constraints
    const queryWithConstraints = query(collectionRef, ...queryConstraints);
    
    console.log('Executing tasks query...');
    
    // Execute the query
    const querySnapshot = await getDocs(queryWithConstraints);
    
    console.log(`Got ${querySnapshot.size} tasks from Firestore`);
    
    // Convert the documents to Task objects
    const tasks: Task[] = [];
    let lastDoc: QueryDocumentSnapshot | null = null;
    
    querySnapshot.forEach((doc) => {
      try {
        const task = convertToTask(doc);
        tasks.push(task);
        lastDoc = doc;
      } catch (err) {
        console.error(`Error converting task document ${doc.id}:`, err);
      }
    });
    
    console.log(`Successfully converted ${tasks.length} tasks`);
    
    return { tasks, lastDoc };
  } catch (error) {
    console.error('Error getting tasks:', error);
    // Возвращаем пустой массив вместо выбрасывания ошибки
    return { tasks: [], lastDoc: null };
  }
};

// Get a single task by ID
export const getTaskById = async (taskId: string): Promise<Task | null> => {
  try {
    const taskDoc = await getDoc(doc(db, TASKS_COLLECTION, taskId));
    
    if (!taskDoc.exists()) {
      return null;
    }
    
    return convertToTask(taskDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error getting task by ID:', error);
    throw error;
  }
};

// Create a new task
export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'history'>): Promise<Task> => {
  try {
    // Проверка аутентификации
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log('Creating task for user:', currentUser.uid);
    console.log('Task data:', JSON.stringify(taskData, null, 2));
    
    // Убедимся, что deadline правильно преобразуется в Timestamp
    let deadlineTimestamp;
    if (taskData.deadline) {
      if (typeof taskData.deadline === 'object' && 'toDate' in taskData.deadline && typeof taskData.deadline.toDate === 'function') {
        // Это уже Timestamp
        deadlineTimestamp = taskData.deadline;
      } else if (taskData.deadline instanceof Date) {
        deadlineTimestamp = Timestamp.fromDate(taskData.deadline);
      } else if (typeof taskData.deadline === 'string') {
        deadlineTimestamp = Timestamp.fromDate(new Date(taskData.deadline));
      } else {
        // Если не удалось определить тип, используем текущую дату
        console.warn('Unknown deadline type, using current date');
        deadlineTimestamp = Timestamp.fromDate(new Date());
      }
    } else {
      // Если deadline не указан, используем текущую дату
      console.warn('No deadline provided, using current date');
      deadlineTimestamp = Timestamp.fromDate(new Date());
    }
    
    const now = serverTimestamp();
    
    // Создаем новый объект задачи без поля deadline из исходных данных
    const { deadline: _, ...taskDataWithoutDeadline } = taskData;
    
    const newTaskData = {
      ...taskDataWithoutDeadline,
      deadline: deadlineTimestamp,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.uid,
      history: [],
      comments: [],
      attachments: []
    };
    
    console.log('Saving task to Firestore...');
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), newTaskData);
    console.log('Task created with ID:', docRef.id);
    
    // Get the newly created document to return it
    const taskDoc = await getDoc(docRef);
    
    if (!taskDoc.exists()) {
      throw new Error('Failed to create task');
    }
    
    const createdTask = convertToTask(taskDoc as QueryDocumentSnapshot<DocumentData>);
    console.log('Created task:', createdTask);
    
    return createdTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Update an existing task
export const updateTask = async (
  taskId: string, 
  taskData: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'history'>>,
  userId: string
): Promise<Task> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }
    
    const currentTask = convertToTask(taskDoc as QueryDocumentSnapshot<DocumentData>);
    const now = new Date();
    const historyEntries: TaskHistoryEntry[] = [];
    
    // Create history entries for each changed field
    Object.keys(taskData).forEach(key => {
      const field = key as keyof typeof taskData;
      if (taskData[field] !== undefined && taskData[field] !== currentTask[field]) {
        historyEntries.push({
          id: Date.now().toString(), // Simple ID generation
          field,
          oldValue: currentTask[field],
          newValue: taskData[field],
          changedBy: userId,
          changedAt: now
        });
      }
    });
    
    // Update the task with new data and history entries
    await updateDoc(taskRef, {
      ...taskData,
      updatedAt: serverTimestamp(),
      history: [...currentTask.history, ...historyEntries]
    });
    
    // Get the updated task
    const updatedTaskDoc = await getDoc(taskRef);
    
    if (!updatedTaskDoc.exists()) {
      throw new Error('Failed to update task');
    }
    
    return convertToTask(updatedTaskDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Add a comment to a task
export const addComment = async (
  taskId: string, 
  commentData: Omit<TaskComment, 'id' | 'createdAt'>
): Promise<TaskComment> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }
    
    const currentTask = convertToTask(taskDoc as QueryDocumentSnapshot<DocumentData>);
    const now = new Date();
    
    const newComment: TaskComment = {
      id: Date.now().toString(), // Simple ID generation
      ...commentData,
      createdAt: now
    };
    
    await updateDoc(taskRef, {
      comments: [...currentTask.comments, newComment],
      updatedAt: serverTimestamp()
    });
    
    return newComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Add an attachment to a task
export const addAttachment = async (
  taskId: string, 
  attachmentData: Omit<TaskAttachment, 'id' | 'uploadedAt'>
): Promise<TaskAttachment> => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }
    
    const currentTask = convertToTask(taskDoc as QueryDocumentSnapshot<DocumentData>);
    const now = new Date();
    
    const newAttachment: TaskAttachment = {
      id: Date.now().toString(), // Simple ID generation
      ...attachmentData,
      uploadedAt: now
    };
    
    await updateDoc(taskRef, {
      attachments: [...currentTask.attachments, newAttachment],
      updatedAt: serverTimestamp()
    });
    
    return newAttachment;
  } catch (error) {
    console.error('Error adding attachment:', error);
    throw error;
  }
};

// Update task status
export const updateTaskStatus = async (
  taskId: string, 
  status: Task['status'],
  userId: string
): Promise<Task> => {
  return updateTask(taskId, { status }, userId);
};

// Update task assignee
export const updateTaskAssignee = async (
  taskId: string, 
  assignee: string,
  userId: string
): Promise<Task> => {
  return updateTask(taskId, { assignee }, userId);
};

// Update task progress
export const updateTaskProgress = async (
  taskId: string, 
  progress: number,
  userId: string
): Promise<Task> => {
  return updateTask(taskId, { progress }, userId);
};

// Get tasks by assignee
export const getTasksByAssignee = async (assigneeId: string): Promise<Task[]> => {
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('assignee', '==', assigneeId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    
    querySnapshot.forEach((doc) => {
      tasks.push(convertToTask(doc));
    });
    
    return tasks;
  } catch (error) {
    console.error('Error getting tasks by assignee:', error);
    throw error;
  }
};

// Get tasks by project
export const getTasksByProject = async (projectId: string): Promise<Task[]> => {
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('project', '==', projectId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    
    querySnapshot.forEach((doc) => {
      tasks.push(convertToTask(doc));
    });
    
    return tasks;
  } catch (error) {
    console.error('Error getting tasks by project:', error);
    throw error;
  }
};

// Get overdue tasks
export const getOverdueTasks = async (): Promise<Task[]> => {
  try {
    const now = new Date();
    
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('deadline', '<', Timestamp.fromDate(now)),
      where('status', 'in', ['new', 'inProgress', 'review']),
      orderBy('deadline', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    
    querySnapshot.forEach((doc) => {
      tasks.push(convertToTask(doc));
    });
    
    return tasks;
  } catch (error) {
    console.error('Error getting overdue tasks:', error);
    throw error;
  }
};

// Get tasks due today
export const getTasksDueToday = async (): Promise<Task[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('deadline', '>=', Timestamp.fromDate(today)),
      where('deadline', '<', Timestamp.fromDate(tomorrow)),
      where('status', 'in', ['new', 'inProgress', 'review']),
      orderBy('deadline', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    
    querySnapshot.forEach((doc) => {
      tasks.push(convertToTask(doc));
    });
    
    return tasks;
  } catch (error) {
    console.error('Error getting tasks due today:', error);
    throw error;
  }
};
