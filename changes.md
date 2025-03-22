<!-- @format -->

# Tasks to Complete After Database Schema Changes

## 1. System Infrastructure Adjustments

### 1.1 Database Connection Updates

- [ ] Update database connection functions in relevant `lib` files
- [ ] Create new database tables (run `database_schema.sql` file)
- [ ] Define data transformations from old schema to new schema (if needed)
- [ ] Update Supabase authentication integration to store supabase_id in users table

### 1.2 Data Type Updates

- [ ] Define TypeScript/PropTypes types matching the new table structure
- [ ] Update interfaces for data objects

## 2. User Management Module Updates

### 2.1 Registration and Login Process Updates

- [ ] Modify registration form to include new fields (full name, email, role)
- [ ] Add validation for new fields
- [ ] Update user retrieval and storage process in `app/actions/auth.js` to link Supabase auth users with database users
- [ ] Implement logic to store Supabase auth IDs with user records

### 2.2 User Management Interface Updates

- [ ] Update `UserForm.jsx` component to support new fields
- [ ] Update `UserManagementClient.jsx` component to support display/editing of new data
- [ ] Add support for user types and roles in the interface

### 2.3 User Profile Updates

- [ ] Modify/add user profile page to support new fields
- [ ] Add logic for updating user details with appropriate validation

## 3. Activity Centers Management Module

### 3.1 Create Centers Management Interface

- [ ] Create form component for creating/updating activity centers
- [ ] Create centers management page with view, edit, and delete options
- [ ] Add center manager assignment functionality

### 3.2 Integrate Activity Centers with User Activities

- [ ] Update logic for associating activities with activity centers
- [ ] Update activity display to include center details

## 4. Content Management System

### 4.1 Create Topics and Sub-topics Management Module

- [ ] Create main topics management interface
- [ ] Create sub-topics management interface with links to main topics
- [ ] Create API for retrieving and displaying content by topics

### 4.2 Update Content Management Interface

- [ ] Update/create content creation form
- [ ] Add new fields (estimated activity time, topic, sub-topic)
- [ ] Add multiple target audience selection

### 4.3 Create Content Approval System

- [ ] Create interface for changing content status (approve/reject/return for comments)
- [ ] Create notification page for guides on status changes
- [ ] Create status change history

## 5. Social Features Development

### 5.1 Create Likes System

- [ ] Add like functionality to content
- [ ] Display number of likes
- [ ] Prevent duplicate likes from the same user

### 5.2 Create Comments System

- [ ] Create comments component
- [ ] Add comment content validation (maximum 400 characters)
- [ ] Display comments by content

## 6. Activities Management System

### 6.1 Update Activities Management Interface

- [ ] Update/create activity creation form
- [ ] Add date, start time, and end time fields
- [ ] Add links to activity center and target audiences

### 6.2 Create Content Association Interface for Activities

- [ ] Add option to select multiple content items for an activity
- [ ] Display content items associated with an activity

## 7. User Interface (UI/UX) Updates

### 7.1 Update Shared Components

- [ ] Update `Header.jsx` and `DashboardHeader.jsx` components with new menus
- [ ] Update `DashboardNav.jsx` component to adapt to new modules

### 7.2 Update Main Display Pages

- [ ] Update home page to display content by topics
- [ ] Update `NewContentCarousel.jsx` to display filtered and updated content
- [ ] Create advanced filter displays by target audience, topic, etc.

## 8. Permissions System Update

### 8.1 Define Permissions by User Types

- [ ] Create permission checking mechanism by user type
- [ ] Define limited access by role (system admin, guide, training manager)

### 8.2 Adapt Interface by Permissions

- [ ] Show/hide options in menus based on user permissions
- [ ] Limit editing options by user type

## 9. Testing and Bug Fixes

### 9.1 Input Testing

- [ ] Add input validation for all new fields
- [ ] Verify compatibility with requirements defined in the schema

### 9.2 System Testing

- [ ] Test main workflows (end-to-end)
- [ ] Fix discovered bugs

## 10. System Documentation Update

### 10.1 Update Developer Documentation

- [ ] Update README.md with new structure
- [ ] Document new API

### 10.2 Update User Guides

- [ ] Update user guides by user types
- [ ] Create tutorial videos for new features
