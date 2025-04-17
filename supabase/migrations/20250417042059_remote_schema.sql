

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."grade_level" AS ENUM (
    'ז',
    'ח',
    'ט',
    'י',
    'יא',
    'יב'
);


ALTER TYPE "public"."grade_level" OWNER TO "postgres";


CREATE TYPE "public"."material_status" AS ENUM (
    'PENDING',
    'APPROVED',
    'RETURNED',
    'REJECTED'
);


ALTER TYPE "public"."material_status" OWNER TO "postgres";


CREATE TYPE "public"."user_position" AS ENUM (
    'CENTER_MANAGER',
    'GUIDE'
);


ALTER TYPE "public"."user_position" OWNER TO "postgres";


CREATE TYPE "public"."user_type" AS ENUM (
    'ADMIN',
    'GUIDE',
    'TRAINING_MANAGER'
);


ALTER TYPE "public"."user_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_pending_topic"("p_topic_id" integer, "p_approved_by" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."approve_pending_topic"("p_topic_id" integer, "p_approved_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reassign_topic"("p_pending_topic_id" integer, "p_new_topic_id" integer, "p_is_main_topic" boolean, "p_approved_by" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."reassign_topic"("p_pending_topic_id" integer, "p_new_topic_id" integer, "p_is_main_topic" boolean, "p_approved_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_guide_user_type"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = NEW.guide_id AND user_type = 'GUIDE'
  ) THEN
    RAISE EXCEPTION '⚠️ guide_id % is not a user with type ''GUIDE''', NEW.guide_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_guide_user_type"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_sub_topic_main_topic"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sub_topics 
    WHERE id = NEW.sub_topic_id AND main_topic_id = NEW.main_topic_id
  ) THEN
    RAISE EXCEPTION '⚠️ sub_topic_id % does not belong to main_topic_id %', NEW.sub_topic_id, NEW.main_topic_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_sub_topic_main_topic"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" bigint NOT NULL,
    "guide_id" "uuid" NOT NULL,
    "center_id" bigint NOT NULL,
    "activity_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_time_period" CHECK (("start_time" < "end_time"))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."activities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."activities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."activities_id_seq" OWNED BY "public"."activities"."id";



CREATE TABLE IF NOT EXISTS "public"."activity_materials" (
    "activity_id" bigint NOT NULL,
    "material_id" "uuid" NOT NULL
);


ALTER TABLE "public"."activity_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_target_audiences" (
    "activity_id" bigint NOT NULL,
    "target_audience_id" bigint NOT NULL
);


ALTER TABLE "public"."activity_target_audiences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."centers" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "city" "text" NOT NULL,
    "manager_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."centers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."centers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."centers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."centers_id_seq" OWNED BY "public"."centers"."id";



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" bigint NOT NULL,
    "material_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comments_content_check" CHECK (("length"("content") <= 400))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."comments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."comments_id_seq" OWNED BY "public"."comments"."id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text" NOT NULL,
    "supabase_id" "uuid" NOT NULL,
    "user_type" "public"."user_type" NOT NULL,
    "center_id" bigint,
    "position" "public"."user_position",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "users_email_check" CHECK (("email" ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'::"text")),
    CONSTRAINT "users_full_name_check" CHECK (("full_name" ~ '^[\u0590-\u05FF\s]+$'::"text")),
    CONSTRAINT "users_phone_check" CHECK (("phone" ~ '^\+?(972|0)(\-)?([1-9]\d{1})(\-)?(\d{3})(\-)?(\d{4})$'::"text")),
    CONSTRAINT "valid_position_check" CHECK (((("position" IS NULL) AND ("user_type" <> 'GUIDE'::"public"."user_type")) OR (("position" IS NOT NULL) AND ("user_type" = 'GUIDE'::"public"."user_type"))))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."current_user_info" AS
 SELECT "users"."supabase_id",
    "users"."user_type"
   FROM "public"."users"
  WHERE ("users"."supabase_id" = "auth"."uid"());


ALTER TABLE "public"."current_user_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" bigint NOT NULL,
    "material_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."likes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."likes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."likes_id_seq" OWNED BY "public"."likes"."id";



CREATE TABLE IF NOT EXISTS "public"."main_topics" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "main_topics_name_check" CHECK (("length"("name") <= 30))
);


ALTER TABLE "public"."main_topics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."main_topics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."main_topics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."main_topics_id_seq" OWNED BY "public"."main_topics"."id";



CREATE TABLE IF NOT EXISTS "public"."material_statuses" (
    "id" bigint NOT NULL,
    "material_id" "uuid" NOT NULL,
    "status" "public"."material_status" NOT NULL,
    "updated_by" "uuid" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."material_statuses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."material_statuses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."material_statuses_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."material_statuses_id_seq" OWNED BY "public"."material_statuses"."id";



CREATE TABLE IF NOT EXISTS "public"."material_target_audiences" (
    "material_id" "uuid" NOT NULL,
    "target_audience_id" bigint NOT NULL
);


ALTER TABLE "public"."material_target_audiences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."materials" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "url" "text" NOT NULL,
    "main_topic_id" bigint,
    "sub_topic_id" bigint,
    "creator_id" "uuid" NOT NULL,
    "estimated_time" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "photo_url" "text",
    "is_approved" boolean DEFAULT false,
    CONSTRAINT "materials_estimated_time_check" CHECK (("estimated_time" > 0))
);


ALTER TABLE "public"."materials" OWNER TO "postgres";


COMMENT ON COLUMN "public"."materials"."is_approved" IS 'notify if the material approved or not"';



CREATE TABLE IF NOT EXISTS "public"."pending_topics" (
    "id" integer NOT NULL,
    "name" character varying NOT NULL,
    "is_main_topic" boolean DEFAULT false NOT NULL,
    "parent_topic_id" integer,
    "material_id" "uuid" NOT NULL,
    "status" character varying DEFAULT 'pending'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "check_status" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'reassigned'::character varying])::"text"[])))
);


