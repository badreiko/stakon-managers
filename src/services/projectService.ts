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
import { db, auth } from '../firebase/config';
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
  
  // Helper function to safely convert Firestore timestamp to Date
  const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    return new Date();
  };

  const toOptionalDate = (timestamp: any): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    return undefined;
  };
  
  return {
    id: doc.id,
    name: data.name || '',
    description: data.description || '',
    status: data.status || 'active',
    manager: data.manager || '',
    members: data.members || [],
    deadline: toOptionalDate(data.deadline),
    startDate: toDate(data.startDate),
    createdBy: data.createdBy || '',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
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
    console.log('Getting projects from Firestore...');
    
    // Проверяем, авторизован ли пользователь
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('User is not authenticated');
      throw new Error('User is not authenticated');
    }
    
    const collectionRef = collection(db, PROJECTS_COLLECTION);
    let queryConstraints = [];

    // Apply filters
    if (options?.filters) {
      const filters = options.filters;
      
      if (filters.status && filters.status.length > 0) {
        if (filters.status.length === 1) {
          queryConstraints.push(where('status', '==', filters.status[0]));
        }
        // For multiple statuses, we'd need multiple queries and combine results
        // Firebase doesn't support OR queries directly with other conditions
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
      queryConstraints.push(orderBy('createdAt', 'desc'));
    }
    
    // Apply pagination
    if (options?.limit) {
      queryConstraints.push(limit(options.limit));
    }
    
    // Create the query with all constraints
    const queryWithConstraints = queryConstraints.length > 0 
      ? query(collectionRef, ...queryConstraints)
      : query(collectionRef, orderBy('createdAt', 'desc'));
    
    // Execute the query
    const querySnapshot = await getDocs(queryWithConstraints);
    
    // Convert the documents to Project objects
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const project = convertToProject(doc);
        projects.push(project);
      } catch (error) {
        console.error('Error converting project document:', doc.id, error);
      }
    });
    
    console.log(`Found ${projects.length} projects`);
    return projects;
  } catch (error) {
    console.error('Error getting projects:', error);
    throw new Error(`Failed to fetch projects: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Get a single project by ID
export const getProjectById = async (projectId: string): Promise<Project | null> => {
  try {
    console.log('Getting project by ID:', projectId);
    const projectDoc = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));
    
    if (!projectDoc.exists()) {
      console.log('Project not found:', projectId);
      return null;
    }
    
    const project = convertToProject(projectDoc as QueryDocumentSnapshot<DocumentData>);
    console.log('Found project:', project);
    return project;
  } catch (error) {
    console.error('Error getting project by ID:', error);
    throw new Error(`Failed to fetch project: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Create a new project
export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>): Promise<Project> => {
  try {
    console.log('Creating project with data:', projectData);
    
    // Validate required fields
    if (!projectData.name || !projectData.name.trim()) {
      throw new Error('Project name is required');
    }
    
    if (!projectData.createdBy) {
      throw new Error('Created by field is required');
    }
    
    const now = serverTimestamp();
    
    const newProjectData = {
      name: projectData.name.trim(),
      description: projectData.description || '',
      status: projectData.status || 'active',
      manager: projectData.manager || '',
      members: projectData.members || [],
      deadline: projectData.deadline ? Timestamp.fromDate(projectData.deadline) : null,
      startDate: projectData.startDate ? Timestamp.fromDate(projectData.startDate) : now,
      createdBy: projectData.createdBy,
      tags: projectData.tags || [],
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
    
    console.log('Saving project data to Firestore:', newProjectData);
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), newProjectData);
    
    // Get the created project
    const projectDoc = await getDoc(docRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Failed to retrieve created project');
    }
    
    const project = convertToProject(projectDoc as QueryDocumentSnapshot<DocumentData>);
    console.log('Project created successfully:', project);
    return project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error(`Failed to create project: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Update an existing project
export const updateProject = async (
  projectId: string, 
  projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>>
): Promise<Project> => {
  try {
    console.log('Updating project:', projectId, 'with data:', projectData);
    
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    // Prepare update data
    const updateData: any = {
      ...projectData,
      updatedAt: serverTimestamp()
    };
    
    // Convert deadline to Timestamp if provided
    if (projectData.deadline) {
      updateData.deadline = Timestamp.fromDate(projectData.deadline);
    } else if (projectData.deadline === undefined) {
      // Keep existing deadline
      delete updateData.deadline;
    }
    
    // Convert startDate to Timestamp if provided
    if (projectData.startDate) {
      updateData.startDate = Timestamp.fromDate(projectData.startDate);
    }
    
    console.log('Update data prepared:', updateData);
    
    // Update the project with new data
    await updateDoc(projectRef, updateData);
    
    // Get the updated project
    const updatedProjectDoc = await getDoc(projectRef);
    
    if (!updatedProjectDoc.exists()) {
      throw new Error('Failed to retrieve updated project');
    }
    
    const project = convertToProject(updatedProjectDoc as QueryDocumentSnapshot<DocumentData>);
    console.log('Project updated successfully:', project);
    return project;
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error(`Failed to update project: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Delete a project
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    console.log('Deleting project:', projectId);
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
    console.log('Project deleted successfully');
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Add a member to a project
export const addProjectMember = async (
  projectId: string, 
  member: Omit<ProjectMember, 'joinedAt'>
): Promise<Project> => {
  try {
    console.log('Adding member to project:', projectId, member);
    
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
      throw new Error('Failed to retrieve updated project');
    }
    
    const project = convertToProject(updatedProjectDoc as QueryDocumentSnapshot<DocumentData>);
    console.log('Member added successfully');
    return project;
  } catch (error) {
    console.error('Error adding project member:', error);
    throw new Error(`Failed to add project member: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Remove a member from a project
export const removeProjectMember = async (
  projectId: string, 
  userId: string
): Promise<Project> => {
  try {
    console.log('Removing member from project:', projectId, userId);
    
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
      throw new Error('Failed to retrieve updated project');
    }
    
    const updatedProject = convertToProject(updatedProjectDoc as QueryDocumentSnapshot<DocumentData>);
    console.log('Member removed successfully');
    return updatedProject;
  } catch (error) {
    console.error('Error removing project member:', error);
    throw new Error(`Failed to remove project member: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Update project statistics
export const updateProjectStatistics = async (
  projectId: string, 
  statistics: ProjectStatistics
): Promise<Project> => {
  try {
    console.log('Updating project statistics:', projectId, statistics);
    
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
      throw new Error('Failed to retrieve updated project');
    }
    
    const project = convertToProject(updatedProjectDoc as QueryDocumentSnapshot<DocumentData>);
    console.log('Project statistics updated successfully');
    return project;
  } catch (error) {
    console.error('Error updating project statistics:', error);
    throw new Error(`Failed to update project statistics: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Archive a project
export const archiveProject = async (projectId: string): Promise<Project> => {
  try {
    console.log('Archiving project:', projectId);
    return await updateProject(projectId, { status: 'archived' });
  } catch (error) {
    console.error('Error archiving project:', error);
    throw new Error(`Failed to archive project: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Get projects by manager
export const getProjectsByManager = async (managerId: string): Promise<Project[]> => {
  try {
    console.log('Getting projects by manager:', managerId);
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('manager', '==', managerId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        projects.push(convertToProject(doc));
      } catch (error) {
        console.error('Error converting project document:', doc.id, error);
      }
    });
    
    console.log(`Found ${projects.length} projects for manager ${managerId}`);
    return projects;
  } catch (error) {
    console.error('Error getting projects by manager:', error);
    throw new Error(`Failed to get projects by manager: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Get active projects
export const getActiveProjects = async (): Promise<Project[]> => {
  try {
    console.log('Getting active projects');
    
    // Проверяем, авторизован ли пользователь
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('User is not authenticated');
      throw new Error('User is not authenticated');
    }
    
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        projects.push(convertToProject(doc));
      } catch (error) {
        console.error('Error converting project document:', doc.id, error);
      }
    });
    
    console.log(`Found ${projects.length} active projects`);
    return projects;
  } catch (error) {
    console.error('Error getting active projects:', error);
    throw new Error(`Failed to get active projects: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Get all projects without filters (for compatibility)
export const getAllProjects = async (): Promise<Project[]> => {
  try {
    console.log('Getting ALL projects from Firestore...');
    
    // Проверяем, авторизован ли пользователь
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('User is not authenticated');
      throw new Error('User is not authenticated');
    }
    
    const collectionRef = collection(db, PROJECTS_COLLECTION);
    const q = query(collectionRef, orderBy('updatedAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        projects.push(convertToProject(doc));
      } catch (error) {
        console.error('Error converting project document:', doc.id, error);
      }
    });
    
    console.log(`Found ${projects.length} projects in total`);
    return projects;
  } catch (error) {
    console.error('Error getting all projects:', error);
    throw new Error(`Failed to get all projects: ${error instanceof Error ? error.message : String(error)}`);
  }
};