import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Basic Spotify API client using fetch
async function fetchSpotifyApi(endpoint: string, accessToken: string, method: string = 'GET', body?: any) {
  const url = `https://api.spotify.com/v1${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown Spotify API error' }));
    console.error(`Spotify API Error (${response.status}): ${JSON.stringify(errorData)}`);
    throw new Error(`Spotify API Error (${response.status}): ${errorData.error?.message || 'Failed request'}`);
  }
  // For 204 No Content responses (like successful add tracks)
  if (response.status === 204) return null;
  return response.json();
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create Supabase client with user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Crucially, pass the Authorization header from the incoming request
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Get user session and verify Spotify provider token
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw new Error(`Supabase Auth Error: ${sessionError.message}`);
    if (!session) throw new Error("User not authenticated.");
    if (!session.provider_token) throw new Error("Spotify provider token not found in session.");

    const accessToken = session.provider_token;

    // 3. Get request body parameters
    const { genre, targetTempo, limit = 20 } = await req.json();
    if (!genre || typeof targetTempo !== 'number' || typeof limit !== 'number') {
      return new Response(JSON.stringify({ error: 'Missing or invalid parameters: genre (string), targetTempo (number), limit (number)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Spotify Search Logic (Using Recommendations Endpoint - Simpler for Tempo)
    // Construct recommendation query params
    // Note: Spotify API expects up to 5 seed values (artists, genres, tracks)
    const queryParams = new URLSearchParams({
      limit: String(limit),
      seed_genres: genre,
      target_tempo: String(targetTempo),
      // Optional: Add min/max tempo for range, min/max popularity etc.
      // min_tempo: String(targetTempo - 2),
      // max_tempo: String(targetTempo + 2),
    });

    const recommendations = await fetchSpotifyApi(`/recommendations?${queryParams.toString()}`, accessToken);
    const tracks = recommendations.tracks; // Array of Track Objects

    return new Response(JSON.stringify({ data: tracks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message.includes('authenticated') || error.message.includes('token') ? 401 : 500
    });
  }
}) 