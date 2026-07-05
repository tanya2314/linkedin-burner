import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // If Supabase is not configured, bypass login check to let the user review the UI.
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking auth session:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-accent-purple mb-4" />
        <p className="text-sm font-medium tracking-wide animate-pulse">Verifying authentication session...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
