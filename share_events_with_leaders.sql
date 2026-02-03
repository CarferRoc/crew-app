-- Add joint_crew_ids to events to allow sharing events between crews (e.g. with Leaders Crew)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS joint_crew_ids UUID[] DEFAULT '{}';

-- Index for performance if needed (GIN index for array)
CREATE INDEX IF NOT EXISTS idx_events_joint_crew_ids ON events USING GIN (joint_crew_ids);
