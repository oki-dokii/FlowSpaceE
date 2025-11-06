import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import FloatingBackground from '@/components/visuals/FloatingBackground';
import confetti from 'canvas-confetti';
import { useBoard } from '@/contexts/BoardContext';
import { createBoard as createBoardAPI } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Boards() {
  const navigate = useNavigate();
  const { boards, refreshBoards, isLoading } = useBoard();
  const [showDialog, setShowDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    refreshBoards();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setCreating(true);
      const result = await createBoardAPI(formData);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      setShowDialog(false);
      setFormData({ title: '', description: '' });
      await refreshBoards();
      setTimeout(() => navigate('/board'), 500);
    } catch (err) {
      console.error('Failed to create board:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative container mx-auto px-6 py-10">
      <FloatingBackground />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-extrabold">Boards</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visual workspaces for projects and teams.
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2">
              <Plus className="mr-2 h-4 w-4" /> New Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Board Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="My Awesome Board"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What's this board about?"
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Board'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <div
              key={board._id}
              onClick={() => navigate('/board')}
              className="group cursor-pointer rounded-2xl p-6 bg-white/60 dark:bg-white/5 backdrop-blur border border-white/30 dark:border-white/10 hover:shadow-xl transition-all hover:scale-105"
            >
              <h3 className="text-xl font-semibold mb-2">{board.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {board.description || 'No description'}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{board.columns?.length || 4} columns</span>
                <span>{board.members?.length || 1} members</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
