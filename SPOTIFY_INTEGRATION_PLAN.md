# Spotify Integration Plan (Supabase Auth & Vercel Deployment)

This document outlines the steps to implement Spotify integration using Supabase for authentication and backend logic, deploying the frontend on Vercel. This approach leverages Supabase's built-in OAuth handling and secure Edge Functions.

## 1. External Service Configuration (Supabase & Vercel) - Non-Technical Guide

**Goal:** Set up the necessary accounts and connect them so Spotify login works and your app can be hosted online.

**You will need:**

*   A Spotify account (can be a free one).
*   A GitHub account (where your code is stored).
*   An email address for creating accounts.

**Steps:**

1.  **Spotify Developer Dashboard Setup:**
    *   Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/). Log in with your Spotify account.
    *   Click "Create App" (or similar button).
    *   Give your app a **Name** (e.g., "Pacer App") and **Description**. Accept the terms.
    *   Once created, you'll see your **Client ID** and you can click to show your **Client Secret**. **KEEP THESE SECRET**. You will need them for Supabase setup (Step 2), **do not put them directly in your code.**
    *   Find the **Settings** for your app.
    *   In the settings, look for **Redirect URIs**. You need to add a specific URL here that Supabase will use. It will look like this: `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
        *   You won't know `<YOUR_SUPABASE_PROJECT_REF>` yet. **Leave this step for now and come back to it after setting up Supabase (Step 2).**

2.  **Supabase Project Setup:**
    *   Go to [Supabase.io](https://supabase.io/) and sign up (you can use your GitHub account).
    *   Create a **New Project**. Choose a **Name** (e.g., "pacer-app-backend"), generate a secure **Database Password** (save it somewhere safe, though you might not need it often), and select a **Region** near you or your users. Wait for the project to be created.
    *   Once the project dashboard loads, find the **Project Reference ID**. It's usually part of the URL (like `https://app.supabase.com/project/<PROJECT_REF>`) or in the project settings. **Note this down.**
    *   **(Complete Spotify Step 1):** Go back to your Spotify Developer Dashboard (Step 1). Add the Redirect URI using the Project Reference ID you just found: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`. **Save the settings in Spotify.**
    *   In your Supabase project dashboard:
        *   Go to **Authentication** (shield icon on the left).
        *   Go to **Providers** (or sometimes **Settings** under Authentication).
        *   Find **Spotify** and enable it using the toggle switch.
        *   It will ask for the **Client ID** and **Client Secret** you got from Spotify (Step 1). Copy and paste them here. **Make sure "Skip nonce check" is OFF (unchecked).**
        *   Click **Save**.
    *   Go to **Project Settings** (gear icon).
        *   Go to **API** section.
        *   You will find your **Project URL** and **Project API Keys**. You need the `anon` key (it's marked as `public`). **Note these down.** These will be used in your frontend code (as environment variables, see Step 4 below).

3.  **Vercel Project Setup:**
    *   Go to [Vercel.com](https://vercel.com/) and sign up (you can use your GitHub account).
    *   Click **Add New...** -> **Project**.
    *   **Import Git Repository:** Select the GitHub repository where your Pacer app code is stored (e.g., `AdamPGreen/pacer-app`). You might need to configure Vercel's access to your GitHub account.
    *   **Configure Project:**
        *   Vercel should automatically detect it's a Vite/React project. If not, select the correct framework preset (likely 'Vite').
        *   **Environment Variables:** This is crucial. Go to the project's **Settings** -> **Environment Variables**. Add the following variables (make sure they are available to the 'Production', 'Preview', and 'Development' environments):
            *   `VITE_SUPABASE_URL`: Paste the **Project URL** you noted from Supabase (Step 2).
            *   `VITE_SUPABASE_ANON_KEY`: Paste the `anon public` **Project API Key** you noted from Supabase (Step 2).
            *   **(Optional but Recommended):** `VITE_APP_URL`: Enter the main URL Vercel will assign to your deployment (e.g., `https://your-app-name.vercel.app`). You can find this URL after the first deployment. This helps Supabase redirect back correctly.
    *   Click **Deploy**. Wait for the deployment to finish. Vercel will give you a URL where your live app can be accessed (this is the URL you might use for `VITE_APP_URL` and for the Supabase Redirect URI in the next step).

