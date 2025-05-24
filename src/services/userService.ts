import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail,
  deleteUser as firebaseDeleteUser,
  User as FirebaseUser
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase/config';
import { 
  User,
  UserFilter,
  UserSortOption,
  UserListOptions,
  UserNotificationSettings,
  UserWorkingHours
} from '../types/user.types';

const USERS_COLLECTION = 'users';

// Helper to convert Firestore data to User object
const convertToUser = (doc: QueryDocumentSnapshot<DocumentData>): User => {
  const data = doc.data();
  
  return {
    uid: doc.id,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    role: data.role,
    position: data.position,
    department: data.department || '',
    phoneNumber: data.phoneNumber || '',
    workingHours: data.workingHours,
    timezone: data.timezone,
    notificationSettings: data.notificationSettings,
    createdAt: data.createdAt.toDate(),
    lastActive: data.lastActive.toDate(),
    performance: data.performance
  };
};

// Get all users with filtering, sorting, and pagination
export const getUsers = async (options?: UserListOptions): Promise<User[]> => {
  try {
    const collectionRef = collection(db, USERS_COLLECTION);
    let q = collectionRef;
    let queryConstraints = [];

    // Apply filters
    if (options?.filters) {
      const filters = options.filters;
      
      if (filters.role) {
        queryConstraints.push(where('role', '==', filters.role));
      }
      
      if (filters.position) {
        queryConstraints.push(where('position', '==', filters.position));
      }
      
      // Note: text search would require Firestore indexes or a more complex solution
      // like Algolia or Elasticsearch for production apps
    }
    
    // Apply sorting
    if (options?.sort) {
      queryConstraints.push(orderBy(options.sort.field, options.sort.direction));
    } else {
      // Default sorting by displayName asc
      queryConstraints.push(orderBy('displayName', 'asc'));
    }
    
    // Apply pagination
    if (options?.limit) {
      queryConstraints.push(limit(options.limit));
    }
    
    // Create the query with all constraints
    const queryWithConstraints = query(collectionRef, ...queryConstraints);
    
    // Execute the query
    const querySnapshot = await getDocs(queryWithConstraints);
    
    // Convert the documents to User objects
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push(convertToUser(doc));
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

// Get a single user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return convertToUser(userDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Create a new user (admin function)
export const createUser = async (
  email: string, 
  password: string, 
  userData: Omit<User, 'uid' | 'email' | 'createdAt' | 'lastActive' | 'performance'>
): Promise<User> => {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Update the user profile in Firebase Auth
    await updateProfile(firebaseUser, {
      displayName: userData.displayName,
      photoURL: userData.photoURL
    });
    
    // Create the user document in Firestore
    const now = serverTimestamp();
    
    const newUserData = {
      email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      role: userData.role,
      position: userData.position,
      workingHours: userData.workingHours,
      timezone: userData.timezone,
      notificationSettings: userData.notificationSettings,
      createdAt: now,
      lastActive: now
    };
    
    await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), newUserData);
    
    // Get the created user
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Failed to create user');
    }
    
    return convertToUser(userDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update an existing user
export const updateUserProfile = async (
  userId: string, 
  userData: Partial<Omit<User, 'uid' | 'email' | 'createdAt' | 'lastActive' | 'performance'>>
): Promise<User> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    // Update the user document in Firestore
    await updateDoc(userRef, {
      ...userData,
      lastActive: serverTimestamp()
    });
    
    // Get the updated user
    const updatedUserDoc = await getDoc(userRef);
    
    if (!updatedUserDoc.exists()) {
      throw new Error('Failed to update user');
    }
    
    return convertToUser(updatedUserDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Delete a user (admin function)
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // Delete the user document from Firestore
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    
    // Delete the user from Firebase Auth
    // Note: This requires admin SDK in a real application
    // For now, we'll just delete the Firestore document
    // In a real app, you would use Firebase Admin SDK or Cloud Functions
    // to delete the user from Firebase Auth as well
    
    // Example with Admin SDK (in a Cloud Function):
    // await admin.auth().deleteUser(userId);
    
    // For client-side, if the user is deleting their own account:
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === userId) {
      await firebaseDeleteUser(currentUser);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Update user (alias for updateUserProfile for compatibility)
export const updateUser = updateUserProfile;

// Update user notification settings
export const updateNotificationSettings = async (
  userId: string, 
  settings: Partial<UserNotificationSettings>
): Promise<User> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentUser = convertToUser(userDoc as QueryDocumentSnapshot<DocumentData>);
    
    // Update the notification settings
    await updateDoc(userRef, {
      notificationSettings: {
        ...currentUser.notificationSettings,
        ...settings
      },
      lastActive: serverTimestamp()
    });
    
    // Get the updated user
    const updatedUserDoc = await getDoc(userRef);
    
    if (!updatedUserDoc.exists()) {
      throw new Error('Failed to update user');
    }
    
    return convertToUser(updatedUserDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

// Update user working hours
export const updateWorkingHours = async (
  userId: string, 
  workingHours: Partial<UserWorkingHours>
): Promise<User> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentUser = convertToUser(userDoc as QueryDocumentSnapshot<DocumentData>);
    
    // Update the working hours
    await updateDoc(userRef, {
      workingHours: {
        ...currentUser.workingHours,
        ...workingHours
      },
      lastActive: serverTimestamp()
    });
    
    // Get the updated user
    const updatedUserDoc = await getDoc(userRef);
    
    if (!updatedUserDoc.exists()) {
      throw new Error('Failed to update user');
    }
    
    return convertToUser(updatedUserDoc as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error('Error updating working hours:', error);
    throw error;
  }
};

// Upload user avatar
export const uploadUserAvatar = async (
  userId: string, 
  file: File
): Promise<string> => {
  try {
    // Create a storage reference
    const storageRef = ref(storage, `avatars/${userId}/${file.name}`);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update the user profile with the new avatar URL
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      photoURL: downloadURL,
      lastActive: serverTimestamp()
    });
    
    // If this is the current user, update their Firebase Auth profile as well
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === userId) {
      await updateProfile(currentUser, {
        photoURL: downloadURL
      });
    }
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading user avatar:', error);
    throw error;
  }
};

// Reset user password
export const resetUserPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting user password:', error);
    throw error;
  }
};

// Update user last active timestamp
export const updateLastActive = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      lastActive: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating last active timestamp:', error);
    throw error;
  }
};

// Get users by role
export const getUsersByRole = async (role: User['role']): Promise<User[]> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('role', '==', role),
      orderBy('displayName', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push(convertToUser(doc));
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};
