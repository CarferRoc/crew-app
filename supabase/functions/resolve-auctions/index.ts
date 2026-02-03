// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Car {
    id: string;
    brand: string;
    model: string;
    year: number;
    hp: number;
    cylinders?: string;
    gearbox?: string;
    drive_type?: string;
    body_style?: string;
    segment?: string;
    city?: string;
    highway?: string;
    production_years: string;
    image_urls?: string[];
    parts: any[];
    baseStats: {
        ac: number;
        mn: number;
        tr: number;
        cn: number;
        es: number;
        fi: number;
    };
    stats: {
        ac: number;
        mn: number;
        tr: number;
        cn: number;
        es: number;
        fi: number;
    };
}

interface CarPart {
    id: string;
    type: string;
    quality: string;
    name: string;
    bonusStats: any;
    price: number;
}

// Calculate car stats (same logic as client)
function calculateStats(car: Car) {
    const current = { ...car.baseStats };

    // Apply parts
    car.parts.forEach((part: any) => {
        if (part.bonusStats.ac) current.ac += part.bonusStats.ac;
        if (part.bonusStats.mn) current.mn += part.bonusStats.mn;
        if (part.bonusStats.tr) current.tr += part.bonusStats.tr;
        if (part.bonusStats.cn) current.cn += part.bonusStats.cn;
        if (part.bonusStats.es) current.es += part.bonusStats.es;
        if (part.bonusStats.fi) current.fi += part.bonusStats.fi;
    });

    // Apply synergies
    const hasPart = (type: string) => car.parts.some((p: any) => p.type === type);

    if (hasPart('turbo') && hasPart('intercooler')) {
        current.ac = Math.floor(current.ac * 1.15);
    }

    if (hasPart('suspension') && hasPart('tires')) {
        current.mn += 10;
    }

    // Clamp values 0-100
    Object.keys(current).forEach(k => {
        current[k as keyof typeof current] = Math.max(0, Math.min(100, current[k as keyof typeof current]));
    });

    return current;
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        console.log('Starting auction resolution process...');

        // Get all leagues
        const { data: leagues, error: leaguesError } = await supabaseClient
            .from('leagues')
            .select('id, code, last_auction_resolved_at, created_at');

        if (leaguesError) {
            console.error('Error fetching leagues:', leaguesError);
            throw leaguesError;
        }

        console.log(`Found ${leagues?.length || 0} leagues to process`);

        const now = new Date();
        const today20 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);

        let totalResolved = 0;
        const results: any[] = [];

        for (const league of leagues || []) {
            console.log(`Processing league: ${league.code}`);

            // Check if already resolved today
            const lastResolved = league.last_auction_resolved_at ? new Date(league.last_auction_resolved_at) : null;

            if (lastResolved && lastResolved >= today20) {
                console.log(`League ${league.code} already resolved today, skipping`);
                continue;
            }

            // Fetch all bids for this league
            const { data: allBids, error: bidsError } = await supabaseClient
                .from('market_bids')
                .select('*')
                .eq('league_id', league.id);

            if (bidsError) {
                console.error(`Error fetching bids for league ${league.code}:`, bidsError);
                continue;
            }

            if (!allBids || allBids.length === 0) {
                console.log(`No bids for league ${league.code}, updating timestamp`);
                await supabaseClient
                    .from('leagues')
                    .update({ last_auction_resolved_at: now.toISOString() })
                    .eq('id', league.id);
                continue;
            }

            console.log(`Found ${allBids.length} bids for league ${league.code}`);

            // Group bids by item
            const bidsByItem: Record<string, any[]> = {};
            allBids.forEach(b => {
                if (!bidsByItem[b.item_id]) bidsByItem[b.item_id] = [];
                bidsByItem[b.item_id].push(b);
            });

            // Fetch participants
            const { data: participants, error: participantsError } = await supabaseClient
                .from('league_participants')
                .select('*')
                .eq('league_code', league.code);

            if (participantsError) {
                console.error(`Error fetching participants for league ${league.code}:`, participantsError);
                continue;
            }

            // Create participant map
            const participantMap: Record<string, any> = {};
            participants?.forEach((p: any) => {
                participantMap[p.id] = { ...p };
            });

            const winnersInfo: any[] = [];
            const processedParticipantIds = new Set<string>();

            // Process each item's bids
            for (const itemId in bidsByItem) {
                const itemBids = bidsByItem[itemId];

                // Sort by amount (highest first), then by time (earliest first)
                itemBids.sort((a: any, b: any) => {
                    if (b.amount !== a.amount) return b.amount - a.amount;
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                });

                const winnerBid = itemBids[0];
                const p = participantMap[winnerBid.participant_id];

                if (!p) {
                    console.log(`Participant not found for bid ${winnerBid.id}`);
                    continue;
                }

                if (p.budget < winnerBid.amount) {
                    console.log(`Participant ${p.id} has insufficient budget (${p.budget} < ${winnerBid.amount})`);
                    continue;
                }

                const marketItem = winnerBid.item_data;

                if (winnerBid.item_type === 'car') {
                    // Check if participant already has a car
                    if (p.team_cars && p.team_cars.length > 0) {
                        console.log(`Participant ${p.id} already has a car, skipping`);
                        continue;
                    }

                    const stats = marketItem.dbStats || { ac: 0, mn: 0, tr: 0, cn: 0, es: 0, fi: 0 };
                    const newCar: Car = {
                        id: marketItem.id + '-' + Date.now(),
                        brand: marketItem.brand,
                        model: marketItem.model,
                        year: marketItem.year,
                        hp: marketItem.hp,
                        cylinders: marketItem.cylinders,
                        gearbox: marketItem.gearbox || marketItem.transmission,
                        drive_type: marketItem.drive_type || marketItem.drivetrain,
                        body_style: marketItem.style || marketItem.body_style,
                        segment: marketItem.category || marketItem.segment,
                        city: marketItem.cityMpg?.toString() || marketItem.city,
                        highway: marketItem.highwayMpg?.toString() || marketItem.highway,
                        production_years: marketItem.production_years || marketItem.year?.toString() || '2000',
                        image_urls: [marketItem.image],
                        parts: [],
                        baseStats: {
                            ac: stats.ac,
                            mn: stats.mn,
                            tr: stats.tr,
                            cn: stats.cn,
                            es: stats.es,
                            fi: stats.fi
                        },
                        stats: { ac: 0, mn: 0, tr: 0, cn: 0, es: 0, fi: 0 }
                    };

                    newCar.stats = calculateStats(newCar);

                    p.team_cars = [newCar];
                    p.budget -= winnerBid.amount;
                    processedParticipantIds.add(p.id);

                    winnersInfo.push({
                        user_id: p.user_id,
                        item_type: 'car',
                        item_name: `${newCar.brand} ${newCar.model}`,
                        amount: winnerBid.amount
                    });

                    console.log(`Awarded car ${newCar.brand} ${newCar.model} to participant ${p.id}`);

                } else if (winnerBid.item_type === 'part') {
                    const newPart: CarPart = {
                        id: marketItem.id + '-' + Date.now(),
                        type: marketItem.type,
                        quality: marketItem.quality,
                        name: marketItem.name,
                        bonusStats: marketItem.bonusStats,
                        price: marketItem.price
                    };

                    p.team_parts = [...(p.team_parts || []), newPart];
                    p.budget -= winnerBid.amount;
                    processedParticipantIds.add(p.id);

                    winnersInfo.push({
                        user_id: p.user_id,
                        item_type: 'part',
                        item_name: newPart.name,
                        amount: winnerBid.amount
                    });

                    console.log(`Awarded part ${newPart.name} to participant ${p.id}`);
                }
            }

            // Persist updates to database
            for (const pId of Array.from(processedParticipantIds)) {
                const p = participantMap[pId];
                console.log(`Updating participant ${pId}`);

                const { error: updateError } = await supabaseClient
                    .from('league_participants')
                    .update({
                        team_cars: p.team_cars,
                        team_parts: p.team_parts,
                        budget: p.budget
                    })
                    .eq('id', pId);

                if (updateError) {
                    console.error(`Error updating participant ${pId}:`, updateError);
                }
            }

            // Delete all bids for this league
            await supabaseClient
                .from('market_bids')
                .delete()
                .eq('league_id', league.id);

            // Update last resolved timestamp
            await supabaseClient
                .from('leagues')
                .update({ last_auction_resolved_at: now.toISOString() })
                .eq('id', league.id);

            totalResolved += winnersInfo.length;
            results.push({
                league_code: league.code,
                winners: winnersInfo
            });

            console.log(`Resolved ${winnersInfo.length} auctions for league ${league.code}`);
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Resolved ${totalResolved} auctions across ${results.length} leagues`,
                results: results,
                timestamp: now.toISOString()
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error) {
        console.error('Error in auction resolution:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            },
        )
    }
})
