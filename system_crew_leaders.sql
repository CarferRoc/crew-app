-- 0. Ensure System User exists (to satisfy Foreign Key)
INSERT INTO profiles (id, username, avatar_url, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'System',
  'https://via.placeholder.com/150',
  'admin'
) ON CONFLICT (id) DO NOTHING;

-- 1. Create the 'Líderes' Crew
INSERT INTO crews (id, name, description, image_url, created_by, total_season_points)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'Líderes', 
  'Crew oficial para líderes de crews. Conecta con otros líderes, organiza eventos y comparte experiencias.', 
  'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1000&auto=format&fit=crop', 
  '00000000-0000-0000-0000-000000000000', -- System User ID placeholder
  0
) ON CONFLICT (id) DO NOTHING;

-- 2. Add 'channel' column to crew_messages
ALTER TABLE crew_messages 
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'general';

-- 3. Trigger Function: Maintain Leaders Membership
CREATE OR REPLACE FUNCTION maintain_leaders_crew_membership()
RETURNS TRIGGER AS $$
DECLARE
    leaders_crew_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Case 1: New Member added with role 'crew_lider'
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.role = 'crew_lider') THEN
            -- Add to Leaders Crew
            INSERT INTO crew_members (crew_id, profile_id, role)
            VALUES (leaders_crew_id, NEW.profile_id, 'member')
            ON CONFLICT (crew_id, profile_id) DO NOTHING;
        END IF;
        RETURN NEW;
    
    -- Case 2: Update Role
    ELSIF (TG_OP = 'UPDATE') THEN
        -- If promoted to leader
        IF (NEW.role = 'crew_lider' AND OLD.role != 'crew_lider') THEN
             INSERT INTO crew_members (crew_id, profile_id, role)
            VALUES (leaders_crew_id, NEW.profile_id, 'member')
            ON CONFLICT (crew_id, profile_id) DO NOTHING;
        
        -- If demoted from leader
        ELSIF (NEW.role != 'crew_lider' AND OLD.role = 'crew_lider') THEN
             -- Check if they are leader of ANY OTHER crew. If not, remove from Leaders Crew.
             -- (Simplification: Just remove, if they are leader elsewhere the trigger for that crew would re-add them? 
             -- No, we need to check count.)
             
             -- Wait, complex logic. 
             -- Let's check if this user is a 'crew_lider' in any OTHER row in 'crew_members' table.
             IF NOT EXISTS (
                 SELECT 1 FROM crew_members 
                 WHERE profile_id = NEW.profile_id 
                 AND role = 'crew_lider' 
                 AND crew_id != NEW.crew_id -- Exclude the one currently changing
             ) THEN
                 DELETE FROM crew_members 
                 WHERE crew_id = leaders_crew_id 
                 AND profile_id = NEW.profile_id;
             END IF;
        END IF;
        RETURN NEW;

    -- Case 3: Delete (Member leaves or is removed)
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.role = 'crew_lider') THEN
             -- Same check as above
             IF NOT EXISTS (
                 SELECT 1 FROM crew_members 
                 WHERE profile_id = OLD.profile_id 
                 AND role = 'crew_lider' 
                 AND crew_id != OLD.crew_id
             ) THEN
                 DELETE FROM crew_members 
                 WHERE crew_id = leaders_crew_id 
                 AND profile_id = OLD.profile_id;
             END IF;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Trigger
DROP TRIGGER IF EXISTS on_crew_membership_change_leaders ON crew_members;

CREATE TRIGGER on_crew_membership_change_leaders
AFTER INSERT OR UPDATE OR DELETE ON crew_members
FOR EACH ROW EXECUTE FUNCTION maintain_leaders_crew_membership();

-- 5. Backfill existing leaders (Run once)
INSERT INTO crew_members (crew_id, profile_id, role)
SELECT '00000000-0000-0000-0000-000000000001', profile_id, 'member'
FROM crew_members
WHERE role = 'crew_lider'
ON CONFLICT (crew_id, profile_id) DO NOTHING;
