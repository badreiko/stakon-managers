# STAKON Task Management System

## Overview
STAKON is a comprehensive task management system designed for construction teams. It provides a robust platform for managing tasks, projects, team members, and generating reports. The application is built with React, TypeScript, Material-UI, and Firebase, offering a modern and responsive user interface with real-time data synchronization.

## Features

### Authentication
- Email/password login
- Password recovery
- User registration (admin only)
- Automatic logout after 30 days of inactivity

### User Management
- User roles (Administrator, Employee)
- User profiles with avatars, personal information, and settings
- Working hours and timezone settings
- Notification preferences

### Task Management
- Create and edit tasks with detailed information
- Task priorities (Critical, High, Medium, Low)
- Task statuses (New, In Progress, Under Review, Done, Cancelled)
- File attachments
- Comments and mentions
- History tracking

### Task Views
- Kanban board with drag & drop
- List view with sorting and filtering
- Calendar view

### Project Management
- Project creation and management
- Project statistics
- Team assignment
- Archiving completed projects

### Analytics and Reports
- Dashboard with key metrics
- Employee performance reports
- Project progress reports
- Team workload visualization
- Export to CSV/Excel/PDF

### Other Features
- Czech language interface
- Light and dark themes
- Responsive design for all devices
- Real-time notifications
- Global search

## Technology Stack

### Frontend
- React 18 with TypeScript
- Material-UI (MUI) 5+
- React Query for data caching
- React Hook Form for form handling
- React Router for navigation
- React-i18next for localization

### Backend (Firebase)
- Firestore Database
- Firebase Authentication
- Firebase Storage
- Firebase Functions
- Firebase Hosting

### Deployment
- GitHub Actions for CI/CD
- Automatic deployment from main branch
- Preview channels for testing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd stakon-managers
```

2. Install dependencies
```bash
npm install
```

3. Configure Firebase
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, Storage, and Functions
   - Update the `.env` file with your Firebase configuration

4. Start the development server
```bash
npm start
```

### Firebase Setup
1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

2. Login to Firebase
```bash
firebase login
```

3. Initialize Firebase in your project
```bash
firebase init
```

4. Deploy to Firebase
```bash
npm run build
firebase deploy
```

## Project Structure

```
src/
├── assets/           # Static assets like images
├── components/       # Reusable UI components
│   ├── auth/         # Authentication components
│   ├── common/       # Common UI components
│   ├── dashboard/    # Dashboard components
│   ├── layout/       # Layout components (header, sidebar)
│   ├── projects/     # Project-related components
│   ├── reports/      # Report components
│   ├── tasks/        # Task-related components
│   └── team/         # Team management components
├── context/          # React context providers
├── firebase/         # Firebase configuration and services
├── hooks/            # Custom React hooks
├── i18n/             # Internationalization
│   └── locales/      # Translation files
├── pages/            # Main application pages
├── services/         # API and service functions
├── theme/            # Theme configuration
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contact
For any questions or support, please contact [your-email@example.com](mailto:your-email@example.com).
