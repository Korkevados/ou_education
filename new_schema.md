<!-- @format -->

# New Database Structure Documentation

## Database Tables

### 1. Users Table (users)

This table contains all system users, including guides, center managers, and system administrators.

| Column Name | Data Type | Description            | Additional Info                               |
| ----------- | --------- | ---------------------- | --------------------------------------------- |
| id          | UUID      | Unique user identifier | Primary key, auto-generated                   |
| full_name   | TEXT      | Full name              | Required, in Hebrew                           |
| phone       | TEXT      | Phone number           | Required                                      |
| email       | TEXT      | Email address          | Required, unique                              |
| supabase_id | UUID      | Supabase auth user ID  | Required, unique                              |
| user_type   | ENUM      | User type              | Options: 'ADMIN', 'GUIDE', 'TRAINING_MANAGER' |
| center_id   | BIGINT    | Activity center ID     | Foreign key to centers table                  |
| position    | ENUM      | Position               | Options: 'CENTER_MANAGER', 'GUIDE', NULL      |
| is_active   | BOOLEAN   | Whether user is active | Default: true                                 |
| created_at  | TIMESTAMP | Creation date          | Auto-generated                                |
| updated_at  | TIMESTAMP | Last update date       | Auto-updated                                  |

### 2. Activity Centers Table (centers)

This table contains all activity centers in the system.

| Column Name | Data Type | Description              | Additional Info            |
| ----------- | --------- | ------------------------ | -------------------------- |
| id          | BIGINT    | Unique center identifier | Primary key                |
| name        | TEXT      | Center name              | Required                   |
| city        | TEXT      | City                     | Required                   |
| manager_id  | UUID      | Center manager ID        | Foreign key to users table |
| created_at  | TIMESTAMP | Creation date            | Auto-generated             |
| updated_at  | TIMESTAMP | Last update date         | Auto-updated               |

### 3. Main Topics Table (main_topics)

This table contains all main topics for content in the system.

| Column Name | Data Type | Description                  | Additional Info                 |
| ----------- | --------- | ---------------------------- | ------------------------------- |
| id          | BIGINT    | Unique main topic identifier | Primary key                     |
| name        | TEXT      | Topic name                   | Maximum 30 characters, required |
| created_at  | TIMESTAMP | Creation date                | Auto-generated                  |
| updated_at  | TIMESTAMP | Last update date             | Auto-updated                    |

### 4. Sub-topics Table (sub_topics)

This table contains all sub-topics associated with main topics.

| Column Name   | Data Type | Description                 | Additional Info                  |
| ------------- | --------- | --------------------------- | -------------------------------- |
| id            | BIGINT    | Unique sub-topic identifier | Primary key                      |
| main_topic_id | BIGINT    | Main topic ID               | Foreign key to main_topics table |
| name          | TEXT      | Sub-topic name              | Maximum 30 characters, required  |
| created_at    | TIMESTAMP | Creation date               | Auto-generated                   |
| updated_at    | TIMESTAMP | Last update date            | Auto-updated                     |

### 5. Target Audiences Table (target_audiences)

This table contains all possible target audiences.

| Column Name | Data Type | Description                       | Additional Info                                      |
| ----------- | --------- | --------------------------------- | ---------------------------------------------------- |
| id          | BIGINT    | Unique target audience identifier | Primary key                                          |
| grade       | ENUM      | Grade level                       | Options: '7th', '8th', '9th', '10th', '11th', '12th' |
| created_at  | TIMESTAMP | Creation date                     | Auto-generated                                       |

### 6. Materials Table (materials)

This table contains all content materials in the system.

| Column Name    | Data Type | Description                        | Additional Info                  |
| -------------- | --------- | ---------------------------------- | -------------------------------- |
| id             | UUID      | Unique content identifier          | Primary key                      |
| title          | TEXT      | Content title                      | Required                         |
| description    | TEXT      | Detailed content description       | Required                         |
| url            | TEXT      | Content link                       | Required                         |
| main_topic_id  | BIGINT    | Main topic ID                      | Foreign key to main_topics table |
| sub_topic_id   | BIGINT    | Sub-topic ID                       | Foreign key to sub_topics table  |
| creator_id     | UUID      | Content creator ID                 | Foreign key to users table       |
| estimated_time | INTEGER   | Estimated activity time in minutes | Required                         |
| created_at     | TIMESTAMP | Creation date                      | Auto-generated                   |
| updated_at     | TIMESTAMP | Last update date                   | Auto-updated                     |

### 7. Material Statuses Table (material_statuses)

This table records all status changes for content in the system.

