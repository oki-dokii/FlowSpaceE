import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";

export default function IndexPreview() {
  const columns = [
    {
      title: "To Do",
      color: "from-sky-400/30 to-indigo-400/30",
      borderColor: "border-sky-400/40",
      icon: CheckCircle2,
      iconColor: "text-sky-300",
      cards: [
        { title: "Design homepage", desc: "Create mockups", icon: "🎨" },
        { title: "Setup database", desc: "MongoDB config", icon: "💾" },
      ],
    },
    {
      title: "In Progress",
      color: "from-violet-400/30 to-purple-400/30",
      borderColor: "border-violet-400/40",
      icon: Clock,
      iconColor: "text-violet-300",
      cards: [
        { title: "Build API", desc: "Express routes", icon: "⚡" },
        { title: "Add auth", desc: "Firebase setup", icon: "🔐" },
      ],
    },
    {
      title: "Review",
      color: "from-pink-400/30 to-rose-400/30",
      borderColor: "border-pink-400/40",
      icon: Sparkles,
      iconColor: "text-pink-300",
      cards: [
        { title: "Test features", desc: "QA checklist", icon: "✅" },
        { title: "Deploy app", desc: "Production ready", icon: "🚀" },
      ],
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl p-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-2 border-white/20 shadow-2xl"
      >
        <div className="flex gap-3">
          {columns.map((col, i) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-1 min-w-0"
            >
              <div className={`flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-lg bg-gradient-to-br ${col.color} border ${col.borderColor}`}>
                <col.icon className={`h-3.5 w-3.5 ${col.iconColor}`} />
                <div className="text-xs font-bold text-white">
                  {col.title}
                </div>
              </div>
              <div className="space-y-2">
                {col.cards.map((card, n) => (
                  <motion.div
                    key={n}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + (i * 0.1) + (n * 0.05) }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    className={`rounded-lg p-2.5 bg-gradient-to-br ${col.color} border ${col.borderColor} backdrop-blur-sm cursor-pointer group`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base group-hover:scale-110 transition-transform">{card.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white mb-1 line-clamp-1">
                          {card.title}
                        </div>
                        <div className="text-[10px] text-white/70 line-clamp-1">
                          {card.desc}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
