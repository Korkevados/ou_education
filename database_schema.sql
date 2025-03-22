-- OU Israel Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_type AS ENUM ('ADMIN', 'GUIDE', 'TRAINING_MANAGER');
CREATE TYPE user_position AS ENUM ('CENTER_MANAGER', 'GUIDE');
CREATE TYPE material_status AS ENUM ('PENDING', 'APPROVED', 'RETURNED', 'REJECTED');
CREATE TYPE grade_level AS ENUM ('ז', 'ח', 'ט', 'י', 'יא', 'יב');

-- 1. Create centers table
CREATE TABLE centers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    manager_id UUID NULL, -- Will be updated after users table creation
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL CHECK (full_name ~ '^[\u0590-\u05FF\s]+$'), -- Hebrew characters only
    phone TEXT NOT NULL CHECK (phone ~ '^\+?(972|0)(\-)?([1-9]\d{1})(\-)?(\d{3})(\-)?(\d{4})$'), -- Israeli phone format
    email TEXT NOT NULL UNIQUE CHECK (email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'),
    supabase_id UUID NOT NULL UNIQUE, -- Supabase auth user ID
    user_type user_type NOT NULL,
    center_id BIGINT REFERENCES centers(id),
    position user_position,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_position_check CHECK (
        (position IS NULL AND user_type != 'GUIDE') OR
        (position IS NOT NULL AND user_type = 'GUIDE')
    )
);

-- Add foreign key to centers table for manager_id
ALTER TABLE centers ADD CONSTRAINT fk_center_manager
    FOREIGN KEY (manager_id) REFERENCES users(id);

-- 3. Create main_topics table
CREATE TABLE main_topics (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL CHECK (LENGTH(name) <= 30),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Create sub_topics table
CREATE TABLE sub_topics (
    id BIGSERIAL PRIMARY KEY,
    main_topic_id BIGINT NOT NULL REFERENCES main_topics(id),
    name TEXT NOT NULL CHECK (LENGTH(name) <= 30),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Create target_audiences table (grade levels)
CREATE TABLE target_audiences (
    id BIGSERIAL PRIMARY KEY,
    grade grade_level NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Create materials table
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL,
    main_topic_id BIGINT NOT NULL REFERENCES main_topics(id),
    sub_topic_id BIGINT NOT NULL REFERENCES sub_topics(id),
    creator_id UUID NOT NULL REFERENCES users(id),
    estimated_time INTEGER NOT NULL CHECK (estimated_time > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sub_topic_main_topic CHECK (
        sub_topic_id IN (SELECT id FROM sub_topics WHERE main_topic_id = materials.main_topic_id)
    )
);

-- 7. Create material_statuses table
CREATE TABLE material_statuses (
    id BIGSERIAL PRIMARY KEY,
    material_id UUID NOT NULL REFERENCES materials(id),
    status material_status NOT NULL,
    updated_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Create material_target_audiences table (many-to-many)
CREATE TABLE material_target_audiences (
    material_id UUID NOT NULL REFERENCES materials(id),
    target_audience_id BIGINT NOT NULL REFERENCES target_audiences(id),
    PRIMARY KEY (material_id, target_audience_id)
);

-- 9. Create likes table
CREATE TABLE likes (
    id BIGSERIAL PRIMARY KEY,
    material_id UUID NOT NULL REFERENCES materials(id),
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (material_id, user_id)
);

-- 10. Create comments table
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    material_id UUID NOT NULL REFERENCES materials(id),
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL CHECK (LENGTH(content) <= 400),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 11. Create activities table
CREATE TABLE activities (
    id BIGSERIAL PRIMARY KEY,
    guide_id UUID NOT NULL REFERENCES users(id),
    center_id BIGINT NOT NULL REFERENCES centers(id),
    activity_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_period CHECK (start_time < end_time),
    CONSTRAINT guide_check CHECK (
        guide_id IN (SELECT id FROM users WHERE user_type = 'GUIDE')
    )
);

-- 12. Create activity_target_audiences table (many-to-many)
CREATE TABLE activity_target_audiences (
    activity_id BIGINT NOT NULL REFERENCES activities(id),
    target_audience_id BIGINT NOT NULL REFERENCES target_audiences(id),
    PRIMARY KEY (activity_id, target_audience_id)
);

-- 13. Create activity_materials table (many-to-many)
CREATE TABLE activity_materials (
    activity_id BIGINT NOT NULL REFERENCES activities(id),
    material_id UUID NOT NULL REFERENCES materials(id),
    PRIMARY KEY (activity_id, material_id)
);

-- Insert default target audiences (grades)
INSERT INTO target_audiences (grade) VALUES 
('7th'), ('8th'), ('9th'), ('10th'), ('11th'), ('12th');

-- Create initial system admin user (add this once you have the initial system admin details)
-- INSERT INTO users (full_name, phone, email, supabase_id, user_type)
-- VALUES ('System Admin', '+97212345678', 'admin@example.com', 'SUPABASE_AUTH_ID_HERE', 'ADMIN');

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_centers_modtime
    BEFORE UPDATE ON centers
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_main_topics_modtime
    BEFORE UPDATE ON main_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_sub_topics_modtime
    BEFORE UPDATE ON sub_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_materials_modtime
    BEFORE UPDATE ON materials
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_comments_modtime
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_activities_modtime
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Create indexes for better performance
CREATE INDEX idx_users_center_id ON users(center_id);
CREATE INDEX idx_users_supabase_id ON users(supabase_id);
CREATE INDEX idx_sub_topics_main_topic_id ON sub_topics(main_topic_id);
CREATE INDEX idx_materials_main_topic_id ON materials(main_topic_id);
CREATE INDEX idx_materials_sub_topic_id ON materials(sub_topic_id);
CREATE INDEX idx_materials_creator_id ON materials(creator_id);
CREATE INDEX idx_material_statuses_material_id ON material_statuses(material_id);
CREATE INDEX idx_likes_material_id ON likes(material_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_comments_material_id ON comments(material_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_activities_guide_id ON activities(guide_id);
CREATE INDEX idx_activities_center_id ON activities(center_id); 