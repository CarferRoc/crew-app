import { supabase } from '../lib/supabase';
import { League, ClanWarEvent, EventParticipation, CarEvaluation } from '../models/types';

export const RankingService = {
    /**
     * Fetch all leagues ordered by level (ascending or descending)
     */
    async getLeagues(): Promise<League[]> {
        const { data, error } = await supabase
            .from('leagues')
            .select('*')
            .order('level', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Get the current leaderboard for a specific event
     */
    async getEventLeaderboard(eventId: string): Promise<EventParticipation[]> {
        const { data, error } = await supabase
            .from('event_participations')
            .select(`
        *,
        crew:crews (
          name,
          image_url
        )
      `)
            .eq('event_id', eventId)
            .order('total_score', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get all active or upcoming Clan War events
     */
    async getActiveEvents(): Promise<ClanWarEvent[]> {
        const { data, error } = await supabase
            .from('clan_war_events')
            .select('*')
            .neq('status', 'completed')
            .order('event_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Admin: Submit a car evaluation
     */
    async submitCarEvaluation(evaluation: Omit<CarEvaluation, 'id' | 'total_score'>) {
        // 1. Insert the evaluation
        const { data: evalData, error: evalError } = await supabase
            .from('car_evaluations')
            .insert(evaluation)
            .select()
            .single();

        if (evalError) throw evalError;

        // 2. Calculate the total for this car (Assuming simple sum of scores)
        const carTotal = (evaluation.score_aesthetics || 0) +
            (evaluation.score_power || 0) +
            (evaluation.score_sound || 0) +
            (evaluation.score_x_factor || 0);

        // 3. Update the clan's total score for the event
        // This requires fetching the current score and adding to it, or using a stored procedure.
        // simpler method for client-side logic (concurrency issues possible, but acceptable for MVP manual admin app)

        // Fetch current participation record
        const { data: participation, error: partError } = await supabase
            .from('event_participations')
            .select('total_score')
            .eq('event_id', evaluation.event_id)
            .eq('crew_id', evaluation.crew_id)
            .single();

        if (partError && partError.code !== 'PGRST116') throw partError; // Ignore not found, we will create

        const newScore = (participation?.total_score || 0) + carTotal;

        const { error: upsertError } = await supabase
            .from('event_participations')
            .upsert({
                event_id: evaluation.event_id,
                crew_id: evaluation.crew_id,
                total_score: newScore
            }, { onConflict: 'event_id, crew_id' });

        if (upsertError) throw upsertError;

        return evalData;
    },

    /**
     * Admin: Finalize event and Apply Promotions
     * Note: This is complex business logic. 
     * For the MVP, we will just calculating the final ranks and saving them.
     * Actual promotion (changing league_id) should likely be a separate explicit confirm step.
     */
    async calculateEventRanks(eventId: string) {
        // Fetch all participations ordered by score
        const { data: parts, error } = await supabase
            .from('event_participations')
            .select('id, total_score')
            .eq('event_id', eventId)
            .order('total_score', { ascending: false });

        if (error) throw error;
        if (!parts) return;

        // Update rank column
        const updates = parts.map((p: { id: string }, index: number) => ({
            id: p.id,
            rank: index + 1
        }));

        for (const update of updates) {
            await supabase
                .from('event_participations')
                .update({ rank: update.rank })
                .eq('id', update.id);
        }
    },

    /**
     * Promote Clans (Admin Tool)
     * Promotes top 3 clans of a league to the next level.
     */
    async promoteClans(leagueId: string, crewIds: string[]) {
        // ... existing implementation
    },

    /**
     * Check if a Clan War event exists for the current month
     */
    async checkMonthlyEventExists(): Promise<boolean> {
        const date = new Date();
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

        const { count, error } = await supabase
            .from('clan_war_events')
            .select('*', { count: 'exact', head: true })
            .gte('event_date', startOfMonth)
            .lte('event_date', endOfMonth);

        if (error) throw error;
        return (count || 0) > 0;
    },

    /**
     * Create a new Clan War Event
     */
    async createClanWarEvent(name: string, date: Date) {
        // 1. Double check usage limit
        const exists = await this.checkMonthlyEventExists();
        if (exists) {
            throw new Error('Ya existe una Guerra de Clanes este mes.');
        }

        const { data, error } = await supabase
            .from('clan_war_events')
            .insert({
                name: name,
                event_date: date.toISOString(),
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