ALTER TABLE "public"."pending_topics" OWNER TO "postgres";


COMMENT ON TABLE "public"."pending_topics" IS 'Stores pending topics waiting for approval';



CREATE SEQUENCE IF NOT EXISTS "public"."pending_topics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."pending_topics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pending_topics_id_seq" OWNED BY "public"."pending_topics"."id";



CREATE TABLE IF NOT EXISTS "public"."sub_topics" (
    "id" bigint NOT NULL,
    "main_topic_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sub_topics_name_check" CHECK (("length"("name") <= 30))
);


ALTER TABLE "public"."sub_topics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sub_topics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."sub_topics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sub_topics_id_seq" OWNED BY "public"."sub_topics"."id";



CREATE TABLE IF NOT EXISTS "public"."target_audiences" (
    "id" bigint NOT NULL,
    "grade" "public"."grade_level" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."target_audiences" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."target_audiences_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."target_audiences_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."target_audiences_id_seq" OWNED BY "public"."target_audiences"."id";



ALTER TABLE ONLY "public"."activities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."activities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."centers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."centers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."comments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."comments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."likes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."likes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."main_topics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."main_topics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."material_statuses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."material_statuses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."pending_topics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pending_topics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sub_topics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sub_topics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."target_audiences" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."target_audiences_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_materials"
    ADD CONSTRAINT "activity_materials_pkey" PRIMARY KEY ("activity_id", "material_id");



ALTER TABLE ONLY "public"."activity_target_audiences"
    ADD CONSTRAINT "activity_target_audiences_pkey" PRIMARY KEY ("activity_id", "target_audience_id");



ALTER TABLE ONLY "public"."centers"
    ADD CONSTRAINT "centers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_material_id_user_id_key" UNIQUE ("material_id", "user_id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."main_topics"
    ADD CONSTRAINT "main_topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."material_statuses"
    ADD CONSTRAINT "material_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."material_target_audiences"
    ADD CONSTRAINT "material_target_audiences_pkey" PRIMARY KEY ("material_id", "target_audience_id");



ALTER TABLE ONLY "public"."materials"
    ADD CONSTRAINT "materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pending_topics"
    ADD CONSTRAINT "pending_topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sub_topics"
    ADD CONSTRAINT "sub_topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."target_audiences"
    ADD CONSTRAINT "target_audiences_grade_key" UNIQUE ("grade");



ALTER TABLE ONLY "public"."target_audiences"
    ADD CONSTRAINT "target_audiences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_supabase_id_key" UNIQUE ("supabase_id");



CREATE INDEX "idx_activities_center_id" ON "public"."activities" USING "btree" ("center_id");



CREATE INDEX "idx_activities_guide_id" ON "public"."activities" USING "btree" ("guide_id");



CREATE INDEX "idx_comments_material_id" ON "public"."comments" USING "btree" ("material_id");



CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_likes_material_id" ON "public"."likes" USING "btree" ("material_id");



CREATE INDEX "idx_likes_user_id" ON "public"."likes" USING "btree" ("user_id");



CREATE INDEX "idx_material_statuses_material_id" ON "public"."material_statuses" USING "btree" ("material_id");



CREATE INDEX "idx_materials_creator_id" ON "public"."materials" USING "btree" ("creator_id");



CREATE INDEX "idx_materials_main_topic_id" ON "public"."materials" USING "btree" ("main_topic_id");



CREATE INDEX "idx_materials_sub_topic_id" ON "public"."materials" USING "btree" ("sub_topic_id");



CREATE INDEX "idx_pending_topics_created_by" ON "public"."pending_topics" USING "btree" ("created_by");



CREATE INDEX "idx_pending_topics_material_id" ON "public"."pending_topics" USING "btree" ("material_id");



CREATE INDEX "idx_pending_topics_status" ON "public"."pending_topics" USING "btree" ("status");



CREATE INDEX "idx_sub_topics_main_topic_id" ON "public"."sub_topics" USING "btree" ("main_topic_id");



CREATE INDEX "idx_users_center_id" ON "public"."users" USING "btree" ("center_id");



CREATE INDEX "idx_users_supabase_id" ON "public"."users" USING "btree" ("supabase_id");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."pending_topics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_validate_guide_user_type" BEFORE INSERT OR UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."validate_guide_user_type"();



CREATE OR REPLACE TRIGGER "update_activities_modtime" BEFORE UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_centers_modtime" BEFORE UPDATE ON "public"."centers" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_comments_modtime" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_main_topics_modtime" BEFORE UPDATE ON "public"."main_topics" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_materials_modtime" BEFORE UPDATE ON "public"."materials" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_sub_topics_modtime" BEFORE UPDATE ON "public"."sub_topics" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_users_modtime" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."activity_materials"
    ADD CONSTRAINT "activity_materials_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id");



ALTER TABLE ONLY "public"."activity_materials"
    ADD CONSTRAINT "activity_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id");



