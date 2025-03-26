-- Function to approve a pending topic
CREATE OR REPLACE FUNCTION approve_pending_topic(p_topic_id INTEGER, p_approved_by UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pending_topic pending_topics;
    v_new_topic_id INTEGER;
BEGIN
    -- Get the pending topic
    SELECT * INTO v_pending_topic
    FROM pending_topics
    WHERE id = p_topic_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending topic not found';
    END IF;

    -- Create the new topic in the appropriate table
    IF v_pending_topic.is_main_topic THEN
        INSERT INTO main_topics (name)
        VALUES (v_pending_topic.name)
        RETURNING id INTO v_new_topic_id;

        -- Update the material with the new main topic
        UPDATE materials
        SET main_topic_id = v_new_topic_id
        WHERE id = v_pending_topic.material_id;
    ELSE
        INSERT INTO sub_topics (name, main_topic_id)
        VALUES (v_pending_topic.name, v_pending_topic.parent_topic_id)
        RETURNING id INTO v_new_topic_id;

        -- Update the material with the new sub topic
        UPDATE materials
        SET sub_topic_id = v_new_topic_id
        WHERE id = v_pending_topic.material_id;
    END IF;

    -- Update the pending topic status
    UPDATE pending_topics
    SET status = 'approved',
        approved_by = p_approved_by,
        approved_at = NOW()
    WHERE id = p_topic_id;
END;
$$;

-- Function to reassign a topic
CREATE OR REPLACE FUNCTION reassign_topic(
    p_pending_topic_id INTEGER,
    p_new_topic_id INTEGER,
    p_is_main_topic BOOLEAN,
    p_approved_by UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pending_topic pending_topics;
BEGIN
    -- Get the pending topic
    SELECT * INTO v_pending_topic
    FROM pending_topics
    WHERE id = p_pending_topic_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending topic not found';
    END IF;

    -- Update the material with the new topic
    IF p_is_main_topic THEN
        UPDATE materials
        SET main_topic_id = p_new_topic_id
        WHERE id = v_pending_topic.material_id;
    ELSE
        UPDATE materials
        SET sub_topic_id = p_new_topic_id
        WHERE id = v_pending_topic.material_id;
    END IF;

    -- Update the pending topic status
    UPDATE pending_topics
    SET status = 'reassigned',
        approved_by = p_approved_by,
        approved_at = NOW()
    WHERE id = p_pending_topic_id;
END;
$$; 