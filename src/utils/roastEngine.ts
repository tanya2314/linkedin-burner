import { supabase, isSupabaseConfigured } from '../supabaseClient';

export interface RoastResult {
  roast: string;
  rewrite: string;
}

/**
 * Sends LinkedIn post text or screenshot image to the Supabase "get-roast" Edge Function
 * and returns the AI-generated Roast and professional Rewrite.
 * 
 * @param input Raw text or base64 data URL representing a screenshot
 * @param mode 'roast' for a funny critique, 'constructive' for an encouraging review
 */
export async function getRoast(input: string, mode: 'roast' | 'constructive'): Promise<RoastResult> {
  // 1. Verify if Supabase is properly configured
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to run the real AI Roast engine."
    );
  }

  // 2. Initialize variables for request payload
  let text: string | undefined = undefined;
  let imageBase64: string | undefined = undefined;

  // 3. Detect if input is a base64 image (screenshot) or raw text
  if (input.startsWith('data:image')) {
    // Strip data URL prefix (e.g. "data:image/png;base64,") to get raw base64 string
    const commaIndex = input.indexOf(',');
    if (commaIndex !== -1) {
      imageBase64 = input.substring(commaIndex + 1);
    } else {
      imageBase64 = input;
    }
  } else {
    text = input;
  }

  // 4. Invoke the Supabase Edge Function 'get-roast'
  const { data, error } = await supabase.functions.invoke('get-roast', {
    body: { text, imageBase64, mode }
  });

  // 5. Check for function execution errors
  if (error) {
    console.error('Supabase Edge Function invocation error:', error);
    throw new Error("Failed to generate roast. Please check your connection and try again.");
  }

  // 6. Validate the response payload contains roast and rewrite
  if (!data || typeof data.roast !== 'string' || typeof data.rewrite !== 'string') {
    console.error('Invalid response structure received from edge function:', data);
    throw new Error("Failed to generate roast. Please try again.");
  }

  // 7. Return the structured roast result
  return {
    roast: data.roast,
    rewrite: data.rewrite
  };
}