ALTER TABLE ONLY "public"."activity_target_audiences"
    ADD CONSTRAINT "activity_target_audiences_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id");



ALTER TABLE ONLY "public"."activity_target_audiences"
    ADD CONSTRAINT "activity_target_audiences_target_audience_id_fkey" FOREIGN KEY ("target_audience_id") REFERENCES "public"."target_audiences"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."centers"
    ADD CONSTRAINT "fk_center_manager" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."material_statuses"
    ADD CONSTRAINT "material_statuses_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id");



ALTER TABLE ONLY "public"."material_statuses"
    ADD CONSTRAINT "material_statuses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."material_target_audiences"
    ADD CONSTRAINT "material_target_audiences_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id");



ALTER TABLE ONLY "public"."material_target_audiences"
    ADD CONSTRAINT "material_target_audiences_target_audience_id_fkey" FOREIGN KEY ("target_audience_id") REFERENCES "public"."target_audiences"("id");



ALTER TABLE ONLY "public"."materials"
    ADD CONSTRAINT "materials_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("supabase_id");



ALTER TABLE ONLY "public"."materials"
    ADD CONSTRAINT "materials_main_topic_id_fkey" FOREIGN KEY ("main_topic_id") REFERENCES "public"."main_topics"("id");



ALTER TABLE ONLY "public"."materials"
    ADD CONSTRAINT "materials_sub_topic_id_fkey" FOREIGN KEY ("sub_topic_id") REFERENCES "public"."sub_topics"("id");



ALTER TABLE ONLY "public"."pending_topics"
    ADD CONSTRAINT "pending_topics_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("supabase_id");



ALTER TABLE ONLY "public"."pending_topics"
    ADD CONSTRAINT "pending_topics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("supabase_id");



ALTER TABLE ONLY "public"."pending_topics"
    ADD CONSTRAINT "pending_topics_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id");



ALTER TABLE ONLY "public"."pending_topics"
    ADD CONSTRAINT "pending_topics_parent_topic_id_fkey" FOREIGN KEY ("parent_topic_id") REFERENCES "public"."main_topics"("id");



ALTER TABLE ONLY "public"."sub_topics"
    ADD CONSTRAINT "sub_topics_main_topic_id_fkey" FOREIGN KEY ("main_topic_id") REFERENCES "public"."main_topics"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id");



CREATE POLICY "Admins and managers can read all users" ON "public"."users" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."current_user_info"
  WHERE ("current_user_info"."user_type" = ANY (ARRAY['ADMIN'::"public"."user_type", 'TRAINING_MANAGER'::"public"."user_type"])))));



CREATE POLICY "Admins can update pending topics" ON "public"."pending_topics" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."supabase_id" = "auth"."uid"()) AND ("users"."user_type" = 'ADMIN'::"public"."user_type"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."supabase_id" = "auth"."uid"()) AND ("users"."user_type" = 'ADMIN'::"public"."user_type")))));



CREATE POLICY "Allow delete by creator or admin/training_manager" ON "public"."materials" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."supabase_id" = "auth"."uid"()) AND (("users"."id" = "materials"."creator_id") OR ("users"."user_type" = ANY (ARRAY['ADMIN'::"public"."user_type", 'TRAINING_MANAGER'::"public"."user_type"])))))));



CREATE POLICY "Allow select for admins and training managers" ON "public"."pending_topics" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."supabase_id" = "auth"."uid"()) AND ("users"."user_type" = ANY (ARRAY['ADMIN'::"public"."user_type", 'TRAINING_MANAGER'::"public"."user_type"]))))));



