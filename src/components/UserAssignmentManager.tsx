import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Users, UserPlus, UserMinus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

interface Coach {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface Assignment {
  user_id: string;
  coach_id: string;
  user_profiles: User;
  coach_profiles: Coach;
}

const UserAssignmentManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all users (excluding coaches, admins, and super_admins for assignment)
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, role')
        .neq('role', 'super_admin')
        .neq('role', 'admin')
        .neq('role', 'coach');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      // Fetch all coaches
      const { data: coachesData, error: coachesError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, role')
        .eq('role', 'coach');

      if (coachesError) {
        console.error('Error fetching coaches:', coachesError);
        throw coachesError;
      }

      // Fetch current assignments with proper column names
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('coach_assignments')
        .select(`
          id,
          user_id,
          coach_id,
          assigned_at,
          is_active
        `);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
      }

      // If we have assignments, fetch the user and coach details separately
      let enrichedAssignments: Assignment[] = [];
      if (assignmentsData && assignmentsData.length > 0) {
        const userIds = assignmentsData.map(a => a.user_id);
        const coachIds = assignmentsData.map(a => a.coach_id);

        // Fetch user details
        const { data: assignmentUsers } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name, role')
          .in('id', userIds);

        // Fetch coach details
        const { data: assignmentCoaches } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name, role')
          .in('id', coachIds);

        // Combine the data
        enrichedAssignments = assignmentsData.map(assignment => {
          const userProfile = assignmentUsers?.find(u => u.id === assignment.user_id);
          const coachProfile = assignmentCoaches?.find(c => c.id === assignment.coach_id);
          
          return {
            user_id: assignment.user_id,
            coach_id: assignment.coach_id,
            user_profiles: userProfile as User,
            coach_profiles: coachProfile as Coach
          };
        }).filter(assignment => assignment.user_profiles && assignment.coach_profiles);
      }

      console.log('Fetched users:', usersData);
      console.log('Fetched coaches:', coachesData);
      console.log('Fetched assignments raw:', assignmentsData);
      console.log('Enriched assignments:', enrichedAssignments);
      setUsers(usersData || []);
      setCoaches(coachesData || []);
      setAssignments(enrichedAssignments || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load assignment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignUserToCoach = async () => {
    if (!selectedUser || !selectedCoach) {
      toast({
        title: "Error",
        description: "Please select both a user and a coach",
        variant: "destructive",
      });
      return;
    }

    // Check if assignment already exists
    const existingAssignment = assignments.find(
      a => a.user_id === selectedUser && a.coach_id === selectedCoach
    );
    
    if (existingAssignment) {
      toast({
        title: "Error",
        description: "This user is already assigned to this coach",
        variant: "destructive",
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('coach_assignments')
        .insert([{ user_id: selectedUser, coach_id: selectedCoach }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User assigned to coach successfully",
      });

      setSelectedUser('');
      setSelectedCoach('');
      fetchData();
    } catch (error) {
      console.error('Error assigning user:', error);
      toast({
        title: "Error",
        description: "Failed to assign user to coach",
        variant: "destructive",
      });
    }
  };

  const unassignUser = async (userId: string, coachId: string) => {
    try {
      const { error } = await supabase
        .from('coach_assignments')
        .delete()
        .eq('user_id', userId)
        .eq('coach_id', coachId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User unassigned from coach successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error unassigning user:', error);
      toast({
        title: "Error",
        description: "Failed to unassign user",
        variant: "destructive",
      });
    }
  };

  // Helper function to get full name
  const getFullName = (user: User | Coach) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.first_name || user.last_name || user.email;
  };

  const filteredAssignments = assignments.filter(assignment => {
    const userName = getFullName(assignment.user_profiles);
    const coachName = getFullName(assignment.coach_profiles);
    const searchLower = searchTerm.toLowerCase();
    
    return userName.toLowerCase().includes(searchLower) ||
           assignment.user_profiles?.email?.toLowerCase().includes(searchLower) ||
           coachName.toLowerCase().includes(searchLower);
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">User Assignment Management</h1>
      </div>

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign User to Coach
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select User</label>
               <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                   {users.map((user) => (
                     <SelectItem key={user.id} value={user.id}>
                       {getFullName(user)}
                     </SelectItem>
                   ))}
                 </SelectContent>
                </Select>
             </div>

             <div>
               <label className="text-sm font-medium mb-2 block">Select Coach</label>
               <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                 <SelectTrigger>
                   <SelectValue placeholder="Choose a coach" />
                 </SelectTrigger>
                 <SelectContent>
                   {coaches.map((coach) => (
                     <SelectItem key={coach.id} value={coach.id}>
                       {getFullName(coach)}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>

           <Button onClick={assignUserToCoach} className="w-full">
             <UserPlus className="w-4 h-4 mr-2" />
             Assign User to Coach
           </Button>
         </CardContent>
       </Card>

       {/* Current Assignments */}
       <Card>
         <CardHeader>
           <CardTitle>Current Assignments</CardTitle>
           <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
             <Input
               placeholder="Search assignments..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10"
             />
           </div>
         </CardHeader>
         <CardContent>
           <div className="space-y-3">
             {filteredAssignments.length === 0 ? (
               <p className="text-gray-500 text-center py-4">No assignments found</p>
             ) : (
               filteredAssignments.map((assignment) => (
                 <div key={`${assignment.user_id}-${assignment.coach_id}`} 
                      className="flex items-center justify-between p-3 border rounded-lg">
                   <div className="flex items-center gap-3">
                     <div>
                       <div className="font-medium">
                         {getFullName(assignment.user_profiles)}
                       </div>
                       <div className="text-sm text-gray-500">
                         Assigned to: {getFullName(assignment.coach_profiles)}
                       </div>
                     </div>
                   </div>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => unassignUser(assignment.user_id, assignment.coach_id)}
                     className="text-red-600 hover:text-red-700"
                   >
                     <UserMinus className="w-4 h-4 mr-1" />
                     Unassign
                   </Button>
                 </div>
               ))
             )}
           </div>
         </CardContent>
       </Card>
     </div>
   );
 };
 
 export default UserAssignmentManager;