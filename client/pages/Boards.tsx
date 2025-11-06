import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const sampleBoards = [
  { id: "b1", title: "Product Roadmap", description: "Company-wide initiatives" },
  { id: "b2", title: "Marketing Sprint", description: "Campaign tasks & assets" },
  { id: "b3", title: "Design System", description: "Components & tokens" },
  { id: "b4", title: "Hackathon Ideas", description: "Rapid prototypes" },
];

export default function Boards() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Boards</h2>
          <p className="text-sm text-muted-foreground mt-1">Visual workspaces for projects and teams.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="rounded-full bg-white/90 dark:bg-white/5 border border-white/30">
            <Link to="/board">
              <Plus className="mr-2 h-4 w-4" /> New Board
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleBoards.map((b) => (
          <Link to="/board" key={b.id} className="block p-6 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur border border-white/30 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{b.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{b.description}</p>
              </div>
              <div className="text-xs text-muted-foreground">4 columns</div>
            </div>
            <div className="mt-4 flex -space-x-2">
              <img src="https://i.pravatar.cc/40?img=3" alt="" className="h-8 w-8 rounded-full ring-2 ring-white/60" />
              <img src="https://i.pravatar.cc/40?img=12" alt="" className="h-8 w-8 rounded-full ring-2 ring-white/60" />
              <img src="https://i.pravatar.cc/40?img=20" alt="" className="h-8 w-8 rounded-full ring-2 ring-white/60" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
