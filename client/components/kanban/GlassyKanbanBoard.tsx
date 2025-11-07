import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Sparkles, ListTodo, Clock, CheckCircle2, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBoard } from '@/contexts/BoardContext';
import { useAuth } from '@/contexts/AuthContext';
import { createCard as createCardAPI, updateCard as updateCardAPI, deleteCard as deleteCardAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { CardDialog } from './CardDialog';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

type ColumnId = string;

interface CardType {
  _id: string;
  title: string;
  description?: string;
  columnId: string;
  tags?: string[];
  dueDate?: string;
  order: number;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

const getColumnConfig = (title: string) => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('progress') || lowerTitle === 'in progress') {
    return {
      icon: Clock,
      gradient: 'from-violet-500/40 via-violet-400/20 to-violet-500/5',
      borderColor: 'border-violet-400/50',
      glowColor: 'shadow-violet-500/30',
      iconColor: 'text-violet-300',
      badgeColor: 'bg-violet-500/30 text-violet-200 border-violet-400/50'
    };
  } else if (lowerTitle.includes('review')) {
    return {
      icon: Sparkles,
      gradient: 'from-amber-500/40 via-amber-400/20 to-amber-500/5',
      borderColor: 'border-amber-400/50',
      glowColor: 'shadow-amber-500/30',
      iconColor: 'text-amber-300',
      badgeColor: 'bg-amber-500/30 text-amber-200 border-amber-400/50'
    };
  } else if (lowerTitle.includes('done') || lowerTitle.includes('complete')) {
    return {
      icon: CheckCircle2,
      gradient: 'from-emerald-500/40 via-emerald-400/20 to-emerald-500/5',
      borderColor: 'border-emerald-400/50',
      glowColor: 'shadow-emerald-500/30',
      iconColor: 'text-emerald-300',
      badgeColor: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
    };
  } else {
    // Default to "To Do" style
    return {
      icon: ListTodo,
      gradient: 'from-sky-500/40 via-sky-400/20 to-sky-500/5',
      borderColor: 'border-sky-400/50',
      glowColor: 'shadow-sky-500/30',
      iconColor: 'text-sky-300',
      badgeColor: 'bg-sky-500/30 text-sky-200 border-sky-400/50'
    };
  }
};

