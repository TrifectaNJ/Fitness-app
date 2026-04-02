import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { Loader2, Mail, Lock, User, WifiOff, RefreshCw } from 'lucide-react';

interface MobileAuthFormProps {
  onAuthSuccess: (user: any, isAdmin?: boolean) => void;
  adminOnly?: boolean;
}

// Helper function to detect network errors
const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('abort') ||
    message.includes('unable to connect') ||
    message.includes('internet connection') ||
    error.name === 'AbortError' ||
    error.name === 'TypeError' ||
    error.code === 'NETWORK_ERROR'
  );
};

// Helper to get user-friendly error message
const getUserFriendlyError = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  const message = error.message || '';
  
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and confirm your account before signing in.';
  }
  
  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  
  return message || 'An error occurred. Please try again.';
};

export const MobileAuthForm: React.FC<MobileAuthFormProps> = ({ onAuthSuccess, adminOnly = false }) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNetworkIssue, setIsNetworkIssue] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [retryCount, setRetryCount] = useState(0);

  // Check connection on mount and when retry is clicked
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus('checking');
      const isConnected = await checkSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };
    
    checkConnection();
  }, [retryCount]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsNetworkIssue(false);

    // Check connection first
    if (connectionStatus === 'disconnected') {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        setIsNetworkIssue(true);
        setError('Unable to connect to the server. Please check your internet connection and try again.');
        setLoading(false);
        return;
      }
      setConnectionStatus('connected');
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (authError) {
        const isNetwork = isNetworkError(authError);
        setIsNetworkIssue(isNetwork);
        setError(getUserFriendlyError(authError));
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Sign in failed. Please try again.');
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        const isAdmin = profile?.role === 'admin' || profile?.role === 'coach' || profile?.role === 'super_admin';
        
        if (adminOnly && !isAdmin) {
          setError('Admin access required');
          setLoading(false);
          return;
        }
        
        onAuthSuccess(data.user, isAdmin);
      } catch (profileError: any) {
        // If we can't fetch profile but auth succeeded, still allow login
        if (isNetworkError(profileError)) {
          console.warn('Network error fetching profile, proceeding with login');
          onAuthSuccess(data.user, false);
        } else {
          console.warn('Could not fetch profile:', profileError);
          onAuthSuccess(data.user, false);
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      const isNetwork = isNetworkError(error);
      setIsNetworkIssue(isNetwork);
      setError(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    setIsNetworkIssue(false);

    // Check connection first
    if (connectionStatus === 'disconnected') {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        setIsNetworkIssue(true);
        setError('Unable to connect to the server. Please check your internet connection and try again.');
        setLoading(false);
        return;
      }
      setConnectionStatus('connected');
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });

      if (signUpError) {
        const isNetwork = isNetworkError(signUpError);
        setIsNetworkIssue(isNetwork);
        setError(getUserFriendlyError(signUpError));
        setLoading(false);
        return;
      }

      if (data.user) {
        const nameParts = name.trim().split(' ');
        try {
          await supabase.from('user_profiles').insert({
            id: data.user.id,
            email: data.user.email,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            role: 'user',
            purchased_programs: [],
          });
        } catch (profileError) {
          console.warn('Error creating user profile:', profileError);
        }
        
        onAuthSuccess(data.user, false);
      } else {
        setError('Sign up failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      const isNetwork = isNetworkError(error);
      setIsNetworkIssue(isNetwork);
      setError(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setError('');
    setIsNetworkIssue(false);
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="https://d64gsuwffb70l.cloudfront.net/683f455091f9cbb716202747_1750122931110_fd1cfd7e.png" 
            alt="Logo" 
            className="w-24 h-24 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignIn ? 'Welcome Back' : 'Create Your Account'}
          </h1>
          <p className="text-gray-400">
            {isSignIn ? 'Sign in to continue' : 'Join Murray Mania today'}
          </p>
          
          {/* Connection status indicator */}
          {connectionStatus === 'disconnected' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">Connection issues detected</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsSignIn(true)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                isSignIn ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sign In
            </button>
            {!adminOnly && (
              <button
                onClick={() => setIsSignIn(false)}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  !isSignIn ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Sign Up
              </button>
            )}
          </div>

          <form onSubmit={isSignIn ? handleSignIn : handleSignUp} className="space-y-4">
            {!isSignIn && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-12 h-14 border-2 border-gray-200 rounded-xl focus:border-orange-500"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 border-2 border-gray-200 rounded-xl focus:border-orange-500"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                <Input
                  type="password"
                  placeholder={isSignIn ? 'Enter your password' : 'Create a password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 border-2 border-gray-200 rounded-xl focus:border-orange-500"
                  required
                  minLength={6}
                  autoComplete={isSignIn ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {!isSignIn && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 h-14 border-2 border-gray-200 rounded-xl focus:border-orange-500"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {error && (
              <Alert 
                variant={isNetworkIssue ? "default" : "destructive"}
                className={isNetworkIssue ? "border-yellow-500 bg-yellow-50" : ""}
              >
                <div className="flex items-start gap-2">
                  {isNetworkIssue && <WifiOff className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />}
                  <AlertDescription className={isNetworkIssue ? "text-yellow-800" : ""}>
                    {error}
                  </AlertDescription>
                </div>
                {isNetworkIssue && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="mt-2 border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Check Connection & Retry
                  </Button>
                )}
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-lg"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? (isSignIn ? 'Signing In...' : 'Creating Account...') : (isSignIn ? 'Sign In' : 'Sign Up')}
            </Button>

            {isSignIn && (
              <button
                type="button"
                onClick={async () => {
                  if (!email.trim()) {
                    setError('Please enter your email address first');
                    return;
                  }
                  setLoading(true);
                  try {
                    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
                    if (resetError) {
                      if (isNetworkError(resetError)) {
                        setIsNetworkIssue(true);
                        setError('Unable to connect to the server. Please check your internet connection and try again.');
                      } else {
                        setError('Failed to send reset email: ' + resetError.message);
                      }
                    } else {
                      setError('');
                      alert('Password reset email sent! Please check your inbox.');
                    }
                  } catch (error: any) {
                    if (isNetworkError(error)) {
                      setIsNetworkIssue(true);
                      setError('Unable to connect to the server. Please check your internet connection and try again.');
                    } else {
                      setError('Failed to send reset email');
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-semibold disabled:opacity-50"
              >
                Forgot your password?
              </button>
            )}

            <p className="text-center text-sm text-gray-600 mt-4">
              {isSignIn ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsSignIn(!isSignIn)}
                className="text-orange-600 font-semibold hover:text-orange-700"
              >
                {isSignIn ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MobileAuthForm;