4.  **Supabase Redirect URI Configuration:**
    *   Go back to your Supabase project dashboard.
    *   Go to **Authentication** (shield icon).
    *   Go to **URL Configuration** (might be under **Settings** within Authentication).
    *   In the **Site URL** field, enter the main URL of your deployed Vercel app (e.g., `https://your-app-name.vercel.app`).
    *   In the **Additional Redirect URLs** field, add the URL for your local development environment: `http://localhost:5173` (or whatever port Vite uses locally, usually shown in the terminal when you run `npm run dev`). Add any other deployment URLs (like preview URLs from Vercel, e.g., `https://your-app-name-git-preview-branch.vercel.app`) if needed. Use comma or newline separators as indicated by the Supabase UI.
    *   **Save** the settings.

**Summary:** You've told Spotify to trust redirects back to Supabase. You've told Supabase your Spotify App's secrets and where it's allowed to send users back to (your Vercel app or local dev). You've told Vercel how to find your Supabase backend.

---

## 2. Install Dependencies

1.  **Install Supabase Client Libraries:**
    ```bash
    npm install @supabase/supabase-js @supabase/auth-helpers-react @supabase/auth-ui-react @supabase/auth-ui-shared
    # or
    yarn add @supabase/supabase-js @supabase/auth-helpers-react @supabase/auth-ui-react @supabase/auth-ui-shared
    ```
    *   `@supabase/supabase-js`: Core Supabase client library.
    *   `@supabase/auth-helpers-react`: React hooks and helpers for Supabase Auth.
    *   `@supabase/auth-ui-react`: Pre-built UI components for login (optional, but helpful).
    *   `@supabase/auth-ui-shared`: Shared styles for the UI components.
2.  **(For Edge Functions):** Install Spotify API library if needed within functions (e.g., `spotify-web-api-node` - note Edge Functions use Deno runtime). This isn't installed in the main project.

## 3. Update Environment Variables

1.  **Create `.env` file:** In the root of your project, create a file named `.env` if it doesn't exist.
2.  **Add Supabase Credentials:**
    ```dotenv
    VITE_SUPABASE_URL=<YOUR_SUPABASE_PROJECT_URL>
    VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
    # Optional: Add VITE_APP_URL if you plan to use it in the code
    # VITE_APP_URL=http://localhost:5173
    ```
    *   Replace placeholders with the values from Supabase Project Settings -> API.
    *   **Important:** Use `http://localhost:5173` for `VITE_APP_URL` in your local `.env` file for testing redirects locally. The Vercel environment variable will have the production URL.
3.  **Ensure `.gitignore**:** Make sure `.env` is listed in your `.gitignore` file to avoid committing secrets.

## 4. Refactor Authentication (`SpotifyContext.tsx`)

1.  **Initialize Supabase Client:** Create a Supabase client instance, usually in a dedicated file.
    ```typescript
    // src/lib/supabaseClient.ts
    import { createClient } from '@supabase/supabase-js'

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL or Anon Key is missing. Check .env file.");
    }

    export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Optional: Configure persistence, auto-refresh, etc.
        // persistSession: true,
        // autoRefreshToken: true,
        // detectSessionInUrl: true // Default is true, handles OAuth callback hash
      }
    })
    ```
2.  **Update `src/context/SpotifyContext.tsx`:**
    *   **Remove `spotify-web-api-js`:** Delete imports and usage related to this library from the context.
    *   **Remove old auth state/logic:** Delete state like `isAuthenticated`, `accessToken`, `refreshToken`, `tokenExpiryTime`, implicit grant/PKCE logic, `login` (old version), `handleCallback`, `refreshToken`.
    *   **Use Supabase Auth Helpers:**
        *   Import `useSession` and `useSupabaseClient` from `@supabase/auth-helpers-react`.
        *   Get the current `session` using `useSession()`. Its presence indicates authentication.
        *   Get the Supabase client instance using `useSupabaseClient()`.
    *   **Implement `login` function:**
        *   Use the Supabase client: `supabase.auth.signInWithOAuth({ provider: 'spotify', options: { scopes: 'playlist-modify-public user-read-private user-read-email' } })`. Supabase handles the entire OAuth redirect and callback flow.
    *   **Implement `logout` function:**
        *   Use the Supabase client: `supabase.auth.signOut()`.
    *   **Provide Auth State:** Expose the `session` object (or a boolean `isAuthenticated = !!session`) and the `login`/`logout` functions.
    *   **Remove Direct API Call Functions:** Delete `createPlaylist` and `searchTracksByTempo`. These will be replaced by calls to Edge Functions (Step 6).
    *   **Add Edge Function Callers:** Implement new async functions (e.g., `searchTracks`, `createPlaylist`) that will use `supabase.functions.invoke(...)` to call the backend functions (defined in Step 6). These functions need to handle passing necessary parameters (genre, tempo, track URIs) and receiving results or errors. Ensure the authorization header is implicitly passed by the Supabase client when invoking functions.

```typescript
// Example structure for SpotifyContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
// Assuming client is initialized in src/lib/supabaseClient.ts
// You might not need to import it here if using hooks primarily

