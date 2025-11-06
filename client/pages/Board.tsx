import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { NotesPanel } from "@/components/notes/NotesPanel";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export default function Board() {
  return (
    <div className="container mx-auto px-6 py-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <KanbanBoard />
        </div>
        <div className="lg:col-span-1">
          <NotesPanel />
        </div>
      </div>

      <Button
        className="fixed bottom-6 right-6 rounded-full h-12 px-5 shadow-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-500/90 hover:to-violet-600/90"
      >
        <Plus className="mr-2 h-5 w-5" /> Create Board
      </Button>

      <Button
        variant="outline"
        className="fixed bottom-6 right-40 rounded-full backdrop-blur bg-white/60 dark:bg-white/10 border-white/40 dark:border-white/10"
      >
        <Users className="mr-2 h-5 w-5" /> Invite Members
      </Button>
    </div>
  );
}
