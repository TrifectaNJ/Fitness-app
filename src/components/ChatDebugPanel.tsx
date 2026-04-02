import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Database, Users, MessageCircle } from 'lucide-react';

export const ChatDebugPanel = () => {
  const [debugData, setDebugData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentUser({ ...user, profile });
    }
  };

  const runDiagnostics = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    const results: any = {};

    try {
      // Step 1: Check user role and profile
      results.step1_user_info = {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.profile?.role,
        name: currentUser.profile?.full_name || `${currentUser.profile?.first_name} ${currentUser.profile?.last_name}`
      };

      // Step 2: Check coach assignments table
      const { data: assignments, error: assignError } = await supabase
        .from('coach_assignments')
        .select('*')
        .eq('coach_id', currentUser.id);

      results.step2_assignments = {
        data: assignments,
        error: assignError?.message,
        count: assignments?.length || 0
      };

      // Step 3: Get user profiles for assigned users
      if (assignments && assignments.length > 0) {
        const userIds = assignments.map(a => a.user_id);
        const { data: userProfiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', userIds);

        results.step3_user_profiles = {
          data: userProfiles,
          error: profileError?.message,
          count: userProfiles?.length || 0
        };

        // Step 4: Check messages for these users
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.in.(${userIds.join(',')}),receiver_id.in.(${userIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(10);

        results.step4_messages = {
          data: messages,
          error: msgError?.message,
          count: messages?.length || 0
        };
      }

      // Step 5: Test direct assignment query (what RealtimeCoachInbox uses)
      const { data: directAssignments, error: directError } = await supabase
        .from('coach_assignments')
        .select('user_id')
        .eq('coach_id', currentUser.id);

      results.step5_direct_query = {
        data: directAssignments,
        error: directError?.message,
        count: directAssignments?.length || 0
      };

      setDebugData(results);
    } catch (error) {
      console.error('Debug error:', error);
      results.error = error;
      setDebugData(results);
    }
    
    setLoading(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Chat System Debug Panel
          </span>
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Run Diagnostics
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentUser && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800">No current user found. Please log in.</p>
          </div>
        )}

        {debugData.step1_user_info && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-bold text-blue-800 mb-2">✅ CURRENT USER INFO:</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-auto">
              {JSON.stringify(debugData.step1_user_info, null, 2)}
            </pre>
          </div>
        )}

        {debugData.step2_assignments && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h4 className="font-bold text-green-800 mb-2">
              📋 COACH ASSIGNMENTS ({debugData.step2_assignments.count}):
            </h4>
            {debugData.step2_assignments.error && (
              <p className="text-red-600 mb-2">Error: {debugData.step2_assignments.error}</p>
            )}
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(debugData.step2_assignments.data, null, 2)}
            </pre>
          </div>
        )}

        {debugData.step3_user_profiles && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-bold text-purple-800 mb-2">
              👥 ASSIGNED USER PROFILES ({debugData.step3_user_profiles.count}):
            </h4>
            {debugData.step3_user_profiles.error && (
              <p className="text-red-600 mb-2">Error: {debugData.step3_user_profiles.error}</p>
            )}
            <div className="space-y-2">
              {debugData.step3_user_profiles.data?.map((profile: any) => (
                <div key={profile.id} className="p-2 bg-white rounded text-sm">
                  <strong>{profile.full_name || `${profile.first_name} ${profile.last_name}`}</strong>
                  <br />
                  Email: {profile.email}
                  <br />
                  ID: {profile.id}
                </div>
              ))}
            </div>
          </div>
        )}

        {debugData.step4_messages && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-bold text-yellow-800 mb-2">
              💬 RECENT MESSAGES ({debugData.step4_messages.count}):
            </h4>
            {debugData.step4_messages.error && (
              <p className="text-red-600 mb-2">Error: {debugData.step4_messages.error}</p>
            )}
            <div className="space-y-2 max-h-60 overflow-auto">
              {debugData.step4_messages.data?.map((msg: any) => (
                <div key={msg.id} className="p-2 bg-white rounded text-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">
                      {msg.sender_id === currentUser?.id ? 'You' : 'User'}
                    </span>
                    <Badge variant={msg.is_read ? 'secondary' : 'destructive'}>
                      {msg.is_read ? 'Read' : 'Unread'}
                    </Badge>
                  </div>
                  <p className="mt-1">{msg.message || msg.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {debugData.step5_direct_query && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded">
            <h4 className="font-bold text-indigo-800 mb-2">
              🔍 DIRECT ASSIGNMENT QUERY ({debugData.step5_direct_query.count}):
            </h4>
            <p className="text-sm mb-2">This is the exact query used by RealtimeCoachInbox:</p>
            {debugData.step5_direct_query.error && (
              <p className="text-red-600 mb-2">Error: {debugData.step5_direct_query.error}</p>
            )}
            <pre className="text-xs bg-white p-2 rounded overflow-auto">
              {JSON.stringify(debugData.step5_direct_query.data, null, 2)}
            </pre>
          </div>
        )}

        {debugData.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-bold text-red-800 mb-2">❌ SYSTEM ERROR:</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-auto">
              {JSON.stringify(debugData.error, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};