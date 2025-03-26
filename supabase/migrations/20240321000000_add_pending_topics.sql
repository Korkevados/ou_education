-- Create pending_topics table
CREATE TABLE pending_topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    is_main_topic BOOLEAN NOT NULL DEFAULT false,
    parent_topic_id INTEGER REFERENCES main_topics(id),
    material_id INTEGER REFERENCES materials(id) NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Add comment to the table
COMMENT ON TABLE pending_topics IS 'Stores pending topics waiting for approval';

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON pending_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE pending_topics ENABLE ROW LEVEL SECURITY;

-- Policy for inserting new pending topics (authenticated users can create)
CREATE POLICY "Users can create pending topics"
    ON pending_topics FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Policy for viewing pending topics (creators can see their own, admins can see all)
CREATE POLICY "Users can view their own pending topics"
    ON pending_topics FOR SELECT
    TO authenticated
    USING (
        auth.uid() = created_by 
        OR 
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy for updating pending topics (only admins can update)
CREATE POLICY "Admins can update pending topics"
    ON pending_topics FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add indexes
CREATE INDEX idx_pending_topics_status ON pending_topics(status);
CREATE INDEX idx_pending_topics_material_id ON pending_topics(material_id);
CREATE INDEX idx_pending_topics_created_by ON pending_topics(created_by);

-- Add status check constraint
ALTER TABLE pending_topics 
ADD CONSTRAINT check_status 
CHECK (status IN ('pending', 'approved', 'rejected', 'reassigned')); 