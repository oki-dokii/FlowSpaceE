import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Users, Mail, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, getAccessToken } from '@/contexts/AuthContext';

interface InviteDetails {
  email: string;
  role: string;
  invitedBy: {
    name: string;
    email: string;
  };
  board: {
    _id: string;
    title: string;
    description?: string;
  };
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'loaded' | 'accepting' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If not authenticated, redirect to login with return URL
    if (!isAuthenticated) {
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }

    // Fetch invite details
    fetchInviteDetails();
  }, [authLoading, isAuthenticated, token]);

  const fetchInviteDetails = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid invite link');
      return;
    }

    try {
      setStatus('loading');
      
      // Fetch invite details (public endpoint, but we still send token for better UX)
      const response = await fetch(`/api/invite/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invite not found or expired');
      }

      setInviteDetails(data.invite);
      setStatus('loaded');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to load invite details');
      toast({
        title: 'Error',
        description: err.message || 'Failed to load invite',
        variant: 'destructive',
      });
    }
  };

  const handleAccept = async () => {
    if (!token) return;

    try {
      setStatus('accepting');
      
      // Get JWT token for authentication
      const authToken = getAccessToken();
      if (!authToken) {
        throw new Error('Please sign in to accept the invite');
      }
      
      const response = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invite');
      }

      setStatus('success');
      setMessage('You can now collaborate on this board!');

      toast({
        title: 'Success!',
        description: 'Invite accepted successfully',
      });

      // Redirect to the specific board after 2 seconds
      setTimeout(() => {
        if (data.board?._id) {
          navigate(`/board/${data.board._id}`);
        } else {
          navigate(`/board`);
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to accept invite');
      toast({
        title: 'Error',
        description: err.message || 'Failed to accept invite',
        variant: 'destructive',
      });
    }
  };

  const handleReject = () => {
    toast({
      title: 'Invite Declined',
      description: 'You have declined the invitation',
    });
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4">
      <div className="max-w-lg w-full">
        {/* Loading invite details */}
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white mb-6">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Invite...</h2>
            <p className="text-gray-400">Please wait</p>
          </div>
        )}

        {/* Show invite details with Accept/Reject buttons */}
        {status === 'loaded' && inviteDetails && (
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">You're Invited!</h1>
              <p className="text-gray-400">You've been invited to collaborate on a board</p>
            </div>

            {/* Board Details */}
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-indigo-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Board</p>
                    <p className="text-white font-semibold text-lg">{inviteDetails.board.title}</p>
                    {inviteDetails.board.description && (
                      <p className="text-sm text-gray-400 mt-1">{inviteDetails.board.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Your Role</p>
                    <p className="text-white font-semibold capitalize">{inviteDetails.role}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {inviteDetails.role === 'editor' 
                        ? 'You can view and edit cards' 
                        : 'You can view cards'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-400">Invited by</p>
                    <p className="text-white font-semibold">{inviteDetails.invitedBy.name}</p>
                    <p className="text-sm text-gray-400">{inviteDetails.invitedBy.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleReject}
                variant="outline"
                className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white"
              >
                Accept Invitation
              </Button>
            </div>
          </div>
        )}

        {/* Accepting state */}
        {status === 'accepting' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white mb-6">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Accepting Invite...</h2>
            <p className="text-gray-400">Adding you to the board</p>
          </div>
        )}

        {/* Success state */}
        {status === 'success' && inviteDetails && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-500 text-white mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invite Accepted!</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-white font-medium">{inviteDetails.board.title}</p>
              {inviteDetails.board.description && (
                <p className="text-sm text-gray-400 mt-1">{inviteDetails.board.description}</p>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-6">Redirecting to board...</p>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-500 text-white mb-6">
              <XCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                Go to Home
              </Button>
              <Button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
