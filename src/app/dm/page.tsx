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
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [inbox, setInbox] = useState<any[]>([]);

  // Fetch all DMs and build inbox
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
        .limit(200);
      if (dmsData) {
        setMessages(dmsData);
        // Build inbox: unique users you've messaged or received from
        const usersMap: Record<string, any> = {};
        dmsData.forEach((msg: any) => {
          const other = msg.sender.id === user.id ? msg.recipient : msg.sender;
          if (!usersMap[other.id] || new Date(msg.created_at) > new Date(usersMap[other.id].last.created_at)) {
            usersMap[other.id] = { user: other, last: msg };
          }
        });
        setInbox(Object.values(usersMap));
      }
      setLoading(false);
    };
    fetchMessages();
  }, [user]);

  // Send a message to selected user
  const handleSendMessage = async () => {
    if (!user || !newMessage.trim() || !selectedUser) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dms")
      .insert({
        sender_id: user.id,
        recipient_id: selectedUser.id,
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

  // Delete a message
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
        <p className="text-ink-muted mb-6 text-sm">Connect with fellow readers, make friends, and discuss books or anything else! Your inbox is private and encourages extended conversation.</p>

        {/* Inbox: list of conversations */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-ink mb-2">Inbox</h3>
          {inbox.length === 0 ? (
            <div className="text-center text-ink-muted py-6">No conversations yet. Find a reader and start a chat!</div>
          ) : (
            <div className="space-y-2">
              {inbox.map(({ user: other, last }) => (
                <button
                  key={other.id}
                  onClick={() => setSelectedUser(other)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl glass-card border border-gold-light/20 hover:bg-cream/40 transition-colors ${selectedUser?.id === other.id ? 'bg-amber/10 border-gold' : ''}`}
                >
                  {other.avatar_url ? (
                    <img src={other.avatar_url} alt={other.reader_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-gold to-amber text-parchment">
                      {other.reader_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <span className="font-semibold text-ink">{other.reader_name}</span>
                    <p className="text-xs text-ink-muted truncate">{last.content}</p>
                  </div>
                  <span className="text-xs text-ink-muted">{new Date(last.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation view */}
        {selectedUser ? (
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              {selectedUser.avatar_url ? (
                <img src={selectedUser.avatar_url} alt={selectedUser.reader_name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-gold to-amber text-parchment">
                  {selectedUser.reader_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-ink text-lg">{selectedUser.reader_name}</span>
            </div>
            <div className="overflow-y-auto max-h-96 space-y-3 mb-4">
              {messages.filter(m => (m.sender.id === selectedUser.id || m.recipient.id === selectedUser.id)).map(message => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`rounded-xl p-3 flex gap-3 items-start ${user.id === message.sender.id ? "bg-cream/80 justify-end" : "bg-amber/10"}`} style={{ boxShadow: user.id === message.sender.id ? '0 2px 8px rgba(255, 193, 7, 0.08)' : 'none' }}>
                  {message.sender.avatar_url ? (
                    <img src={message.sender.avatar_url} alt={message.sender.reader_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-base font-bold bg-gradient-to-br from-gold to-amber text-parchment">
                      {message.sender.reader_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{message.sender.reader_name}</span>
                      <span className="text-xs text-ink-muted">{new Date(message.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                    <p className="text-sm text-ink-light mt-1 whitespace-pre-line" style={{ fontFamily: "'Lora', Georgia, serif" }}>{message.content}</p>
                  </div>
                  <button onClick={() => handleDeleteMessage(message.id)} className="text-ink-muted hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
            {/* Message input */}
            <div className="flex gap-2 mt-2">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-3 rounded-xl bg-cream/50 border border-gold-light/30 text-ink text-sm resize-none focus:outline-none focus:border-gold"
                style={{ fontFamily: "'Lora', Georgia, serif" }}
                rows={2}
                disabled={sending}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 rounded-xl text-sm font-medium text-parchment flex items-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--th-gold), var(--th-gold-dark))" }}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" />Send</>}
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 text-center text-ink-muted">
            <MessageCircle className="w-12 h-12 text-gold/30 mx-auto mb-2" />
            <p className="text-sm">Select a conversation to start chatting, or <Link href="/discover" className="text-gold hover:text-gold-dark font-semibold">find a reader</Link> to begin a new friendship!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