CREATE POLICY "Allow update by creator or admin/training_manager" ON "public"."materials" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."supabase_id" = "auth"."uid"()) AND (("users"."id" = "materials"."creator_id") OR ("users"."user_type" = ANY (ARRAY['ADMIN'::"public"."user_type", 'TRAINING_MANAGER'::"public"."user_type"]))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."supabase_id" = "auth"."uid"()) AND (("users"."id" = "materials"."creator_id") OR ("users"."user_type" = ANY (ARRAY['ADMIN'::"public"."user_type", 'TRAINING_MANAGER'::"public"."user_type"])))))));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."centers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."centers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."main_topics" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."target_audiences" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable select for users based on email" ON "public"."users" FOR SELECT USING (((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text") = "email"));



CREATE POLICY "Enable update for users based on email" ON "public"."users" FOR UPDATE USING (((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text") = "email")) WITH CHECK (((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text") = "email"));



CREATE POLICY "Users can create pending topics" ON "public"."pending_topics" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can insert their own materials" ON "public"."materials" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can view all materials" ON "public"."materials" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."centers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."main_topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."material_statuses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "material_statuses_delete_policy" ON "public"."material_statuses" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."supabase_id" = "auth"."uid"()) AND ("users"."user_type" = ANY (ARRAY['ADMIN'::"public"."user_type", 'TRAINING_MANAGER'::"public"."user_type"]))))));



CREATE POLICY "material_statuses_insert_policy" ON "public"."material_statuses" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "material_statuses_select_policy" ON "public"."material_statuses" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "material_statuses_update_policy" ON "public"."material_statuses" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."supabase_id" = "auth"."uid"()) AND ("users"."user_type" = ANY (ARRAY['ADMIN'::"public"."user_type", 'TRAINING_MANAGER'::"public"."user_type"]))))));



ALTER TABLE "public"."materials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pending_topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."target_audiences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."approve_pending_topic"("p_topic_id" integer, "p_approved_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_pending_topic"("p_topic_id" integer, "p_approved_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_pending_topic"("p_topic_id" integer, "p_approved_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reassign_topic"("p_pending_topic_id" integer, "p_new_topic_id" integer, "p_is_main_topic" boolean, "p_approved_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reassign_topic"("p_pending_topic_id" integer, "p_new_topic_id" integer, "p_is_main_topic" boolean, "p_approved_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reassign_topic"("p_pending_topic_id" integer, "p_new_topic_id" integer, "p_is_main_topic" boolean, "p_approved_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_guide_user_type"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_guide_user_type"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_guide_user_type"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_sub_topic_main_topic"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_sub_topic_main_topic"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_sub_topic_main_topic"() TO "service_role";


















GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."activities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."activities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."activities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."activity_materials" TO "anon";
GRANT ALL ON TABLE "public"."activity_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_materials" TO "service_role";



GRANT ALL ON TABLE "public"."activity_target_audiences" TO "anon";
GRANT ALL ON TABLE "public"."activity_target_audiences" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_target_audiences" TO "service_role";



GRANT ALL ON TABLE "public"."centers" TO "anon";
GRANT ALL ON TABLE "public"."centers" TO "authenticated";
GRANT ALL ON TABLE "public"."centers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."centers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."centers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."centers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."current_user_info" TO "anon";
GRANT ALL ON TABLE "public"."current_user_info" TO "authenticated";
GRANT ALL ON TABLE "public"."current_user_info" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."likes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."likes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."likes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."main_topics" TO "anon";
GRANT ALL ON TABLE "public"."main_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."main_topics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."main_topics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."main_topics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."main_topics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."material_statuses" TO "anon";
GRANT ALL ON TABLE "public"."material_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."material_statuses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."material_statuses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."material_statuses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."material_statuses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."material_target_audiences" TO "anon";
GRANT ALL ON TABLE "public"."material_target_audiences" TO "authenticated";
GRANT ALL ON TABLE "public"."material_target_audiences" TO "service_role";



GRANT ALL ON TABLE "public"."materials" TO "anon";
GRANT ALL ON TABLE "public"."materials" TO "authenticated";
GRANT ALL ON TABLE "public"."materials" TO "service_role";



GRANT ALL ON TABLE "public"."pending_topics" TO "anon";
GRANT ALL ON TABLE "public"."pending_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."pending_topics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pending_topics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pending_topics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pending_topics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sub_topics" TO "anon";
GRANT ALL ON TABLE "public"."sub_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."sub_topics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sub_topics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sub_topics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sub_topics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."target_audiences" TO "anon";
GRANT ALL ON TABLE "public"."target_audiences" TO "authenticated";
GRANT ALL ON TABLE "public"."target_audiences" TO "service_role";



GRANT ALL ON SEQUENCE "public"."target_audiences_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."target_audiences_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."target_audiences_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
