import { supabase } from '../lib/supabase';
import { League, ClanWarEvent, EventParticipation, CarEvaluation } from '../models/types';

export const RankingService = {
    /**
     * Fetch all leagues ordered by level (ascending or descending)
     */
    async getLeagues(): Promise<League[]> {
        const { data, error } = await supabase
            .from('competition_leagues')
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
          image_url,
          competition_league_id
        )
      `)
            .eq('event_id', eventId)
            .order('total_score', { ascending: false });

        if (error) throw error;
        return data;
    },

    // ... (intermediate methods unchanged) ...

    /**
     * Process Promotions and Demotions based on League results
     */
    async processPromotions(eventId: string) {
        // 1. Fetch all leagues
        const leagues = await this.getLeagues();
        if (!leagues || leagues.length === 0) return;

        for (const league of leagues) {
            // Find participations for crews in this competition_league
            const { data: participations } = await supabase
                .from('event_participations')
                .select(`
                    id, 
                    total_score, 
                    crew_id, 
                    crew:crews!inner(competition_league_id)
                `)
                .eq('event_id', eventId)
                .eq('crew.competition_league_id', league.id)
                .order('total_score', { ascending: false });

            if (!participations || participations.length === 0) continue;

            // TOP 3 Promote
            const maxLevel = Math.max(...leagues.map(l => l.level));
            if (league.level < maxLevel) {
                const nextLeague = leagues.find(l => l.level === league.level + 1);
                if (nextLeague) {
                    const toPromote = participations.slice(0, 3);
                    for (const p of toPromote) {
                        await supabase
                            .from('crews')
                            .update({ competition_league_id: nextLeague.id })
                            .eq('id', p.crew_id);
                    }
                }
            }

            // BOTTOM 3 Demote
            const minLevel = Math.min(...leagues.map(l => l.level));
            if (league.level > minLevel) {
                const prevLeague = leagues.find(l => l.level === league.level - 1);
                if (prevLeague) {
                    const toDemote = participations.slice(-3);
                    const promotedIds = participations.slice(0, 3).map(p => p.crew_id);
                    for (const p of toDemote) {
                        if (!promotedIds.includes(p.crew_id)) {
                            await supabase
                                .from('crews')
                                .update({ competition_league_id: prevLeague.id })
                                .eq('id', p.crew_id);
                        }
                    }
                }
            }
        }
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
     * Add points to a crew for an event
     */
    async addEventScore(eventId: string, crewId: string, points: number) {
        // Fetch current participation record
        const { data: participation, error: partError } = await supabase
            .from('event_participations')
            .select('total_score')
            .eq('event_id', eventId)
            .eq('crew_id', crewId)
            .single();

        if (partError && partError.code !== 'PGRST116') throw partError;

        const newScore = (participation?.total_score || 0) + points;

        const { error: upsertError } = await supabase
            .from('event_participations')
            .upsert({
                event_id: eventId,
                crew_id: crewId,
                total_score: newScore
            }, { onConflict: 'event_id, crew_id' });

        if (upsertError) throw upsertError;
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
     * Start the Clan War
     */
    async startWar(eventId: string) {
        const { error } = await supabase
            .from('clan_war_events')
            .update({ status: 'active' })
            .eq('id', eventId);

        if (error) throw error;
    },

    /**
     * End the Clan War and Calculate Results
     */
    async endWar(eventId: string) {
        // 1. Update status to completed
        const { error } = await supabase
            .from('clan_war_events')
            .update({ status: 'completed' })
            .eq('id', eventId);

        if (error) throw error;

        // 2. Calculate final results
        await this.calculateWarResults(eventId);

        // 3. Process Promotions/Demotions
        await this.processPromotions(eventId);
    },

    /**
     * Calculate and save final results for the war
     */
    async calculateWarResults(eventId: string) {
        // Fetch all participations
        const { data: participations, error: partError } = await supabase
            .from('event_participations')
            .select('*')
            .eq('event_id', eventId);

        if (partError) throw partError;
        if (!participations) return;

        // Fetch all battles for this event period? 
        // Ideally battles should probably be linked to the event or we look at the date range.
        // For now, let's assume battles are separate points added to 'scoreCre', 
        // OR we can try to find battles that happened during this month.
        // Simplified approach: rely on what we have in `event_participations` (Evaluations) 
        // AND maybe we need to fetch battles if they aren't already added to `event_participations`.

        // As per plan, we might need to attribute battle wins to event score.
        // If `useStore` adds +50 to `scoreCrew` (global score), does it add to the event score?
        // Let's assume for this implementation that 'War Score' is primarily Car Evaluations + Battle Wins *during* the event.

        // For MVP, we will just rank based on `total_score` which is currently populated by Car Evaluations.
        // TODO: Include Battle Wins in `event_participations` if not already there.

        // Sort by total_score descending
        participations.sort((a, b) => b.total_score - a.total_score);

        // Update ranks
        for (let i = 0; i < participations.length; i++) {
            await supabase
                .from('event_participations')
                .update({ rank: i + 1 })
                .eq('id', participations[i].id);
        }
    },



    /**
     * Get Event MVP (Best Car Evaluation)
     */
    async getEventMVP(eventId: string) {
        const { data: evaluations, error } = await supabase
            .from('car_evaluations')
            .select('*')
            .eq('event_id', eventId)
            .limit(100);

        if (error) throw error;

        if (!evaluations || evaluations.length === 0) return null;

        // Manually fetch profiles to avoid Foreign Key relationship issues (PGRST200)
        const memberIds = [...new Set(evaluations.map(e => e.member_id).filter(Boolean))];

        let profilesMap: Record<string, any> = {};

        if (memberIds.length > 0) {
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', memberIds);

            if (!profileError && profiles) {
                profilesMap = profiles.reduce((acc, profile) => {
                    acc[profile.id] = profile;
                    return acc;
                }, {} as Record<string, any>);
            }
        }

        const scoredData = evaluations.map(d => ({
            ...d,
            member: profilesMap[d.member_id] || null,
            total_score: (d.score_aesthetics || 0) + (d.score_power || 0) + (d.score_sound || 0) + (d.score_x_factor || 0)
        }));

        scoredData.sort((a, b) => b.total_score - a.total_score);

        return scoredData[0];
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
