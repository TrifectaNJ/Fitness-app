import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import StyleableComponent from '@/components/StyleableComponent';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { Loader2, Mail, Lock, User, RefreshCw, WifiOff, AlertCircle } from 'lucide-react';

interface AuthFormProps {
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

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess, adminOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNetworkIssue, setIsNetworkIssue] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
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
        password,
      });

      if (authError) {
        const isNetwork = isNetworkError(authError);
        setIsNetworkIssue(isNetwork);
        
        if (isNetwork) {
          setError('Unable to connect to the server. Please check your internet connection and try again.');
          setLoading(false);
          return;
        }

        // Check if this is an admin invite user who hasn't completed signup
        if (authError.message === 'Invalid login credentials') {
          try {
            const { data: invite } = await supabase
              .from('admin_invites')
              .select('*')
              .eq('email', email.trim())
              .eq('used', false)
              .single();

            if (invite) {
              if (!invite.expires_at || new Date(invite.expires_at) > new Date()) {
                setError('This account was created through an admin invite. Please check your email for the invite link to complete your account setup, or contact support.');
              } else {
                setError('This account was created through an admin invite that has expired. Please contact support to get a new invite.');
              }
              setLoading(false);
              return;
            }
          } catch (inviteError) {
            console.warn('Could not check admin invites:', inviteError);
          }
        }
        
        setError(getUserFriendlyError(authError));
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Sign in failed. Please try again.');
        setLoading(false);
        return;
      }

      // Fetch user profile
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const isAdmin = profile?.role === 'admin' || profile?.role === 'coach' || profile?.role === 'super_admin';
        
        if (adminOnly && !isAdmin) {
          setError('Admin access required. Please contact support if you believe this is an error.');
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
          // Profile might not exist yet, proceed anyway
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
    if (adminOnly) {
      setError('Admin signup not allowed');
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
        options: {
          data: { name: name.trim() },
        },
      });

      if (signUpError) {
        const isNetwork = isNetworkError(signUpError);
        setIsNetworkIssue(isNetwork);
        setError(getUserFriendlyError(signUpError));
        setLoading(false);
        return;
      }

      if (data.user) {
        // Split name into first and last name
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        try {
          await supabase.from('user_profiles').insert({
            id: data.user.id,
            email: data.user.email,
            first_name: firstName,
            last_name: lastName,
            role: 'user',
            purchased_programs: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } catch (profileError: any) {
          // If profile creation fails, log but don't block signup
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

  const handlePasswordReset = async () => {
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
          setError(getUserFriendlyError(resetError));
        }
      } else {
        setError('');
        setIsNetworkIssue(false);
        // Show success message
        alert('Password reset email sent! Please check your inbox.');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (isNetworkError(error)) {
        setIsNetworkIssue(true);
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundWrapper page="loginPage">
      <StyleableComponent pageKey="loginPage">
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">

            <div className="text-center">
              <div className="flex justify-center mb-6">
                <img 
                  src="https://d64gsuwffb70l.cloudfront.net/683f455091f9cbb716202747_1750122931110_fd1cfd7e.png" 
                  alt="Murray Mania Logo" 
                  className="w-20 h-20 object-contain"
                />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold bg-gradient-to-r from-orange-500 via-blue-600 to-gray-800 bg-clip-text text-transparent">
                {adminOnly ? 'Murray Mania Admin' : 'Welcome to Murray Mania'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {adminOnly ? 'Admin credentials required' : 'Sign in to access your fitness programs'}
              </p>
              
              {/* Connection status indicator */}
              {connectionStatus === 'disconnected' && (
                <div className="mt-4 flex items-center justify-center gap-2 text-yellow-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Connection issues detected</span>
                </div>
              )}
            </div>

            <Card className="border-2 border-orange-200 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-orange-100 to-blue-100">
                    <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:text-orange-600">Sign In</TabsTrigger>
                    {!adminOnly && <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">Sign Up</TabsTrigger>}
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 border-orange-200 focus:border-orange-400"
                            required
                            autoComplete="email"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 border-orange-200 focus:border-orange-400"
                            required
                            autoComplete="current-password"
                          />
                        </div>
                      </div>
                      
                      {error && (
                        <Alert 
                          variant={isNetworkIssue ? "default" : "destructive"} 
                          className={isNetworkIssue ? "border-yellow-500 bg-yellow-50" : ""}
                        >
                          <div className="flex items-start gap-2">
                            {isNetworkIssue ? (
                              <WifiOff className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            )}
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
                        className="w-full bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700" 
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Button>
                      
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={loading}
                          className="text-sm text-orange-600 hover:text-orange-700 underline disabled:opacity-50"
                        >
                          Forgot your password?
                        </button>
                      </div>
                    </form>
                  </TabsContent>

                  {!adminOnly && (
                    <TabsContent value="signup">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                            <Input
                              id="name"
                              type="text"
                              placeholder="Enter your full name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="pl-10 border-blue-200 focus:border-blue-400"
                              required
                              autoComplete="name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 border-blue-200 focus:border-blue-400"
                              required
                              autoComplete="email"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                            <Input
                              id="signup-password"
                              type="password"
                              placeholder="Create a password (min 6 characters)"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 border-blue-200 focus:border-blue-400"
                              required
                              minLength={6}
                              autoComplete="new-password"
                            />
                          </div>
                        </div>
                        
                        {error && (
                          <Alert 
                            variant={isNetworkIssue ? "default" : "destructive"} 
                            className={isNetworkIssue ? "border-yellow-500 bg-yellow-50" : ""}
                          >
                            <div className="flex items-start gap-2">
                              {isNetworkIssue ? (
                                <WifiOff className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              )}
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
                          className="w-full bg-gradient-to-r from-blue-500 to-orange-600 hover:from-blue-600 hover:to-orange-700" 
                          disabled={loading}
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {loading ? 'Creating Account...' : 'Sign Up'}
                        </Button>
                      </form>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Privacy Policy Link */}
            <div className="text-center mt-6">
              <button
                onClick={() => setShowPrivacyPolicy(true)}
                className="text-sm text-gray-600 hover:text-orange-600 underline transition-colors"
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
        
        <PrivacyPolicyModal 
          isOpen={showPrivacyPolicy} 
          onClose={() => setShowPrivacyPolicy(false)} 
        />
      </StyleableComponent>
    </BackgroundWrapper>
  );
};

export default AuthForm;
