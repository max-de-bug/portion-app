"use client";

/**
 * ConversationSidebar
 * 
 * A sleek sidebar component for managing chat conversations
 * Similar to ChatGPT's conversation list UI
 */

import { useChatStore, Conversation } from "@/app/store/useChatStore";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Check,
  X,
  Clock
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConversationSidebarProps {
  className?: string;
}

export const ConversationSidebar = ({ className = "" }: ConversationSidebarProps) => {
  const { 
    conversations, 
    activeConversationId, 
    createConversation, 
    switchConversation, 
    deleteConversation,
    renameConversation 
  } = useChatStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleNewChat = () => {
    createConversation();
  };

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSaveEdit(id);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  // Sort conversations by updatedAt (most recent first)
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* New Chat Button */}
      <div className="p-3 shrink-0">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <AnimatePresence mode="popLayout">
          {sortedConversations.map((conv) => {
            const isActive = conv.id === (activeConversationId || conversations[0]?.id);
            const isEditing = editingId === conv.id;
            const messageCount = conv.messages.filter(m => m.role === "user").length;

            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                layout
                className="mb-1"
              >
                <div
                  onClick={() => !isEditing && switchConversation(conv.id)}
                  className={`group relative flex flex-col gap-1 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  {/* Title Row */}
                  <div className="flex items-center gap-2">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-500" : "text-muted-foreground"}`} />
                    
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, conv.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 px-2 py-0.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(conv.id);
                          }}
                          className="p-1 hover:bg-emerald-500/20 rounded"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          className="p-1 hover:bg-destructive/20 rounded"
                        >
                          <X className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`flex-1 text-sm font-medium truncate ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                          {conv.title}
                        </span>
                        
                        {/* Action Buttons - Show on Hover */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(conv);
                            }}
                            className="p-1 hover:bg-muted rounded"
                            title="Rename"
                          >
                            <Edit3 className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                            className="p-1 hover:bg-destructive/20 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Meta Row */}
                  <div className="flex items-center gap-2 pl-5.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(conv.updatedAt)}
                    </span>
                    {messageCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-muted/50">
                        {messageCount} {messageCount === 1 ? "message" : "messages"}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs">Start a new chat above</p>
          </div>
        )}
      </div>
    </div>
  );
};
