Project: Spotify Track Search & Playlist Creation - Implementation Plan
Version: 1.0
Date: 2023-10-27
1. Goal:
To implement a feature allowing users to select a music genre, specify a target tempo range (BPM), find relevant Spotify tracks matching the criteria, and automatically create a new Spotify playlist containing those tracks.
2. Background & Problem Statement:
The initial approach attempted to use the Spotify Web API's /recommendations endpoint (https://developer.spotify.com/documentation/web-api/reference/get-recommendations) and its associated /recommendations/available-genre-seeds endpoint (https://developer.spotify.com/documentation/web-api/reference/get-recommendation-genres) to find tracks based on seed genres and target tempo.
Root Cause of Failure: Both the /recommendations and /recommendations/available-genre-seeds endpoints are deprecated by Spotify, as noted in their documentation. Calls using these endpoints, especially with genre strings derived from the UI (e.g., 2010s-rock) that weren't valid "seed genres," resulted in API errors (specifically 400/404 responses).
This necessitates a fundamental change in the backend logic for fetching tracks.
3. New Strategy: Search, Filter, Playlist
The revised strategy involves three core steps executed primarily within Supabase Edge Functions:
Search: Use the general Spotify /search endpoint with the user-selected genre as a keyword.
Filter: Fetch audio features for the search results and filter them based on the user-provided minTempo and maxTempo.
Playlist: Create a new playlist for the user and add the filtered tracks to it.
4. Required Spotify API Endpoints & Scopes:
Authentication:
POST https://accounts.spotify.com/api/token: To refresh the access token using the stored refresh token. (Existing)
Track Fetching & Filtering:
GET https://api.spotify.com/v1/search: To search for tracks using a query string (e.g., q=genre:"<genre>").
Reference: https://developer.spotify.com/documentation/web-api/reference/search
GET https://api.spotify.com/v1/audio-features: To retrieve audio features (including tempo) for multiple tracks by their IDs.
Reference: https://developer.spotify.com/documentation/web-api/reference/get-several-audio-features
Playlist Creation:
GET https://api.spotify.com/v1/me: To get the current logged-in user's Spotify ID.
Reference: https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
POST https://api.spotify.com/v1/users/{user_id}/playlists: To create a new, empty playlist for the user.
Reference: https://developer.spotify.com/documentation/web-api/reference/create-playlist
POST https://api.spotify.com/v1/playlists/{playlist_id}/tracks: To add the filtered tracks to the newly created playlist.
Reference: https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist
Deprecated Endpoints (Not to be used):
GET /recommendations
GET /recommendations/available-genre-seeds
Required OAuth Scopes: The user must grant permission for the following scopes during the initial Spotify login/authorization flow in the React app:
playlist-modify-public: To create public playlists and add tracks.
playlist-modify-private: (Optional, if private playlist creation is desired) To create private playlists and add tracks.
(Implicitly needed: user-read-private for /me endpoint)
5. Implementation Details:
Frontend (React App - src/):
components/Form/GenreSelector.tsx:
No significant changes required. It will continue to manage the selection of a single genre string (e.g., pop, 80s-rock). The internal value sent to the context (all-pop, 80s-rock) remains the same.
context/RunContext.tsx:
The genre, minTempo, maxTempo state variables remain. Ensure minTempo and maxTempo are correctly managed (likely from the TempoSelector component).
context/SpotifyContext.tsx:
Modify searchTracks:
Ensure its signature accepts (genre: string, minTempo: number, maxTempo: number).
Update the payload sent to the spotify-search edge function to include genre, minTempo, maxTempo, and refreshToken. Remove targetTempo.
Create createPlaylist:
Signature: async (tracks: Track[], playlistName: string): Promise<void> (or similar, returning playlist URL/ID).
Extract track.uri from each track object in the tracks array.
Call a new Supabase edge function (spotify-create-playlist), passing the array of track URIs, the desired playlistName, and the refreshToken.
Handle loading states and success/error feedback.
UI Components:
Add a "Create Playlist on Spotify" button (or similar UI element) that becomes active after searchTracks successfully returns results.
This button's onClick handler should:
Prompt the user for a playlist name (or generate a default one, e.g., "Pacer Tracks - [Genre] [Timestamp]").
Call the createPlaylist function from SpotifyContext.
Provide user feedback (loading, success with link, error).
Backend (Supabase Edge Functions - supabase/functions/):
spotify-search/index.ts (Modify Existing):
Inputs: genre: string, minTempo: number, maxTempo: number, limit: number, refreshToken: string.
Logic:
Refresh Spotify token using refreshToken.
Perform Spotify API call: GET /search with q=genre:"${genre}", type=track, limit=50 (fetch extra for filtering). Handle potential empty search results.
Extract track IDs from search results. If none, return empty array.
Perform Spotify API call: GET /audio-features with the extracted track IDs (up to 100 per call).
Create a map or lookup for track ID -> tempo from the audio features response.
Filter the original track objects from the /search results based on whether their corresponding audio feature tempo falls within minTempo and maxTempo.
Slice the filtered array to the requested limit.
Return the final array of filtered Spotify Track objects.
Error Handling: Update error messages for 400/404 responses to reflect potential issues with /search or /audio-features.
spotify-create-playlist/index.ts (Create New):
Inputs: trackUris: string[], playlistName: string, refreshToken: string.
Logic:
Refresh Spotify token using refreshToken. Ensure the token has playlist-modify-public and/or playlist-modify-private scopes.
Perform Spotify API call: GET /me to retrieve user_id.
Perform Spotify API call: POST /users/{user_id}/playlists with name: playlistName, potentially description and public: true/false.
Extract the id (playlist ID) and external_urls.spotify (playlist URL) from the response.
Perform Spotify API call: POST /playlists/{playlist_id}/tracks with { uris: trackUris } in the body.
Note: If trackUris.length > 100, this call needs to be chunked into multiple requests, each with a maximum of 100 URIs.
Return a success response, potentially including the new playlist ID and URL.
Error Handling: Handle errors from each API call (e.g., insufficient scope, invalid user, playlist creation failure, adding tracks failure).
6. Action Plan / Next Steps:
(Backend) Implement the modifications to the supabase/functions/spotify-search/index.ts edge function as outlined above.
(Testing) Deploy and test the modified spotify-search function thoroughly using various genres and tempo ranges. Verify filtering logic.
(Backend) Create, implement, and deploy the new supabase/functions/spotify-create-playlist/index.ts edge function.
(Testing) Test the spotify-create-playlist function directly (e.g., using curl or a tool like Postman) with valid track URIs and a refresh token possessing the required scopes.
(Frontend) Update src/context/SpotifyContext.tsx: modify searchTracks call and add the new createPlaylist function.
(Frontend) Add UI elements (button, input for name if needed, feedback messages) to trigger playlist creation after search results are available.
(Frontend) Verify that the Spotify OAuth login flow requests the necessary playlist-modify-public (and optionally playlist-modify-private) scopes. Update if necessary.
(End-to-End Testing) Perform full user flow testing: Login -> Select Genre/Tempo -> Search Tracks -> Create Playlist -> Verify playlist in Spotify.