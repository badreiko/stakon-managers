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
  Timestamp,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Project,
  ProjectFilter,
  ProjectSortOption,
  ProjectListOptions,
  ProjectMember,
  ProjectStatistics
} from '../types/project.types';

const PROJECTS_COLLECTION = 'projects';

// Helper to convert Firestore data to Project object
const convertToProject = (doc: QueryDocumentSnapshot<DocumentData>): Project => {
  const data = doc.data();
  
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    status: data.status,
    manager: data.manager,
    members: data.members || [],
    deadline: data.deadline ? data.deadline.toDate() : undefined,
    startDate: data.startDate.toDate(),
    createdBy: data.createdBy,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    tags: data.tags || [],
    statistics: data.statistics || {
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      estimatedTotalHours: 0,
      actualTotalHours: 0
    }
  };
};

// Get all projects with filtering, sorting, and pagination
export const getProjects = async (options?: ProjectListOptions): Promise<Project[]> => {
  try {
    const collectionRef = collection(db, PROJECTS_COLLECTION);
    let q = collectionRef;
    let queryConstraints = [];

    // Apply filters
    if (options?.filters) {
      const filters = options.filters;
      
      if (filters.status && filters.status.length > 0) {
        if (filters.status.length === 1) {
          queryConstraints.push(where('status', '==', filters.status[0]));
        }
      }
      
      if (filters.manager) {
        queryConstraints.push(where('manager', '==', filters.manager));
      }
      
      if (filters.member) {
        queryConstraints.push(where('members', 'array-contains', { userId: filters.member }));
      }
      
      if (filters.tags && filters.tags.length > 0) {
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
    
    // Execute the query
    const querySnapshot = await getDocs(queryWithConstraints);
    
    // Convert the documents to Project objects
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      projects.push(convertToProject(doc));
    });
    
    return projects;
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
};

// Get a single project by ID
export const getProjectById = async (projectId: string): Promise<Project | null> => {
  try {
    const projectDoc = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));
    
    if (!projectDoc.exists()) {
      return null;
    }
    
    return convertToProject(projectDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error getting project by ID:', error);
    throw error;
  }
};

// Create a new project
export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>): Promise<Project> => {
  try {
    const now = serverTimestamp();
    
    const newProjectData = {
      ...projectData,
      createdAt: now,
      updatedAt: now,
      statistics: {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        estimatedTotalHours: 0,
        actualTotalHours: 0
      }
    };
    
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), newProjectData);
    
    // Get the created project
    const projectDoc = await getDoc(docRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Failed to create project');
    }
    
    return convertToProject(projectDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Update an existing project
export const updateProject = async (
  projectId: string, 
  projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>>
): Promise<Project> => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    // Update the project with new data
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: serverTimestamp()
    });
    
    // Get the updated project
    const updatedProjectDoc = await getDoc(projectRef);
    
    if (!updatedProjectDoc.exists()) {
      throw new Error('Failed to update project');
    }
    
    return convertToProject(updatedProjectDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Add a member to a project
export const addProjectMember = async (
  projectId: string, 
  member: Omit<ProjectMember, 'joinedAt'>
): Promise<Project> => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    const newMember: ProjectMember = {
      ...member,
      joinedAt: new Date()
    };
    
    await updateDoc(projectRef, {
      members: arrayUnion(newMember),
      updatedAt: serverTimestamp()
    });
    
    // Get the updated project
    const updatedProjectDoc = await getDoc(projectRef);
    
    if (!updatedProjectDoc.exists()) {
      throw new Error('Failed to update project');
    }
    
    return convertToProject(updatedProjectDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error adding project member:', error);
    throw error;
  }
};

// Remove a member from a project
export const removeProjectMember = async (
  projectId: string, 
  userId: string
): Promise<Project> => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    const project = convertToProject(projectDoc as QueryDocumentSnapshot<DocumentData>);
    const memberToRemove = project.members.find(m => m.userId === userId);
    
    if (!memberToRemove) {
      throw new Error('Member not found in project');
    }
    
    await updateDoc(projectRef, {
      members: arrayRemove(memberToRemove),
      updatedAt: serverTimestamp()
    });
    
    // Get the updated project
    const updatedProjectDoc = await getDoc(projectRef);
    
    if (!updatedProjectDoc.exists()) {
      throw new Error('Failed to update project');
    }
    
    return convertToProject(updatedProjectDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error removing project member:', error);
    throw error;
  }
};

// Update project statistics
export const updateProjectStatistics = async (
  projectId: string, 
  statistics: ProjectStatistics
): Promise<Project> => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    await updateDoc(projectRef, {
      statistics,
      updatedAt: serverTimestamp()
    });
    
    // Get the updated project
    const updatedProjectDoc = await getDoc(projectRef);
    
    if (!updatedProjectDoc.exists()) {
      throw new Error('Failed to update project');
    }
    
    return convertToProject(updatedProjectDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error updating project statistics:', error);
    throw error;
  }
};

// Archive a project
export const archiveProject = async (projectId: string): Promise<Project> => {
  return updateProject(projectId, { status: 'archived' });
};

// Get projects by manager
export const getProjectsByManager = async (managerId: string): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('manager', '==', managerId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      projects.push(convertToProject(doc));
    });
    
    return projects;
  } catch (error) {
    console.error('Error getting projects by manager:', error);
    throw error;
  }
};

// Get active projects
export const getActiveProjects = async (): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      projects.push(convertToProject(doc));
    });
    
    return projects;
  } catch (error) {
    console.error('Error getting active projects:', error);
    throw error;
  }
};
