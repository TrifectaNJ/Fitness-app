import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import AdminSignupFormUI from './AdminSignupFormUI';

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

const AdminSignupForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setIsAdmin } = useAppContext();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid or missing invite token');
        setCheckingToken(false);
        return;
      }

      // Check connection first
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        setError('Unable to connect to the server. Please check your internet connection and refresh the page.');
        setCheckingToken(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('admin_invites')
          .select('*')
          .eq('token', token)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (fetchError) {
          if (isNetworkError(fetchError)) {
            setError('Unable to connect to the server. Please check your internet connection and refresh the page.');
          } else {
            setError('Invalid or expired invite token');
          }
        } else if (!data) {
          setError('Invalid or expired invite token');
        } else {
          setValidToken(true);
          setInviteData(data);
          setFormData(prev => ({ ...prev, email: data.email }));
        }
      } catch (err: any) {
        if (isNetworkError(err)) {
          setError('Unable to connect to the server. Please check your internet connection and refresh the page.');
        } else {
          setError('Failed to validate invite token');
        }
      } finally {
        setCheckingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    // Check connection first
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      setError('Unable to connect to the server. Please check your internet connection and try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Calling create-admin-invite function with:', {
        action: 'create_admin_user',
        email: formData.email,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        token: token
      });

      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-admin-invite', {
        body: {
          action: 'create_admin_user',
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          token: token
        }
      });

      console.log('Function response:', { functionData, functionError });

      if (functionError) {
        console.error('Function invocation error:', functionError);
        if (isNetworkError(functionError)) {
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        }
        throw new Error(`Function error: ${functionError.message}`);
      }

      if (functionData?.error) {
        console.error('Function returned error:', functionData.error);
        throw new Error(functionData.error);
      }

      if (!functionData?.success) {
        console.error('Function did not return success:', functionData);
        throw new Error('Admin account creation failed - no success response');
      }

      console.log('Admin user created successfully:', functionData);

      // Sign in the new user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        console.error('Sign-in error:', signInError);
        if (isNetworkError(signInError)) {
          throw new Error('Account created but unable to sign in due to network issues. Please try signing in manually.');
        }
        throw new Error('Account created but sign-in failed. Please try signing in manually.');
      }

      setSuccess('Admin account created successfully! Redirecting...');
      setIsAdmin(true);
      
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
      
    } catch (err: any) {
      console.error('Signup error:', err);
      if (isNetworkError(err)) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Failed to create admin account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminSignupFormUI
      formData={formData}
      setFormData={setFormData}
      handleSubmit={handleSubmit}
      loading={loading}
      error={error}
      success={success}
      checkingToken={checkingToken}
      validToken={validToken}
    />
  );
};

export default AdminSignupForm;