| Column Name | Data Type | Description              | Additional Info                                        |
| ----------- | --------- | ------------------------ | ------------------------------------------------------ |
| id          | BIGINT    | Unique status identifier | Primary key                                            |
| material_id | UUID      | Content ID               | Foreign key to materials table                         |
| status      | ENUM      | Current status           | Options: 'PENDING', 'APPROVED', 'RETURNED', 'REJECTED' |
| updated_by  | UUID      | Updating user ID         | Foreign key to users table                             |
| notes       | TEXT      | Status notes             |                                                        |
| created_at  | TIMESTAMP | Creation/update date     | Auto-generated                                         |

### 8. Material-Target Audience Relationship Table (material_target_audiences)

This table connects content with their target audiences (many-to-many relationship).

| Column Name        | Data Type | Description        | Additional Info                                                      |
| ------------------ | --------- | ------------------ | -------------------------------------------------------------------- |
| material_id        | UUID      | Content ID         | Foreign key to materials table, part of composite primary key        |
| target_audience_id | BIGINT    | Target audience ID | Foreign key to target_audiences table, part of composite primary key |

### 9. Likes Table (likes)

This table contains all likes given to content.

| Column Name | Data Type | Description            | Additional Info                |
| ----------- | --------- | ---------------------- | ------------------------------ |
| id          | BIGINT    | Unique like identifier | Primary key                    |
| material_id | UUID      | Content ID             | Foreign key to materials table |
| user_id     | UUID      | User ID                | Foreign key to users table     |
| created_at  | TIMESTAMP | Like date              | Auto-generated                 |

### 10. Comments Table (comments)

This table contains all comments given to content.

| Column Name | Data Type | Description               | Additional Info                  |
| ----------- | --------- | ------------------------- | -------------------------------- |
| id          | BIGINT    | Unique comment identifier | Primary key                      |
| material_id | UUID      | Content ID                | Foreign key to materials table   |
| user_id     | UUID      | Commenting user ID        | Foreign key to users table       |
| content     | TEXT      | Comment content           | Maximum 400 characters, required |
| created_at  | TIMESTAMP | Comment creation date     | Auto-generated                   |
| updated_at  | TIMESTAMP | Comment update date       | Auto-updated                     |

### 11. Activities Table (activities)

This table records all activities performed.

| Column Name   | Data Type | Description                | Additional Info              |
| ------------- | --------- | -------------------------- | ---------------------------- |
| id            | BIGINT    | Unique activity identifier | Primary key                  |
| guide_id      | UUID      | Guide ID                   | Foreign key to users table   |
| center_id     | BIGINT    | Activity center ID         | Foreign key to centers table |
| activity_date | DATE      | Activity date              | Required                     |
| start_time    | TIME      | Activity start time        | Required                     |
| end_time      | TIME      | Activity end time          | Required                     |
| description   | TEXT      | Activity description       |                              |
| created_at    | TIMESTAMP | Record creation date       | Auto-generated               |
| updated_at    | TIMESTAMP | Record update date         | Auto-updated                 |

### 12. Activity-Target Audience Relationship Table (activity_target_audiences)

This table connects activities with their target audiences (many-to-many relationship).

| Column Name        | Data Type | Description        | Additional Info                                                      |
| ------------------ | --------- | ------------------ | -------------------------------------------------------------------- |
| activity_id        | BIGINT    | Activity ID        | Foreign key to activities table, part of composite primary key       |
| target_audience_id | BIGINT    | Target audience ID | Foreign key to target_audiences table, part of composite primary key |

### 13. Activity-Materials Relationship Table (activity_materials)

This table connects activities with the content used in them (many-to-many relationship).

| Column Name | Data Type | Description | Additional Info                                                |
| ----------- | --------- | ----------- | -------------------------------------------------------------- |
| activity_id | BIGINT    | Activity ID | Foreign key to activities table, part of composite primary key |
| material_id | UUID      | Content ID  | Foreign key to materials table, part of composite primary key  |

## Relationships Between Tables

1. A **user (users)** can be associated with one activity center.
2. An **activity center (centers)** can have many associated users and has one manager.
3. A **main topic (main_topics)** can have many sub-topics.
4. A **sub-topic (sub_topics)** belongs to one main topic.
5. A **material (materials)**:
   - Belongs to one main topic and one sub-topic
   - Is created by one user
   - Can be intended for multiple target audiences
   - Can receive multiple likes and comments
   - Can be used in multiple activities
   - Can undergo multiple status changes
6. An **activity (activities)**:
   - Is performed by one guide
   - Takes place at one activity center
   - Can be intended for multiple target audiences
   - Can include multiple content materials

## Special Notes

1. **Passwords**: Store securely (encrypted) and enforce minimum 8 characters including at least one uppercase and one lowercase English letter.
2. **Phone numbers**: Ensure validity of Israeli phone numbers.
3. **User names**: Hebrew only.
4. **Content status**: Maintain change history.
5. **Comments**: Limited to 400 characters.
6. **Topic and sub-topic names**: Limited to 30 characters.
