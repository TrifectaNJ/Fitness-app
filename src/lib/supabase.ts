import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

// Custom fetch with timeout and retry logic
const fetchWithRetry = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 2,
  timeout = 15000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchOptions: RequestInit = {
    ...init,
    signal: controller.signal,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(input, fetchOptions);
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      lastError = error;
      clearTimeout(timeoutId);

      // Don't retry if it was aborted intentionally or if we've exhausted retries
      if (error.name === 'AbortError' && attempt === retries) {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }

      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Create a new timeout for the retry
      const newController = new AbortController();
      const newTimeoutId = setTimeout(() => newController.abort(), timeout);
      fetchOptions.signal = newController.signal;
      
      console.log(`Retrying request (attempt ${attempt + 2}/${retries + 1})...`);
    }
  }

  // If we get here, all retries failed
  if (lastError) {
    if (lastError.message?.includes('Failed to fetch') || lastError.name === 'TypeError') {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    throw lastError;
  }

  throw new Error('Request failed after multiple attempts');
};

// Create Supabase client with enhanced configuration
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'murray-mania-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    fetch: fetchWithRetry,
    headers: {
      'X-Client-Info': 'murray-mania-app',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to check if Supabase is reachable
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': key,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    // 400/401/403 all mean the server is reachable (auth/validation errors, not network errors)
    return response.ok || response.status === 400 || response.status === 401 || response.status === 403;
  } catch {
    return false;
  }
};

// Export URL for debugging
export const supabaseUrl = url;
