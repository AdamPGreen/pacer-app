async function searchSpotify(token: string, query: string): Promise<any> {
  const params = new URLSearchParams({
    q: query,
    type: 'track', // Search for tracks
    limit: '5'      // Limit to 5 results for brevity
  });
  const url = `https://api.spotify.com/v1/search?${params.toString()}`;

  console.log(`Querying Spotify API: ${url}`);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log(`Spotify API Response Status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Spotify API Error (${response.status}): ${errorText}`);
    throw new Error(`Spotify API request failed with status ${response.status}`);
  }

  return response.json();
}

// --- Main Execution ---
if (Deno.args.length < 2) {
  console.error('Usage: deno run --allow-net spotify_test_search.ts <YOUR_SPOTIFY_TOKEN> "<Your Search Query>"');
  Deno.exit(1);
}

const spotifyToken = Deno.args[0];
const searchQuery = Deno.args[1];

console.log('--- Spotify API Test Search ---');
console.log('Using Token (first 10 chars):', spotifyToken.substring(0, 10) + '...');
console.log('Search Query:', searchQuery);
console.log('-------------------------------');

try {
  const results = await searchSpotify(spotifyToken, searchQuery);
  console.log('\n--- Spotify API Success Response (Tracks) ---');
  // Pretty print the JSON output
  console.log(JSON.stringify(results.tracks?.items, null, 2)); // Print just the track items for clarity
  console.log('---------------------------------------------');
} catch (error) {
  console.error('\n--- Script Failed ---');
  console.error(error.message);
  console.error('--------------------');
  Deno.exit(1);
} 