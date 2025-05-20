-- Add main_topic_id column to likes table
ALTER TABLE likes ADD COLUMN IF NOT EXISTS main_topic_id BIGINT;

-- Add main_topic_id column to comments table  
ALTER TABLE comments ADD COLUMN IF NOT EXISTS main_topic_id BIGINT;

-- Add foreign key constraint for main_topic_id in likes table
ALTER TABLE likes 
  ADD CONSTRAINT fk_likes_main_topic 
  FOREIGN KEY (main_topic_id) 
  REFERENCES main_topics(id) 
  ON DELETE CASCADE;

-- Add foreign key constraint for main_topic_id in comments table
ALTER TABLE comments 
  ADD CONSTRAINT fk_comments_main_topic 
  FOREIGN KEY (main_topic_id) 
  REFERENCES main_topics(id) 
  ON DELETE CASCADE;

-- Add index for main_topic_id in likes table
CREATE INDEX IF NOT EXISTS idx_likes_main_topic_id ON likes(main_topic_id);

-- Add index for main_topic_id in comments table
CREATE INDEX IF NOT EXISTS idx_comments_main_topic_id ON comments(main_topic_id);

-- Create function to get most liked topics
CREATE OR REPLACE FUNCTION get_most_liked_topics(limit_count integer)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  likes_count BIGINT,
  comments_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.id,
    mt.name,
    mt.created_at,
    mt.updated_at,
    COALESCE(l.like_count, 0) AS likes_count,
    COALESCE(c.comment_count, 0) AS comments_count
  FROM 
    main_topics mt
  LEFT JOIN (
    SELECT 
      main_topic_id, 
      COUNT(*) AS like_count
    FROM 
      likes
    WHERE 
      main_topic_id IS NOT NULL
    GROUP BY 
      main_topic_id
  ) l ON mt.id = l.main_topic_id
  LEFT JOIN (
    SELECT 
      main_topic_id, 
      COUNT(*) AS comment_count
    FROM 
      comments
    WHERE 
      main_topic_id IS NOT NULL
    GROUP BY 
      main_topic_id
  ) c ON mt.id = c.main_topic_id
  ORDER BY 
    likes_count DESC, 
    comments_count DESC
  LIMIT limit_count;
END;
$$;

-- Create function to get most liked materials
CREATE OR REPLACE FUNCTION get_most_liked_materials(limit_count integer)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  url TEXT,
  main_topic_id BIGINT,
  sub_topic_id BIGINT,
  creator_id UUID,
  estimated_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  photo_url TEXT,
  is_approved BOOLEAN,
  likes_count BIGINT,
  comments_count BIGINT,
  main_topic JSONB,
  sub_topic JSONB,
  creator JSONB,
  target_audiences JSONB[]
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.description,
    m.url,
    m.main_topic_id,
    m.sub_topic_id,
    m.creator_id,
    m.estimated_time,
    m.created_at,
    m.updated_at,
    m.photo_url,
    m.is_approved,
    COALESCE(l.like_count, 0) AS likes_count,
    COALESCE(c.comment_count, 0) AS comments_count,
    (SELECT jsonb_build_object(
      'id', mt.id,
      'name', mt.name
    ) FROM main_topics mt WHERE mt.id = m.main_topic_id) AS main_topic,
    (SELECT jsonb_build_object(
      'id', st.id,
      'name', st.name
    ) FROM sub_topics st WHERE st.id = m.sub_topic_id) AS sub_topic,
    (SELECT jsonb_build_object(
      'id', u.id,
      'full_name', u.full_name
    ) FROM users u WHERE u.id = m.creator_id) AS creator,
    ARRAY(
      SELECT jsonb_build_object(
        'id', ta.id,
        'grade', ta.grade
      )
      FROM material_target_audiences mta
      JOIN target_audiences ta ON ta.id = mta.target_audience_id
      WHERE mta.material_id = m.id
    ) AS target_audiences
  FROM 
    materials m
  LEFT JOIN (
    SELECT 
      material_id, 
      COUNT(*) AS like_count
    FROM 
      likes
    WHERE 
      material_id IS NOT NULL
    GROUP BY 
      material_id
  ) l ON m.id = l.material_id
  LEFT JOIN (
    SELECT 
      material_id, 
      COUNT(*) AS comment_count
    FROM 
      comments
    WHERE 
      material_id IS NOT NULL
    GROUP BY 
      material_id
  ) c ON m.id = c.material_id
  WHERE 
    m.is_approved = true
  ORDER BY 
    likes_count DESC, 
    comments_count DESC
  LIMIT limit_count;
END;
$$; 