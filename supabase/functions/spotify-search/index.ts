import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// Remove Supabase client import if no longer needed for other purposes
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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
    // console.error(`Spotify API Error (${response.status}): ${JSON.stringify(errorData)}`); // Original log
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
    // ADDED: Log entry into try block
    console.log('Inside try block');

    // 1. Extract Spotify token directly from Authorization header (REMOVED)
    // const authHeader = req.headers.get('Authorization');
    // console.log(`Authorization header received: ${authHeader ? 'Bearer ...' : 'null'}`); // Log presence, not value
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   console.error('Missing or invalid Authorization header');
    //   return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
    //     status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    //   });
    // }
    // const accessToken = authHeader.substring(7); // Remove 'Bearer '

    // 2. Get request body parameters (renumbered)
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
    const body = await req.json(); // Extract spotifyToken
    // ADDED: Log the parsed body
    console.log('Request body parsed:', body);
    const { genre, targetTempo, limit = 20, spotifyToken } = body;
    console.log(`Search parameters: genre=${genre}, targetTempo=${targetTempo}, limit=${limit}, spotifyToken received: ${!!spotifyToken}`); // Log token presence

    // Validate required parameters including spotifyToken
    if (!genre || typeof targetTempo !== 'number' || typeof limit !== 'number' || !spotifyToken) {
      console.error('Invalid parameters received (genre, targetTempo, limit, spotifyToken)');
      return new Response(JSON.stringify({ error: 'Missing or invalid parameters: genre (string), targetTempo (number), limit (number), spotifyToken (string)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Assign spotifyToken to accessToken for clarity in subsequent code
    const accessToken = spotifyToken;

    // 3. Spotify Search Logic (Using Recommendations Endpoint - Simpler for Tempo) (renumbered)
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
    const recommendations = await fetchSpotifyApi(`/recommendations?${queryParams.toString()}`, accessToken); // Use the token from body
    const tracks = recommendations.tracks; // Array of Track Objects
    console.log(`Spotify API returned ${tracks?.length ?? 0} tracks.`);

    // 4. Return results (renumbered)
    console.log('Search successful, returning tracks.');
    return new Response(JSON.stringify({ data: tracks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    // Log the full error object for more details if available
    console.error('Function Error Caught:', error);
    // ADDED: Log specific properties for better debugging
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    // Attempt to log status if it's a ResponseError-like object (might not always be present)
    // console.error('Original Status (if available):', error.response?.status); 

    // Distinguish Spotify API errors from other errors
    const isSpotifyAuthError = error.message.includes('Spotify API Error (401)') || error.message.includes('invalid access token');
    // Update internal auth error check to reflect missing token in body
    const isInternalAuthError = error.message.includes('Missing or invalid parameters'); // Simpler check now
    const statusCode = isSpotifyAuthError || isInternalAuthError ? 401 : 500;

    // ADDED: Log before returning from catch
    console.log(`Inside catch block, preparing ${statusCode} response`);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode
    });
  }
}) 