interface SpotifyContextType {
  session: Session | null;
  isLoadingSession: boolean; // Flag for initial session loading
  supabase: SupabaseClient; // Provide client if needed directly
  login: () => Promise<void>;
  logout: () => Promise<void>;
  searchTracks: (genre: string, targetTempo: number, limit: number) => Promise<any>; // Define specific return type later
  createPlaylist: (name: string, tracks: string[]) => Promise<{ playlistUrl: string }>; // Define specific return type
  error: string | null; // For handling Edge Function or Auth errors
  clearError: () => void;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const SpotifyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const session = useSession();
  const supabaseClient = useSupabaseClient();
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Handle initial session loading state
  useEffect(() => {
    // useSession() might initially be null then update.
    // Wait for the session to be definitively loaded (or stay null)
    // supabase.auth.getSession() could also be used here on initial mount
    // to confirm loading state more reliably if useSession is problematic.
    if (session !== undefined) {
        setIsLoadingSession(false);
    }

    // Listen for auth state changes to clear errors on login/logout
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        setError(null); // Clear error on auth change
        if (event === 'INITIAL_SESSION') {
           setIsLoadingSession(false);
        } else if (event === 'SIGNED_IN') {
           // Handle post-sign-in actions if needed
        } else if (event === 'SIGNED_OUT') {
          // Handle post-sign-out actions if needed
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [session, supabaseClient.auth]);


  const clearError = () => setError(null);

  const login = async () => {
    setError(null);
    const { error: loginError } = await supabaseClient.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        scopes: 'playlist-modify-public user-read-private user-read-email',
        // Optional: Redirect back to a specific page after login
        // redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/`
      },
    });
    if (loginError) {
        console.error('Error logging in:', loginError);
        setError(`Login failed: ${loginError.message}`);
    }
  };

  const logout = async () => {
    setError(null);
    const { error: logoutError } = await supabaseClient.auth.signOut();
    if (logoutError) {
        console.error('Error logging out:', logoutError);
        setError(`Logout failed: ${logoutError.message}`);
    }
  };

  // --- Edge Function Callers ---
  const searchTracks = async (genre: string, targetTempo: number, limit: number) => {
    setError(null);
    // Functions invoked this way automatically include the user's Auth header
    const { data, error: functionError } = await supabaseClient.functions.invoke('spotify-search', {
      body: { genre, targetTempo, limit },
    });
    if (functionError) {
      console.error('Error searching tracks:', functionError);
      setError(`Search failed: ${functionError.message}`);
      throw functionError; // Re-throw for component-level handling if needed
    }
    // Assuming the edge function returns the track list directly or { data: [...] }
    return data.data || data;
  };

  const createPlaylist = async (name: string, tracks: string[]) => {
    setError(null);
    const { data, error: functionError } = await supabaseClient.functions.invoke('spotify-create-playlist', {
      body: { name, tracks }, // Ensure tracks are Spotify URIs
    });
    if (functionError) {
      console.error('Error creating playlist:', functionError);
      setError(`Playlist creation failed: ${functionError.message}`);
      throw functionError;
    }
    // Assuming the edge function returns { playlistUrl: '...' }
    if (!data || !data.playlistUrl) {
      throw new Error("Playlist URL not returned from function.");
    }
    return data as { playlistUrl: string };
  };

  return (
    <SpotifyContext.Provider value={{
      session,
      isLoadingSession,
      supabase: supabaseClient, // Provide client if needed
      login,
      logout,
      searchTracks,
      createPlaylist,
      error,
      clearError
    }}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};
