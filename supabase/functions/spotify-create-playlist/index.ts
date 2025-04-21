import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create Supabase client with user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Get request body parameters
    const { name, tracks, refreshToken } = await req.json();
    if (!name || !Array.isArray(tracks) || tracks.length === 0 || !tracks.every(t => typeof t === 'string' && t.startsWith('spotify:track:')) || !refreshToken) {
      return new Response(JSON.stringify({ error: 'Missing or invalid parameters: name (string), tracks (non-empty array of Spotify URIs), refreshToken' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Refresh the Spotify Access Token
    console.log('---> Attempting to refresh Spotify token...')
    const accessToken = await refreshSpotifyToken(refreshToken);

    // 4. Create Playlist Logic
    // Get User ID
    const me = await fetchSpotifyApi('/me', accessToken);
    const userId = me.id;

    // Create Playlist
    const playlistData = await fetchSpotifyApi(`/users/${userId}/playlists`, accessToken, 'POST', {
      name: name,
      description: 'Created by Pacer App',
      public: true // Or false based on preference
    });
    const playlistId = playlistData.id;
    const playlistUrl = playlistData.external_urls.spotify;

    // Add Tracks (handle pagination for > 100 tracks)
    for (let i = 0; i < tracks.length; i += 100) {
      const batch = tracks.slice(i, i + 100);
      await fetchSpotifyApi(`/playlists/${playlistId}/tracks`, accessToken, 'POST', {
        uris: batch
      });
      // Optional: Small delay between batches if rate limits are hit
      // await new Promise(resolve => setTimeout(resolve, 200));
    }

    return new Response(JSON.stringify({ playlistUrl }), {
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