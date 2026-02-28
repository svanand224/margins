"use client";

import { useState, useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MessageCircle, Send, Loader2, Trash2 } from "lucide-react";

export default function DirectMessagesPage() {
  const { user, profile: currentUserProfile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!isSupabaseConfigured() || !user) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data: dmsData } = await supabase
        .from("dms")
        .select(`
          id,
          content,
          created_at,
          sender:sender_id (
            id,
            reader_name,
            avatar_url,
            public_slug
          ),
          recipient:recipient_id (
            id,
            reader_name,
            avatar_url,
            public_slug
          )
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: true })
        .limit(100);
      if (dmsData) {
        setMessages(dmsData);
      }
      setLoading(false);
    };
    fetchMessages();
  }, [user]);

  const handleSendMessage = async (recipientId: string) => {
    if (!user || !newMessage.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dms")
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: newMessage.trim(),
      })
      .select(`
        id,
        content,
        created_at,
        sender:sender_id (
          id,
          reader_name,
          avatar_url,
          public_slug
        ),
        recipient:recipient_id (
          id,
          reader_name,
          avatar_url,
          public_slug
        )
      `)
      .single();
    if (!error && data) {
      setMessages([...messages, data]);
      setNewMessage("");
    }
    setSending(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    const supabase = createClient();
    await supabase.from("dms").delete().eq("id", messageId);
    setMessages(messages.filter((m) => m.id !== messageId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <MessageCircle className="w-16 h-16 text-gold/50 mb-4" />
        <h1 className="text-2xl font-bold text-ink mb-2">Sign in to view your messages</h1>
        <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-medium text-parchment bg-gold">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mx-4 mt-8 md:mx-auto md:max-w-2xl">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          <MessageCircle className="w-5 h-5 text-gold" />
          Direct Messages
        </h2>
        {/* Message Input */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm resize-none focus:outline-none focus:border-gold"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
            rows={2}
          />
          <div className="flex justify-end mt-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // For demo, send to first recipient in messages
                if (messages.length > 0) handleSendMessage(messages[0].recipient.id);
              }}
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 rounded-xl text-sm font-medium text-parchment flex items-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))" }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" />Send</>}
            </motion.button>
          </div>
        </div>
        {/* Messages List */}
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gold/30 mx-auto mb-2" />
              <p className="text-ink-muted text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`glass-card rounded-xl p-4 ${user.id === message.sender.id ? "bg-cream/80" : ""}`}>
                  <div className="flex gap-3">
                    {message.sender.avatar_url ? (
                      <img src={message.sender.avatar_url} alt={message.sender.reader_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "linear-gradient(135deg, var(--th-gold), var(--th-amber))", color: "var(--th-parchment)" }}>
                        {(message.sender.reader_name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{message.sender.reader_name}</span>
                          <span className="text-xs text-ink-muted">{new Date(message.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                        <button onClick={() => handleDeleteMessage(message.id)} className="text-ink-muted hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-ink mt-1" style={{ fontFamily: "'Lora', Georgia, serif" }}>{message.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
