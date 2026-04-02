import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, TestTube, ArrowRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TestStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

const AdminInviteFlowTester = () => {
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [steps, setSteps] = useState<TestStep[]>([
    { id: 'generate', name: 'Generate Invite', status: 'pending' },
    { id: 'validate', name: 'Validate Token', status: 'pending' },
    { id: 'database', name: 'Check Database Record', status: 'pending' },
    { id: 'link', name: 'Test Signup Link', status: 'pending' }
  ]);
  const [running, setRunning] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  
  const updateStep = (id: string, updates: Partial<TestStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ));
  };

  const runCompleteTest = async () => {
    setRunning(true);
    setInviteLink('');
    setInviteToken('');
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', message: '', data: null })));
    
    try {
      // Step 1: Generate Invite
      updateStep('generate', { status: 'running', message: 'Calling create-admin-invite function...' });
      
      const { data: inviteData, error: inviteError } = await supabase.functions.invoke('create-admin-invite', {
        body: {
          email: testEmail.trim().toLowerCase(),
          invitedBy: 'flow-tester@trifectagroupco.com'
        }
      });
      
      if (inviteError || !inviteData) {
        updateStep('generate', { 
          status: 'error', 
          message: `Failed: ${inviteError?.message || 'No data returned'}`,
          data: { error: inviteError, response: inviteData }
        });
        return;
      }
      
      if (inviteData.error) {
        updateStep('generate', { 
          status: 'error', 
          message: `Function error: ${inviteData.error}`,
          data: inviteData
        });
        return;
      }
      
      if (!inviteData.inviteLink || !inviteData.token) {
        updateStep('generate', { 
          status: 'error', 
          message: 'Missing invite link or token in response',
          data: inviteData
        });
        return;
      }
      
      setInviteLink(inviteData.inviteLink);
      setInviteToken(inviteData.token);
      
      updateStep('generate', { 
        status: 'success', 
        message: 'Invite generated successfully',
        data: inviteData
      });
      
      // Step 2: Validate Token
      updateStep('validate', { status: 'running', message: 'Validating token format and structure...' });
      
      const token = inviteData.token;
      const tokenRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!tokenRegex.test(token)) {
        updateStep('validate', { 
          status: 'error', 
          message: 'Invalid token format (not a valid UUID)',
          data: { token }
        });
        return;
      }
      
      updateStep('validate', { 
        status: 'success', 
        message: 'Token format is valid UUID',
        data: { token, format: 'UUID v4' }
      });
      
      // Step 3: Check Database Record
      updateStep('database', { status: 'running', message: 'Checking database record...' });
      
      const { data: dbRecord, error: dbError } = await supabase
        .from('admin_invites')
        .select('*')
        .eq('token', token)
        .single();
      
      if (dbError || !dbRecord) {
        updateStep('database', { 
          status: 'error', 
          message: `Database record not found: ${dbError?.message || 'No record'}`,
          data: { error: dbError, token }
        });
        return;
      }
      
      const isExpired = new Date(dbRecord.expires_at) < new Date();
      const isUsed = dbRecord.used;
      
      if (isExpired) {
        updateStep('database', { 
          status: 'error', 
          message: 'Invite has expired',
          data: { ...dbRecord, expired: true }
        });
        return;
      }
      
      if (isUsed) {
        updateStep('database', { 
          status: 'error', 
          message: 'Invite has already been used',
          data: { ...dbRecord, alreadyUsed: true }
        });
        return;
      }
      
      updateStep('database', { 
        status: 'success', 
        message: 'Database record is valid and active',
        data: dbRecord
      });
      
      // Step 4: Test Signup Link
      updateStep('link', { 
        status: 'success', 
        message: 'Signup link is ready for testing',
        data: { link: inviteData.inviteLink }
      });
      
    } catch (error: any) {
      console.error('Flow test error:', error);
      // Update the currently running step with error
      const runningStep = steps.find(s => s.status === 'running');
      if (runningStep) {
        updateStep(runningStep.id, { 
          status: 'error', 
          message: `Unexpected error: ${error.message}`,
          data: error
        });
      }
    } finally {
      setRunning(false);
    }
  };
  
  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getStepBadge = (status: TestStep['status']) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-600',
      running: 'bg-blue-100 text-blue-600',
      success: 'bg-green-100 text-green-600',
      error: 'bg-red-100 text-red-600'
    };
    return <Badge className={colors[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Complete Admin Invite Flow Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Test email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
              disabled={running}
            />
            <Button onClick={runCompleteTest} disabled={running || !testEmail}>
              {running ? 'Testing...' : 'Run Complete Test'}
            </Button>
          </div>
          
          {inviteLink && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">✅ Generated Invite Link:</div>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="flex-1 text-xs" />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(inviteLink, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Steps Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getStepIcon(step.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{index + 1}. {step.name}</span>
                      {getStepBadge(step.status)}
                    </div>
                    {step.message && (
                      <div className={`text-sm ${
                        step.status === 'error' ? 'text-red-600' : 
                        step.status === 'success' ? 'text-green-600' : 
                        'text-gray-600'
                      }`}>
                        {step.message}
                      </div>
                    )}
                    {step.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">View Details</summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInviteFlowTester;