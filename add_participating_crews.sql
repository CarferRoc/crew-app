-- Add participating_crews to events to allow Crews to join an event (e.g. Leader joining on behalf of Crew)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS participating_crew_ids UUID[] DEFAULT '{}';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_events_participating_crew_ids ON events USING GIN (participating_crew_ids);
