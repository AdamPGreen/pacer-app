import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// Re-enable Supabase client import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Function to get a new Spotify access token using a refresh token
async function refreshSpotifyToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET environment variables');
    throw new Error('Server configuration error: Spotify credentials missing.');
  }

  const basicAuth = btoa(`${clientId}:${clientSecret}`); // Base64 encode client_id:client_secret

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Spotify Token Refresh Error (${response.status}): ${errorBody}`);
    throw new Error(`Failed to refresh Spotify token: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    console.error('Access token not found in Spotify refresh response:', data);
    throw new Error('Failed to obtain access token from Spotify.');
  }
  
  console.log('Successfully refreshed Spotify access token.');
  return data.access_token;
}

// Basic Spotify API client using fetch (accepts access token)
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

// Function to get audio features for multiple tracks
async function getAudioFeatures(trackIds: string[], accessToken: string) {
  // Spotify API limits to 100 tracks per request, so we need to chunk if necessary
  const chunkSize = 100;
  const chunks = [];
  
  for (let i = 0; i < trackIds.length; i += chunkSize) {
    chunks.push(trackIds.slice(i, i + chunkSize));
  }
  
  const audioFeaturesResults = [];
  
  for (const chunk of chunks) {
    const ids = chunk.join(',');
    const features = await fetchSpotifyApi(`/audio-features?ids=${ids}`, accessToken);
    if (features && features.audio_features) {
      audioFeaturesResults.push(...features.audio_features);
    }
  }
  
  return audioFeaturesResults;
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`spotify-search function invoked (method: ${req.method})`);

  // Authorization header check (still good practice, though not used for Spotify token retrieval now)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
     console.error('Missing or invalid Authorization header');
     return new Response(JSON.stringify({ error: 'Unauthorized: Missing Supabase JWT.' }), {
       status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  console.log('---> Valid Supabase JWT detected.')

  try {
    // 1. Get parameters including the refresh token from the request body
    if (req.method !== 'POST' || !req.body) {
        return new Response(JSON.stringify({ error: 'POST request with body required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    const body = await req.json();
    console.log('Request body parsed:', body);
    const { genre, minTempo, maxTempo, limit = 20, refreshToken } = body;

    // Validate required parameters
    if (!genre || typeof minTempo !== 'number' || typeof maxTempo !== 'number' || typeof limit !== 'number' || !refreshToken) {
      console.error('Invalid parameters received (genre, minTempo, maxTempo, limit, refreshToken)');
      return new Response(JSON.stringify({ error: 'Missing or invalid parameters: genre, minTempo, maxTempo, limit, refreshToken required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log(`Search parameters: genre=${genre}, minTempo=${minTempo}, maxTempo=${maxTempo}, limit=${limit}`);

    // 2. Refresh the Spotify Access Token
    console.log('---> Attempting to refresh Spotify token...')
    const accessToken = await refreshSpotifyToken(refreshToken);

    // 3. Spotify Search Logic (Using /search endpoint)
    // We need to retrieve more tracks than requested to allow for tempo filtering
    const searchLimit = Math.min(50, limit * 2); // Get up to 50 tracks (Spotify limit) or 2x requested limit
    const queryParams = new URLSearchParams({
      q: `genre:"${genre}"`,
      type: 'track',
      limit: String(searchLimit),
    });

    console.log(`Calling Spotify API: /search?${queryParams.toString()}`);
    const searchResults = await fetchSpotifyApi(`/search?${queryParams.toString()}`, accessToken);
    
    if (!searchResults.tracks || !searchResults.tracks.items || searchResults.tracks.items.length === 0) {
      console.log('No tracks found for genre:', genre);
      return new Response(JSON.stringify({ data: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    const tracks = searchResults.tracks.items;
    console.log(`Spotify API search returned ${tracks.length} tracks.`);
    
    // 4. Get track IDs for audio features lookup
    const trackIds = tracks.map((track: any) => track.id);
    
    // 5. Get audio features for all tracks to filter by tempo
    console.log(`Fetching audio features for ${trackIds.length} tracks`);
    const audioFeatures = await getAudioFeatures(trackIds, accessToken);
    
    // 6. Create a map of track ID to tempo
    const trackTempoMap = new Map();
    audioFeatures.forEach((feature: any) => {
      if (feature && feature.id) {
        trackTempoMap.set(feature.id, feature.tempo);
      }
    });
    
    // 7. Filter tracks by tempo range and sort by closest to target tempo
    const targetTempo = (minTempo + maxTempo) / 2; // The exact target tempo
    const filteredTracks = tracks
      .filter((track: any) => {
        const tempo = trackTempoMap.get(track.id);
        return tempo && tempo >= minTempo && tempo <= maxTempo;
      })
      .sort((a: any, b: any) => {
        const tempoA = trackTempoMap.get(a.id);
        const tempoB = trackTempoMap.get(b.id);
        // Sort by how close the tempo is to the exact target
        return Math.abs(tempoA - targetTempo) - Math.abs(tempoB - targetTempo);
      });
    
    console.log(`Filtered to ${filteredTracks.length} tracks within tempo range ${minTempo}-${maxTempo} BPM`);
    
    // 8. Limit to requested number of tracks
    const limitedResults = filteredTracks.slice(0, limit);

    // 9. Return results
    console.log('Search successful, returning tracks.');
    return new Response(JSON.stringify({ data: limitedResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Function Error Caught:', error);
    let errorMessage = error.message;
    let statusCode = 500;

    // Check for specific error types
    if (errorMessage.includes('Failed to refresh Spotify token') || errorMessage.includes('Spotify API Error (401)')) {
      statusCode = 401; // Unauthorized - likely bad refresh token or API key issue
      errorMessage = "Spotify authentication failed. Please log out and log back in." // User-friendly message
    } else if (errorMessage.includes('Server configuration error')) {
      statusCode = 500; // Internal server error
      errorMessage = "Server configuration error. Please contact support."; // More generic for server issues
    } else if (errorMessage.includes('Spotify API Error (404)')) {
      statusCode = 400; // Bad Request - Likely invalid input like genre
      errorMessage = "Invalid genre or parameters for Spotify search.";
    } else if (errorMessage.includes('Spotify API Error')) {
      // Handle other Spotify API errors (e.g., rate limits)
      const match = errorMessage.match(/\((\d{3})\)/);
      statusCode = match ? parseInt(match[1], 10) : 502; // Use Spotify's status or 502
    }

    console.log(`Inside catch block, preparing ${statusCode} response with message: ${errorMessage}`);

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode
    });
  }
}) 