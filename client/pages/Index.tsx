import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="relative min-h-[calc(100vh-64px-40px)] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(124,58,237,0.35),transparent),radial-gradient(800px_400px_at_10%_10%,rgba(99,102,241,0.25),transparent)]" />

      <div className="container mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500">FlowSpace</span>
            <br />
            Collaborate visually, write freely.
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl">
            A sleek, real-time collaborative Kanban + Notes workspace — modern design, smooth effects, and intuitive UX.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/board" className="rounded-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg hover:shadow-xl transition">
              Go to Dashboard
            </Link>
            <Link to="/boards" className="rounded-full px-6 py-3 border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/10 backdrop-blur">
              Explore Boards
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-4 shadow-xl">
            <div className="grid grid-cols-3 gap-3">
              {["To Do","In Progress","Review"].map((c) => (
                <div key={c} className="rounded-xl p-3 bg-white shadow border border-black/5 dark:bg-white/10 dark:border-white/10">
                  <div className="text-xs font-medium mb-2 opacity-70">{c}</div>
                  <div className="space-y-2">
                    <div className="h-10 rounded-lg bg-gradient-to-r from-indigo-500/15 to-violet-600/15 border border-indigo-500/20" />
                    <div className="h-10 rounded-lg bg-gradient-to-r from-indigo-500/15 to-violet-600/15 border border-indigo-500/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
