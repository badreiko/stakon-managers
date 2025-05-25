import { collection, addDoc, Timestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Notification } from '../context/NotificationContext';

/**
 * Создает новое уведомление для пользователя
 */
export const createNotification = async (
  userId: string, 
  title: string, 
  message: string, 
  type: 'task' | 'system' | 'mention' = 'system',
  taskId?: string
): Promise<string> => {
  try {
    const notificationData = {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: Timestamp.now(),
      ...(taskId && { taskId })
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Создает уведомление о новой задаче
 */
export const createTaskNotification = async (
  userId: string,
  taskTitle: string,
  taskId: string
): Promise<string> => {
  return createNotification(
    userId,
    'Nový úkol',
    `Byl vám přiřazen nový úkol: ${taskTitle}`,
    'task',
    taskId
  );
};

/**
 * Создает уведомление об обновлении задачи
 */
export const createTaskUpdateNotification = async (
  userId: string,
  taskTitle: string,
  taskId: string,
  updateType: 'status' | 'deadline' | 'priority'
): Promise<string> => {
  let message = '';
  
  switch (updateType) {
    case 'status':
      message = `Stav úkolu "${taskTitle}" byl změněn`;
      break;
    case 'deadline':
      message = `Termín úkolu "${taskTitle}" byl změněn`;
      break;
    case 'priority':
      message = `Priorita úkolu "${taskTitle}" byla změněna`;
      break;
  }
  
  return createNotification(
    userId,
    'Aktualizace úkolu',
    message,
    'task',
    taskId
  );
};

/**
 * Создает уведомление о приближающемся сроке выполнения задачи
 */
export const createDeadlineNotification = async (
  userId: string,
  taskTitle: string,
  taskId: string,
  daysLeft: number
): Promise<string> => {
  return createNotification(
    userId,
    'Blížící se termín',
    `Úkol "${taskTitle}" má termín za ${daysLeft} ${daysLeft === 1 ? 'den' : daysLeft < 5 ? 'dny' : 'dní'}`,
    'task',
    taskId
  );
};

/**
 * Создает уведомление о упоминании в комментарии
 */
export const createMentionNotification = async (
  userId: string,
  mentionedBy: string,
  taskTitle: string,
  taskId: string
): Promise<string> => {
  return createNotification(
    userId,
    'Zmínka v komentáři',
    `${mentionedBy} vás zmínil v komentáři k úkolu "${taskTitle}"`,
    'mention',
    taskId
  );
};

/**
 * Получает все уведомления пользователя
 */
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        title: data.title,
        message: data.message,
        type: data.type,
        read: data.read,
        createdAt: data.createdAt,
        taskId: data.taskId,
        userId: data.userId
      });
    });
    
    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Отмечает уведомление как прочитанное
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Отмечает все уведомления пользователя как прочитанные
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const batch: Promise<void>[] = [];
    
    querySnapshot.forEach((document) => {
      const notificationRef = doc(db, 'notifications', document.id);
      batch.push(updateDoc(notificationRef, { read: true }));
    });
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};