```

## 5. Update UI and Routing

1.  **Wrap App with Auth Helpers:** Modify `src/main.tsx` to initialize the Supabase client and wrap the app with `SessionContextProvider` from `@supabase/auth-helpers-react`. **Crucially, pass the initialized `supabaseClient` to the provider.**
    ```typescript
    // src/main.tsx
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import App from './App';
    import './index.css';
    import { SessionContextProvider } from '@supabase/auth-helpers-react';
    import { supabase } from './lib/supabaseClient'; // Import your initialized client

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        {/* Pass the initialized Supabase client here */}
        <SessionContextProvider supabaseClient={supabase}>
          {/* App now has access to Supabase session via hooks */}
          <App />
        </SessionContextProvider>
      </React.StrictMode>,
    );
    ```
2.  **Create Login Page Component (`src/pages/LoginPage.tsx`):**
    *   Use `useSpotify` to get the `login` function and `session` / `isLoadingSession`.
    *   If `isLoadingSession` is true, show a loading indicator.
    *   If `session` exists (and not loading), redirect to Home (`/`).
    *   Display a "Login with Spotify" button that calls `login()`.
    *   **(Alternative):** Use the pre-built `@supabase/auth-ui-react` component for a styled login experience.
        ```tsx
        // src/pages/LoginPage.tsx (using Auth UI)
        import React, { useEffect } from 'react';
        import { Auth } from '@supabase/auth-ui-react';
        import { ThemeSupa } from '@supabase/auth-ui-shared';
        import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
        import { useNavigate } from 'react-router-dom';
        import { useSpotify } from '../context/SpotifyContext'; // For error display

        const LoginPage: React.FC = () => {
          const session = useSession();
          const supabase = useSupabaseClient();
          const navigate = useNavigate();
          const { error, clearError } = useSpotify(); // Get error state

          useEffect(() => {
            if (session) {
              navigate('/', { replace: true }); // Redirect if session exists
            }
          }, [session, navigate]);

          // Clear previous errors when component mounts
           useEffect(() => {
             clearError();
             return () => clearError(); // Cleanup on unmount
           }, [clearError]);

          // Don't render login form if session exists (avoids flash)
          if (session) return null;

          return (
            <div>
              <h2>Login to Pacer</h2>
              {error && <p style={{ color: 'red' }}>Error: {error}</p>}
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['spotify']}
                // Ensure scopes match what your app needs & Edge Functions expect
                queryParams={{
                   scope: 'playlist-modify-public user-read-private user-read-email',
                }}
                // Only show Spotify button
                onlyThirdPartyProviders={true}
                // Optional: Redirect URL after successful login by Supabase
                // redirectTo={`${import.meta.env.VITE_APP_URL || window.location.origin}/`}
              />
            </div>
          );
        };

        export default LoginPage;
        ```
3.  **Remove Callback Component:** Supabase handles the OAuth callback automatically based on the URL (`/auth/v1/callback`) configured in Spotify Dev Dashboard. Delete any existing `src/pages/CallbackPage.tsx`.
4.  **Update Routing (`src/App.tsx`):**
    *   **Ensure `SpotifyProvider` is within `SessionContextProvider`:** This order might matter. Check `main.tsx`. It's generally `<SessionContextProvider><YourAppProviders><App/></YourAppProviders></SessionContextProvider>`. In this case, `App.tsx` will likely wrap things in `SpotifyProvider`.
    *   Remove the `/callback` route.
    *   **Implement `ProtectedRoute`:** This component prevents access to routes unless a user session exists.
    ```tsx
    // src/components/ProtectedRoute.tsx (Example)
    import React from 'react';
    import { Navigate, Outlet } from 'react-router-dom';
    import { useSession } from '@supabase/auth-helpers-react'; // Or use useSpotify hook

    const ProtectedRoute: React.FC = () => {
      const session = useSession();
      const isLoading = session === undefined; // useSession is undefined initially

      if (isLoading) {
         // Optional: Show a loading spinner/page while session is checked
         return <div>Loading session...</div>;
      }

      if (!session) {
        // User not logged in, redirect to login page
        return <Navigate to="/login" replace />;
      }

      // User is logged in, render the nested routes (children)
      return <Outlet />;
    };

    export default ProtectedRoute;
    ```
    *   Modify `src/App.tsx` to use this `ProtectedRoute` for `/` and `/results`, and place `SpotifyProvider` correctly.
    ```typescript
    // src/App.tsx (Example Structure)
    import React from 'react';
    import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
    import Layout from './components/Layout/Layout';
    import Home from './pages/Home';
    import Results from './pages/Results';
    import LoginPage from './pages/LoginPage';
    import ProtectedRoute from './components/ProtectedRoute'; // Import the guard
    import { RunContextProvider } from './context/RunContext';
    import { SpotifyProvider } from './context/SpotifyContext';

    function App() {
      return (
        // SpotifyProvider likely needs access to the Supabase client/session
        // provided by SessionContextProvider in main.tsx, so it goes inside.
        <SpotifyProvider>
          <RunContextProvider>
            <Router>
              <Layout> {/* Assuming Layout contains header/footer */}
                <Routes>
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/results" element={<Results />} />
                    {/* Add other protected routes here */}
                  </Route>

                  {/* Optional: Add a 404 Not Found route */}
                  {/* <Route path="*" element={<NotFoundPage />} /> */}
                </Routes>
              </Layout>
            </Router>
          </RunContextProvider>
        </SpotifyProvider>
      );
    }

    export default App;
    ```
5.  **Update Header/UI:**
    *   Use `useSpotify` to get `session` and `logout`.
    *   Show user info (e.g., `session.user.email`) and a "Logout" button if `session` exists. Call `logout()` onClick.
6.  **Update Home/Results Pages:**
    *   Adapt these pages to use the new `searchTracks` and `createPlaylist` async functions from `useSpotify` which call the Edge Functions.
    *   Handle loading states and display errors from the `error` state in `useSpotify`. Remember the function calls are now async network requests to your Supabase backend.

## 6. Create Supabase Edge Functions

**Goal:** Create backend functions (`Deno` runtime) that securely use the user's Spotify token (managed by Supabase Auth) to interact with the Spotify API.

1.  **Install Supabase CLI:** If not already installed: `npm install supabase --save-dev`. Follow any platform-specific instructions.
2.  **Login:** `npx supabase login` (or `supabase login` if installed globally).
3.  **Link Project:** In your project root: `npx supabase link --project-ref <YOUR_PROJECT_REF>` (Use the ID from Step 1.2). Follow prompts to link.
4.  **Create Functions:**
    *   `npx supabase functions new spotify-search`
    *   `npx supabase functions new spotify-create-playlist`
    *   This creates folders under `supabase/functions/`.
5.  **Implement `spotify-search` (`supabase/functions/spotify-search/index.ts`):**
    *   This function needs to receive `genre`, `targetTempo`, `limit`.
    *   It must securely get the calling user's Spotify `provider_token` from the Supabase session.
    *   It needs to call the Spotify API `/v1/search` or `/v1/recommendations` (as `/search` doesn't filter by tempo). If using search, it must then call `/v1/audio-features` for the found tracks and filter them by tempo.
    *   Handle Spotify API errors and potential token expiry/refresh (more complex, see notes).
    *   Return the list of matching tracks.

    ```typescript
    // supabase/functions/spotify-search/index.ts
    import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
    import { corsHeaders } from '../_shared/cors.ts' // Create this file for CORS headers

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
        // TODO: Add token refresh logic here if possible/needed, potentially requiring Spotify Client Secret access

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

        // Alternatively, implement Search + Audio Features filtering here if needed

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

    // Create supabase/functions/_shared/cors.ts
    // export const corsHeaders = {
    //  'Access-Control-Allow-Origin': '*', // Or specific origin
    //  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    // }
    ```
6.  **Implement `spotify-create-playlist` (`supabase/functions/spotify-create-playlist/index.ts`):**
    *   Receives `name`, `tracks` (array of Spotify track URIs).
    *   Gets user's Spotify token.
    *   Calls Spotify API: `/v1/me` (to get user ID), `/v1/users/{user_id}/playlists` (to create), `/v1/playlists/{playlist_id}/tracks` (to add tracks, handling pagination if >100 tracks).
    *   Return the `{ playlistUrl: '...' }` or an error.

    ```typescript
    // supabase/functions/spotify-create-playlist/index.ts
    import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
    import { corsHeaders } from '../_shared/cors.ts' // Re-use CORS headers

    // Re-use fetchSpotifyApi function from search or define it here

    serve(async (req: Request) => {
       if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
      }

      try {
        // 1. Create Supabase client with user's auth context (Same as search)
         const supabaseClient = createClient(/*...*/);

        // 2. Get user session and verify Spotify provider token (Same as search)
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
    ```
7.  **Set up CORS:** Create `supabase/functions/_shared/cors.ts` as shown in the comments above to handle Cross-Origin Resource Sharing, necessary for your Vercel frontend to call the Supabase functions. Adjust `Access-Control-Allow-Origin` to your Vercel URL in production for better security instead of `*`.
8.  **Deploy Functions:**
    *   Deploy each function: `npx supabase functions deploy spotify-search` and `npx supabase functions deploy spotify-create-playlist`.
    *   **Security:** Ensure JWT verification is *not* skipped in production. The Supabase client helpers usually handle sending the correct `Authorization: Bearer <supabase-jwt>` header automatically when using `supabase.functions.invoke`. Check Supabase Function logs if you encounter auth errors.
    *   **Secrets:** If implementing token refresh, you'll need the Spotify Client ID and Secret available to the Edge Function. Use Supabase Vault for this: `npx supabase secrets set SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=...` and access them via `Deno.env.get()`.

## 7. Testing

1.  **Configuration:** Meticulously check all steps in Section 1. Redirect URIs, Client IDs/Secrets in Supabase Providers, Supabase URLs/Keys in Vercel/local `.env`.
2.  **Local Auth Flow:** Run app locally (`npm run dev`). Test login via Spotify button. Check redirection back to `localhost:5173` (or your port). Verify session is created (e.g., log `session` in `App.tsx`). Test logout. Test accessing protected pages while logged out redirects to `/login`.
3.  **Local Edge Function Calls:** Test `searchTracks` and `createPlaylist` from the local app. Check the browser's network tab to see calls to Supabase functions (`/functions/v1/...`). Check Supabase function logs on the dashboard (Project -> Functions -> Select Function -> Invocations/Logs) for execution details and errors.
4.  **Deployment:** Push code changes to GitHub. Verify Vercel deployment succeeds.
5.  **Deployed Auth Flow:** Test login/logout on the live Vercel URL. Check Supabase URL Configuration (Redirect URIs) includes the Vercel URL.
6.  **Deployed Edge Function Calls:** Test search/playlist creation on the live Vercel app. Check Supabase function logs.
7.  **Token Handling:** While Supabase handles sessions, ensure Spotify API calls work reliably. Complex token refresh logic might need specific testing if implemented in Edge Functions.
8.  **Persistence:** Refresh the page while logged in (local and deployed). Verify the session persists.

This updated plan leverages Supabase for heavy lifting (auth, secure token storage, backend logic via Edge Functions), simplifying the frontend React code and aligning with modern serverless deployment practices on Vercel.
