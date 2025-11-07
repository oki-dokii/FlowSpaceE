import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle2, Copy } from 'lucide-react';
import { sendInvite } from '@/lib/api-teams';
import { useToast } from '@/hooks/use-toast';

export default function Invite() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const inviteLink = `${window.location.origin}/board`;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setSending(true);
      await sendInvite({ email });
      setSent(true);
      toast({
        title: 'Invite sent!',
        description: `Invitation email sent to ${email}`,
      });
      setTimeout(() => {
        setSent(false);
        setEmail('');
      }, 2000);
    } catch (err) {
      toast({
        title: 'Failed to send invite',
        description: 'Please check SMTP configuration',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Link copied!',
      description: 'Invite link copied to clipboard',
    });
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white mb-4">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold">Invite Members</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Invite teammates to collaborate in FlowSpace.
          </p>
        </div>

        <form onSubmit={handleSend} className="space-y-6">
          <div className="relative rounded-xl p-[1.5px] bg-gradient-to-r from-indigo-500 to-violet-600">
            <div className="rounded-lg bg-white/90 dark:bg-white/5 p-6">
              <Label htmlFor="email" className="text-base font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="mt-3 h-12"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={sending || sent}
              className="w-full h-12 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-base"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : sent ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Sent!
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" />
                  Send Invite
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={copyLink}
              className="w-full h-12 rounded-full text-base"
            >
              <Copy className="mr-2 h-5 w-5" />
              Copy Invite Link
            </Button>
          </div>
        </form>

        <div className="mt-8 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm text-indigo-900 dark:text-indigo-100">
            <strong>Note:</strong> Make sure SMTP is configured for email invites to work.
            You can also share the invite link directly.
          </p>
        </div>
      </div>
    </div>
  );
}
