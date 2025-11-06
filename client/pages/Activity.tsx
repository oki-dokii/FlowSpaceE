import { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquare, UserPlus, Clock, Loader2 } from 'lucide-react';
import { listActivities } from '@/lib/api-teams';
import { getSocket } from '@/lib/socket';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  _id: string;
  action: string;
  userId: any;
  entityType: string;
  createdAt: string;
}

export default function Activity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();

    // Listen for real-time updates
    const socket = getSocket();
    socket.on('activity:new', (activity: Activity) => {
      setActivities((prev) => [activity, ...prev]);
    });

    return () => {
      socket.off('activity:new');
    };
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await listActivities();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (entityType: string) => {
    switch (entityType) {
      case 'card':
        return CheckCircle2;
      case 'note':
        return MessageSquare;
      case 'user':
      case 'team':
        return UserPlus;
      default:
        return Clock;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Activity</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Recent actions across your workspace - updates in real-time.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/90 text-white text-xs px-3 py-1 shadow-lg animate-pulse">
          <CheckCircle2 className="h-3 w-3" /> Live
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity yet. Start working to see updates here!</p>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getIcon(activity.entityType);
              return (
                <div
                  key={activity._id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-white/20 hover:shadow-md transition-shadow"
                >
                  <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-medium">
                        {activity.userId?.name || 'Someone'}
                      </span>{' '}
                      {activity.action}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
