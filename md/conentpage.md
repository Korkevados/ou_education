<!-- @format -->

# Content Upload and Folder Management Functionality

## Overview

This document describes the functionality required for implementing a content upload and folder management system within the OU website.

## Functional Requirements

### General User Functionalities

- **View Folder Structure**: Users can view the folder hierarchy and the files contained in each folder.
- **Upload Content**: Users can upload files to existing folders.

### Admin Functionalities

- **Create Folders**: Admin users (Training Managers or General Managers) can create new folders and name them.
- **Nested Folders**: Admins can create folders within other folders to establish a hierarchical structure.
- **File Management**:
  - Move files between folders.
  - Delete files.
  - Rename files and folders.
- **Folder Actions**:
  - Add new folders using a "+" button.
  - Access folder-specific options via a "three dots" (ellipsis) menu next to each folder.

## Folder Management Screen

The folder management screen should resemble a familiar file management system, similar to Windows File Explorer:

- **Folder Icons**: Each folder is represented by an icon.
- **File Display**: Files within a folder are displayed below the folder hierarchy.
- **Context Menu**: The ellipsis icon next to each folder provides the following options:
  - Add Folder
  - Rename Folder
  - Delete Folder

## Technical Considerations

- **Frontend**:
  - Framework: Next.js (as specified in the technical specification【8†source】).
  - UI Library: Shadcn/ui with Tailwind CSS for styling.
- **Backend**:
  - Database: Supabase to store folder structure and file metadata【8†source】.
  - Authentication: Supabase Auth with role-based permissions for folder and file actions.

## User Roles and Permissions

- **Training Managers**:
  - Create and manage folders and files.
  - Perform all admin-level file and folder actions.
- **General Managers**:
  - Same permissions as Training Managers.
- **Regular Users**:
  - View folder structure.
  - Upload files to permitted folders.

## UI Elements

- **Folder List**:
  - Displays the folder hierarchy.
  - Allows navigation through nested folders.
- **File List**:
  - Displays files within the selected folder.
- **Action Buttons**:
  - "+" for adding new folders.
  - Ellipsis menu for folder-specific actions.

## Future Enhancements

- **Drag and Drop**: Implement drag-and-drop functionality for moving files and folders.
- **File Previews**: Allow previews of certain file types (e.g., images, documents) within the UI.
- **Search**: Enable search functionality to locate files or folders quickly.

## Summary

This functionality aims to provide a seamless and user-friendly experience for managing content and folders, ensuring that both general users and administrators can perform their respective tasks efficiently.