export default function GlassyKanbanBoard() {
  const { currentBoard, cards: boardCards, setCards } = useBoard();
  const { user } = useAuth();
  const [cards, setLocalCards] = useState<CardType[]>([]);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentColumnId, setCurrentColumnId] = useState<string>('');
  const [editingCard, setEditingCard] = useState<CardType | null>(null);

  useEffect(() => {
    if (boardCards) {
      setLocalCards(boardCards as CardType[]);
    }
  }, [boardCards]);

  const columns = useMemo(() => {
    if (!currentBoard?.columns) return [];
    return currentBoard.columns
      .sort((a: any, b: any) => a.order - b.order)
      .map((col: any) => ({
        id: col._id,
        title: col.title,
      }));
  }, [currentBoard]);

  const byColumn = useMemo(() => {
    return cards.reduce((acc, card) => {
      if (!acc[card.columnId]) acc[card.columnId] = [];
      acc[card.columnId].push(card);
      return acc;
    }, {} as Record<string, CardType[]>);
  }, [cards]);

  const handleCreateCard = (columnId: string) => {
    setCurrentColumnId(columnId);
    setDialogMode('create');
    setEditingCard(null);
    setDialogOpen(true);
  };

  const handleEditCard = (card: CardType) => {
    setEditingCard(card);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleSaveCard = async (data: { title: string; description: string; tags: string[] }) => {
    if (!currentBoard || !user) return;

    try {
      if (dialogMode === 'create') {
        const response = await createCardAPI(currentBoard._id, {
          columnId: currentColumnId,
          title: data.title,
          description: data.description,
          tags: data.tags,
          createdBy: user.id,
        });
        setLocalCards((prev) => [...prev, response.card]);
        // Don't emit socket event - server will broadcast it
      } else if (editingCard) {
        const response = await updateCardAPI(editingCard._id, data);
        setLocalCards((prev) => prev.map(c => c._id === editingCard._id ? response.card : c));
        // Don't emit socket event - server will broadcast it
      }
    } catch (err) {
      console.error('Failed to save card:', err);
    }
  };

  const handleDeleteCard = async () => {
    if (!editingCard) return;

    try {
      await deleteCardAPI(editingCard._id);
      setLocalCards((prev) => prev.filter(c => c._id !== editingCard._id));
      // Don't emit socket event - server will broadcast it
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((c) => c._id === event.active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || active.id === over.id) return;

    const cardId = active.id as string;
    const targetColumnId = over.id as string;

    const card = cards.find((c) => c._id === cardId);
    if (!card) return;

    const oldColumnId = card.columnId;
    const newColumnId = columns.find((col) => col.id === targetColumnId)?.id || targetColumnId;

    if (oldColumnId === newColumnId) return;

    // Confetti for Done column
    const doneColumn = columns.find(col => col.title.toLowerCase() === 'done');
    if (doneColumn && newColumnId === doneColumn.id) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });
    }

    setLocalCards((prev) =>
      prev.map((c) => (c._id === cardId ? { ...c, columnId: newColumnId } : c))
    );

    const socket = getSocket();
    socket.emit('card:move', { cardId, columnId: newColumnId });
  };

  return (
    <>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {columns.map((col, index) => {
              const config = getColumnConfig(col.title);
              return (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <GlassColumn
                    id={col.id}
                    title={col.title}
                    icon={config.icon}
                    gradient={config.gradient}
                    borderColor={config.borderColor}
                    glowColor={config.glowColor}
                    iconColor={config.iconColor}
                    badgeColor={config.badgeColor}
                    items={byColumn[col.id] || []}
                    onCreateCard={handleCreateCard}
                    onEditCard={handleEditCard}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </DndContext>

      <CardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        card={editingCard}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
        mode={dialogMode}
      />
    </>
  );
}

function GlassColumn({
  id,
  title,
  icon: Icon,
  gradient,
  borderColor,
  glowColor,
  iconColor,
  badgeColor,
  items,
  onCreateCard,
  onEditCard,
}: {
  id: string;
  title: string;
  icon: any;
  gradient: string;
  borderColor: string;
  glowColor: string;
  iconColor: string;
  badgeColor: string;
  items: CardType[];
  onCreateCard: (id: string) => void;
  onEditCard: (card: CardType) => void;
}) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative rounded-2xl p-4 h-[450px] flex flex-col',
        'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl',
        'border-2 shadow-2xl transition-all duration-500',
        'hover:shadow-3xl hover:scale-[1.02]',
        borderColor,
        glowColor
      )}
    >
      {/* Glass shimmer effect */}
      <div className={cn('absolute inset-0 rounded-2xl bg-gradient-to-br opacity-50', gradient)} />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4 pb-3 border-b-2 border-white/20">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', badgeColor)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          <h3 className="font-bold text-lg text-white">{title}</h3>
        </div>
        <Badge className={cn('px-2.5 py-1 border font-semibold text-sm', badgeColor)}>
          {items.length}
        </Badge>
      </div>

      {/* Cards */}
      <SortableContext items={items.map((c) => c._id)} strategy={verticalListSortingStrategy}>
        <div className="relative flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          <AnimatePresence>
            {items.map((card, index) => (
              <motion.div
                key={card._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard card={card} onEdit={() => onEditCard(card)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      {/* Add Card Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative z-10 mt-3"
      >
        <Button
          onClick={() => onCreateCard(id)}
          className={cn(
            'w-full bg-white/5 hover:bg-white/10 border text-white/80',
            'backdrop-blur-lg transition-all duration-300',
            'hover:shadow-lg group',
            borderColor
          )}
        >
          <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Add Card
        </Button>
      </motion.div>
    </div>
  );
}

function CardFooter({ card }: { card: CardType }) {
  const { user } = useAuth();
  const creator = card.createdBy || card.updatedBy;
  // Fallback to current user if creator info not available
  const userName = creator?.name || user?.name || 'User';
  const userEmail = creator?.email || user?.email || '';
  const avatarUrl = creator?.avatarUrl || user?.avatarUrl;
  
  return (
    <div className="flex items-center gap-1.5" title={userName}>
      <Avatar className="h-6 w-6 ring-2 ring-white/20">
        <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} />
        <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-violet-500">
          {userName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs text-white/50">{userName.split(' ')[0]}</span>
    </div>
  );
}

function GlassCard({ card, onEdit }: { card: CardType; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit();
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        'group relative rounded-xl p-4 aspect-square',
        'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md',
        'border border-white/10 shadow-lg',
        'hover:shadow-2xl hover:border-white/20',
        'transition-all duration-300',
        'w-full',
        isDragging && 'opacity-50 scale-105 rotate-2'
      )}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/10 group-hover:to-violet-500/10 transition-all duration-300" />
      
      {/* Drag Handle */}
      <div {...listeners} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      
      {/* 2x2 Grid Layout */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top Half: 2 components side by side */}
        <div className="flex-1 grid grid-cols-2 gap-3 pb-3 border-b border-white/10">
          {/* Top Left: Title & Edit Button */}
          <div className="flex flex-col justify-start">
            <h4 className="text-sm font-bold text-white/90 line-clamp-3 leading-tight">
              {card.title}
            </h4>
          </div>
          
          {/* Top Right: Tags & Edit */}
          <div className="flex flex-col items-end justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-indigo-500/20 relative z-20"
            >
              <Edit className="h-3.5 w-3.5 text-indigo-300" />
            </Button>
            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-end">
                {card.tags.slice(0, 1).map((tag, i) => (
                  <Badge
                    key={i}
                    className="text-xs px-1.5 py-0 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                  >
                    {tag}
                  </Badge>
                ))}
                {card.tags.length > 1 && (
                  <Badge className="text-xs px-1.5 py-0 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    +{card.tags.length - 1}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Half: 2 components side by side */}
        <div className="flex-1 grid grid-cols-2 gap-3 pt-3">
          {/* Bottom Left: Description */}
          <div className="flex items-center">
            {card.description && (
              <p className="text-xs text-white/60 line-clamp-3 leading-tight">{card.description}</p>
            )}
          </div>
          
          {/* Bottom Right: User Avatar & Date */}
          <div className="flex flex-col justify-end items-end gap-2">
            {card.dueDate && (
              <div className="flex items-center gap-1 text-xs text-white/50">
                <Calendar className="h-3 w-3" />
                <span>{new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
            <CardFooter card={card} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
