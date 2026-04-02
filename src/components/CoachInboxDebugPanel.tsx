import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export const CoachInboxDebugPanel = () => {
  const [debugData, setDebugData] = useState<any>({});
  const [currentCoach, setCurrentCoach] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runFullDebug = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Step 1: Get current user
      const { data: { user } } = await supabase.auth.getUser();
      results.step1_auth_user = user ? { id: user.id, email: user.email } : 'NO USER';
      setCurrentCoach(user);

      if (!user) {
        setDebugData(results);
        setLoading(false);
        return;
      }

      // Step 2: Check coach assignments
      const { data: assignments, error: assignError } = await supabase
        .from('coach_assignments')
        .select('*')
        .eq('coach_id', user.id)
        .eq('is_active', true);

      results.step2_assignments = {
        data: assignments,
        error: assignError?.message,
        count: assignments?.length || 0
      };

      // Step 3: Check messages sent TO this coach
      const { data: incomingMessages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id)
        .neq('sender_id', user.id);

      results.step3_incoming_messages = {
        data: incomingMessages,
        error: msgError?.message,
        count: incomingMessages?.length || 0
      };

      // Step 4: Get unique sender IDs
      const senderIds = incomingMessages ? [...new Set(incomingMessages.map(m => m.sender_id))] : [];
      results.step4_unique_senders = senderIds;

      // Step 5: Get all user IDs (assigned + message senders)
      const assignedIds = assignments?.map(a => a.user_id) || [];
      const allUserIds = [...new Set([...assignedIds, ...senderIds])];
      results.step5_all_user_ids = allUserIds;

      // Step 6: Get user profiles
      if (allUserIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', allUserIds);

        results.step6_user_profiles = {
          data: profiles,
          error: profileError?.message,
          count: profiles?.length || 0
        };
      } else {
        results.step6_user_profiles = { data: [], count: 0, note: 'No user IDs to fetch' };
      }

      // Step 7: Test hardcoded assignment
      const testUserId = 'aa9ccae4-b36a-4eeb-9e54-b3d029b807bb'; // From the data we saw
      const { data: testAssignment } = await supabase
        .from('coach_assignments')
        .select('*')
        .eq('user_id', testUserId)
        .eq('coach_id', user.id)
        .single();

      results.step7_test_assignment = testAssignment;

      // Step 8: Test messages with this user
      const { data: testMessages } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${testUserId}),and(sender_id.eq.${testUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(5);

      results.step8_test_messages = testMessages;

    } catch (error) {
      results.error = error.message;
    }

    setDebugData(results);
    setLoading(false);
  };

  const createTestData = async () => {
    if (!currentCoach) return;

    try {
      // Insert a test message from a known user to the coach
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: 'aa9ccae4-b36a-4eeb-9e54-b3d029b807bb',
          receiver_id: currentCoach.id,
          message: 'Test message from user to coach - ' + new Date().toLocaleTimeString(),
          is_read: false
        });

      if (error) {
        alert('Error creating test data: ' + error.message);
      } else {
        alert('Test message created! Run debug again.');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>🔍 Coach Chat System Debug Panel</CardTitle>
        <div className="flex gap-2">
          <Button onClick={runFullDebug} disabled={loading}>
            {loading ? 'Running...' : '🚀 Run Full Debug'}
          </Button>
          <Button onClick={createTestData} variant="outline" disabled={!currentCoach}>
            📝 Create Test Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
          {JSON.stringify(debugData, null, 2)}
        </pre>
        
        {debugData.step5_all_user_ids?.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 rounded">
            <h4 className="font-bold text-green-800">✅ USERS FOUND FOR COACH CHAT:</h4>
            <div className="mt-2">
              {debugData.step6_user_profiles?.data?.map((profile: any) => (
                <div key={profile.id} className="p-2 bg-white rounded mb-2">
                  <strong>{profile.first_name} {profile.last_name}</strong> ({profile.email})
                  <br />
                  <small>ID: {profile.id}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {debugData.step5_all_user_ids?.length === 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded">
            <h4 className="font-bold text-red-800">❌ NO USERS FOUND</h4>
            <p>Reasons:</p>
            <ul className="list-disc ml-4">
              <li>No coach assignments: {debugData.step2_assignments?.count || 0} found</li>
              <li>No incoming messages: {debugData.step3_incoming_messages?.count || 0} found</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};