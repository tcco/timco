# Timothy Co's Personal Website Refactor

This project is a personal website featuring "Current" status, a "Blog", and a "Gallery", built with modern web technologies and a focus on maintainability and performance.

## Features

- **Current**: A dynamic section to show what Timothy is currently working on, learning, or interested in. Includes CRUD operations and drag-and-drop reordering.
- **Blog**: A comprehensive blogging platform with support for images, albums, and categorization. Features a robust post editor and draft management.
- **Gallery**: A media storage and display feature for photos and memories. Supports bulk uploads, image previews, and downloads.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **State Management & Data Fetching**: React Query (TanStack Query)
- **Database & Auth**: Firebase Firestore and Firebase Authentication
- **Storage**: Firebase Storage
- **Styling**: Tailwind CSS
- **Testing**: Vitest, React Testing Library
- **UI Components**: Radix UI, Shadcn UI, Phosphor Icons

## Refactoring Overview

The codebase has undergone a significant refactor to improve quality and developer experience:

1.  **Generic API Layer**: Centralized Firestore operations into a generic `firestoreService.ts` for consistent CRUD logic and automatic data sanitization.
2.  **Hook Standardization**: All feature-specific hooks now consistently use `useMutation` and `useQuery` from React Query for robust state management.
3.  **Type Safety**: Introduced comprehensive TypeScript interfaces and removed most `as any` assertions across the codebase.
4.  **Component Decomposition**: Large components (like `PostForm`) have been broken down into smaller, focused sub-components.
5.  **Automated Testing**: Integrated Vitest and wrote initial unit tests for the API layer to ensure stability.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1.  Clone the repository:
    ```bash
    git clone [repository-url]
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up Firebase:
    - Create a `.env` file and add your Firebase configuration.
4.  Run the development server:
    ```bash
    npm run dev
    ```

### Running Tests

```bash
npm run test
```

## Maintenance

- **Adding new features**: Follow the pattern of creating an API service, custom hooks using `useMutation`/`useQuery`, and modularized components.
- **Styling**: Use Tailwind CSS for all new styling to maintain consistency.
