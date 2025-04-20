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

    // 2. Get user session and verify Spotify provider token
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !session || !session.provider_token) {
      throw new Error(sessionError?.message || "User not authenticated or missing Spotify token.");
    }
    const accessToken = session.provider_token;

    // 3. Get request body parameters
    const { name, tracks } = await req.json();
    if (!name || !Array.isArray(tracks) || tracks.length === 0 || !tracks.every(t => typeof t === 'string' && t.startsWith('spotify:track:'))) {
      return new Response(JSON.stringify({ error: 'Missing or invalid parameters: name (string), tracks (non-empty array of Spotify URIs)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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