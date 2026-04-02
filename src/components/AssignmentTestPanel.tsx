import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Users, MessageCircle } from 'lucide-react';

export const AssignmentTestPanel = () => {
  const [testData, setTestData] = useState<any>({});
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

  const runTest = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Check current user info
      results.currentUser = {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.profile?.role,
        name: currentUser.profile?.full_name || `${currentUser.profile?.first_name} ${currentUser.profile?.last_name}`
      };

      // Test 2: Direct assignment query (same as RealtimeCoachInbox)
      const { data: assignments, error: assignError } = await supabase
        .from('coach_assignments')
        .select('user_id')
        .eq('coach_id', currentUser.id);

      results.assignments = {
        data: assignments,
        error: assignError?.message,
        count: assignments?.length || 0
      };

      // Test 3: Get user profiles for assigned users
      if (assignments && assignments.length > 0) {
        const userIds = assignments.map(a => a.user_id);
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', userIds);

        results.userProfiles = {
          data: profiles,
          error: profileError?.message,
          count: profiles?.length || 0
        };

        // Test 4: Check for messages from these users
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .in('sender_id', userIds)
          .eq('receiver_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(5);

        results.messages = {
          data: messages,
          error: msgError?.message,
          count: messages?.length || 0
        };
      }

      setTestData(results);
    } catch (error) {
      console.error('Test error:', error);
      results.error = error;
      setTestData(results);
    }
    
    setLoading(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assignment Test Panel
          </span>
          <Button onClick={runTest} disabled={loading}>
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Run Test
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {testData.currentUser && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-bold text-blue-800 mb-2">👤 CURRENT USER:</h4>
            <div className="text-sm">
              <p><strong>ID:</strong> {testData.currentUser.id}</p>
              <p><strong>Email:</strong> {testData.currentUser.email}</p>
              <p><strong>Role:</strong> {testData.currentUser.role}</p>
              <p><strong>Name:</strong> {testData.currentUser.name}</p>
            </div>
          </div>
        )}

        {testData.assignments && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h4 className="font-bold text-green-800 mb-2">
              📋 ASSIGNMENTS ({testData.assignments.count}):
            </h4>
            {testData.assignments.error && (
              <p className="text-red-600 mb-2">Error: {testData.assignments.error}</p>
            )}
            <pre className="text-xs bg-white p-2 rounded overflow-auto">
              {JSON.stringify(testData.assignments.data, null, 2)}
            </pre>
          </div>
        )}

        {testData.userProfiles && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-bold text-purple-800 mb-2">
              👥 USER PROFILES ({testData.userProfiles.count}):
            </h4>
            {testData.userProfiles.error && (
              <p className="text-red-600 mb-2">Error: {testData.userProfiles.error}</p>
            )}
            <div className="space-y-2">
              {testData.userProfiles.data?.map((profile: any) => (
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

        {testData.messages && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-bold text-yellow-800 mb-2">
              💬 MESSAGES ({testData.messages.count}):
            </h4>
            {testData.messages.error && (
              <p className="text-red-600 mb-2">Error: {testData.messages.error}</p>
            )}
            <div className="space-y-2">
              {testData.messages.data?.map((msg: any) => (
                <div key={msg.id} className="p-2 bg-white rounded text-sm">
                  <p>{msg.message || msg.content}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {testData.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-bold text-red-800 mb-2">❌ ERROR:</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-auto">
              {JSON.stringify(testData.error, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};