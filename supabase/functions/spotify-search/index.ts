import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// Re-enable Supabase client import
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
    // ADDED: Log raw response text before trying to parse JSON
    const rawErrorText = await response.text();
    console.error(`Spotify API Error Raw Response (${response.status}): ${rawErrorText}`);
    // Attempt to parse JSON, fallback to raw text
    let errorData;
    try {
      errorData = JSON.parse(rawErrorText);
    } catch (parseError) {
      console.error('Failed to parse Spotify error response as JSON:', parseError);
      errorData = { error: { message: rawErrorText } }; // Use raw text as message
    }
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

  console.log(`spotify-search function invoked (method: ${req.method})`);

  try {
    console.log('Inside try block');

    // 1. Create Supabase client with user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Get user session and verify Spotify provider token
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !session || !session.provider_token) {
      throw new Error(sessionError?.message || "User not authenticated or missing Spotify token.");
    }
    const accessToken = session.provider_token;

    // 3. Get request body parameters
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    // Ensure body exists before parsing
    if (!req.body) {
         return new Response(JSON.stringify({ error: 'Request body required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const body = await req.json();
    console.log('Request body parsed:', body);
    const { genre, targetTempo, limit = 20 } = body;
    console.log(`Search parameters: genre=${genre}, targetTempo=${targetTempo}, limit=${limit}`);

    // Validate required parameters
    if (!genre || typeof targetTempo !== 'number' || typeof limit !== 'number') {
      console.error('Invalid parameters received (genre, targetTempo, limit)');
      return new Response(JSON.stringify({ error: 'Missing or invalid parameters: genre (string), targetTempo (number), limit (number)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Spotify Search Logic (Using Recommendations Endpoint - Simpler for Tempo)
    // Construct recommendation query params
    const queryParams = new URLSearchParams({
      limit: String(limit),
      seed_genres: genre,
      target_tempo: String(targetTempo),
      // Optional: Add min/max tempo for range, min/max popularity etc.
      // min_tempo: String(targetTempo - 2),
      // max_tempo: String(targetTempo + 2),
    });

    console.log(`Calling Spotify API: /recommendations?${queryParams.toString()}`);
    const recommendations = await fetchSpotifyApi(`/recommendations?${queryParams.toString()}`, accessToken);
    const tracks = recommendations.tracks; // Array of Track Objects
    console.log(`Spotify API returned ${tracks?.length ?? 0} tracks.`);

    // 5. Return results
    console.log('Search successful, returning tracks.');
    return new Response(JSON.stringify({ data: tracks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    // Log the full error object for more details if available
    console.error('Function Error Caught:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);

    // Distinguish Spotify API errors from other errors
    const isSpotifyAuthError = error.message.includes('Spotify API Error (401)') || 
                              error.message.includes('invalid access token') ||
                              error.message.includes('User not authenticated') ||
                              error.message.includes('missing Spotify token');
    const statusCode = isSpotifyAuthError ? 401 : 500;

    console.log(`Inside catch block, preparing ${statusCode} response`);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode
    });
  }
}) 