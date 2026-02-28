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
  const [serviceAvailable, setServiceAvailable] = useState(true);

  // Fetch all DMs and build inbox
  useEffect(() => {
    const fetchMessages = async () => {
      if (!isSupabaseConfigured() || !user) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      try {
      const { data: dmsData, error: dmsError } = await supabase
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
      if (dmsError) {
        console.error('Failed fetching dms:', dmsError);
        // If the DMs table doesn't exist or request is malformed, mark service unavailable
        const errAny = dmsError as any;
        const status = (errAny && (errAny.status || errAny.statusCode || errAny.code)) || null;
        if (status === 404 || status === 400 || status === '404' || status === '400') setServiceAvailable(false);
      }
      if (dmsData) {
        // filter out malformed records that lack sender/recipient
        const cleaned = dmsData.filter((m: any) => m && m.sender && m.recipient);
        setMessages(cleaned);
        // Build inbox: unique users you've messaged or received from
        const usersMap: Record<string, any> = {};
        cleaned.forEach((msg: any) => {
          const other = msg.sender.id === user.id ? msg.recipient : msg.sender;
          if (!other) return;
          if (!usersMap[other.id] || new Date(msg.created_at) > new Date(usersMap[other.id].last.created_at)) {
            usersMap[other.id] = { user: other, last: msg };
          }
        });
        setInbox(Object.values(usersMap));
      }
      } catch (err) {
        console.error('fetchMessages error', err);
      } finally {
        setLoading(false);
      }
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
    if (error) {
      console.error('send message error', error);
      const errAny = error as any;
      const status = (errAny && (errAny.status || errAny.statusCode || errAny.code)) || null;
      if (status === 404 || status === 400 || status === '404' || status === '400') setServiceAvailable(false);
    }
    if (data) {
      // data should be an object (single) — append defensively
      setMessages(prev => [...prev, data]);
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mx-2 mt-4 sm:mx-auto sm:max-w-2xl w-full">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          <MessageCircle className="w-5 h-5 text-gold" />
          Direct Messages
        </h2>
        <p className="text-ink-muted mb-6 text-sm">Connect with fellow readers, make friends, and discuss books or anything else! Your inbox is private and encourages extended conversation.</p>

        {/* Inbox: list of conversations */}
        <div className="mb-8 w-full">
          <h3 className="text-sm font-semibold text-ink mb-2">Inbox</h3>
          {inbox.length === 0 ? (
            <div className="text-center text-ink-muted py-6">No conversations yet. Find a reader and start a chat!</div>
          ) : (
            <div className="space-y-2 w-full">
              {inbox.map(({ user: other, last }) => (
                <button
                  key={other.id}
                  onClick={() => setSelectedUser(other)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl glass-card border border-gold-light/20 hover:bg-cream/40 transition-colors ${selectedUser?.id === other.id ? 'bg-amber/10 border-gold' : ''}`}
                  style={{ minWidth: 0, fontSize: '1rem', padding: '0.75rem' }}
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
          <div className="glass-card rounded-2xl p-0 mb-6 border-2 border-gold-light/30 bg-gradient-to-br from-parchment/40 to-amber/10 shadow-lg w-full">
            {/* Whimsical Header */}
            <div className="flex flex-col items-center justify-center py-4 px-2 sm:py-6 sm:px-4 border-b border-gold-light/20 bg-gradient-to-br from-burgundy/10 to-blue/10 rounded-t-2xl">
              {selectedUser.avatar_url ? (
                <img src={selectedUser.avatar_url} alt={selectedUser.reader_name} className="w-16 h-16 rounded-full object-cover border-4 border-gold shadow-md mb-2" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-gold to-amber text-parchment border-4 border-gold shadow-md mb-2">
                  {selectedUser.reader_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-lg text-burgundy mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{selectedUser.reader_name}</span>
              <span className="text-xs text-ink-muted mb-2">@{selectedUser.public_slug}</span>
              <div className="flex gap-2 mb-2">
                <Link href={`/user/${selectedUser.public_slug}`} passHref legacyBehavior>
                  <button className="px-4 py-1 rounded-xl text-xs font-medium text-parchment bg-gradient-to-r from-gold to-amber shadow hover:scale-105 transition-transform">View profile</button>
                </Link>
                <Link href={`/shelf/${selectedUser.public_slug}`} passHref legacyBehavior>
                  <button className="px-4 py-1 rounded-xl text-xs font-medium text-parchment bg-gradient-to-r from-blue to-gold shadow hover:scale-105 transition-transform">Explore shelf</button>
                </Link>
              </div>
            </div>
            {/* Messages */}
            <div className="overflow-y-auto max-h-[60vh] px-2 py-4 sm:px-4 sm:py-6 space-y-4 bg-gradient-to-br from-cream/30 to-parchment/10 rounded-b-2xl">
              {messages.filter(m => (m.sender?.id === selectedUser.id || m.recipient?.id === selectedUser.id)).map(message => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-2 items-end ${user.id === message.sender.id ? "justify-end" : "justify-start"}`}
                >
                  {user.id !== message.sender.id && (
                    message.sender?.avatar_url ? (
                      <img src={message.sender.avatar_url} alt={message.sender.reader_name} className="w-8 h-8 rounded-full object-cover border-2 border-gold" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-base font-bold bg-gradient-to-br from-gold to-amber text-parchment border-2 border-gold">
                        {message.sender?.reader_name?.charAt(0).toUpperCase()}
                      </div>
                    )
                  )}
                  <div className={`rounded-2xl px-4 py-2 max-w-xs break-words shadow-md ${user.id === message.sender.id ? "bg-gradient-to-br from-burgundy/80 to-blue/60 text-parchment" : "bg-gradient-to-br from-gold/30 to-amber/20 text-ink"}`} style={{ fontFamily: "'Lora', Georgia, serif" }}>
                    <span className="block text-xs mb-1 opacity-70">{message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                  </div>
                  {user.id === message.sender.id && (
                    <button onClick={() => handleDeleteMessage(message.id)} className="ml-2 text-ink-muted hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
            {/* Message input bar */}
            {!serviceAvailable && (
              <div className="p-4 bg-rose/10 text-rose-dark text-sm rounded-b-2xl text-center">Messaging is temporarily unavailable — backend endpoint returned an error. Check your Supabase schema or run the migration.</div>
            )}
            <div className="flex items-center gap-2 px-2 py-3 sm:px-4 sm:py-4 border-t border-gold-light/20 bg-gradient-to-r from-cream/40 to-parchment/20 rounded-b-2xl">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a whimsical message..."
                className="flex-1 p-2 rounded-xl bg-cream/60 border border-gold-light/30 text-ink text-sm resize-none focus:outline-none focus:border-gold shadow"
                style={{ fontFamily: "'Lora', Georgia, serif" }}
                rows={2}
                disabled={sending || !serviceAvailable}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending || !serviceAvailable}
                className="px-4 py-2 rounded-xl text-sm font-medium text-parchment flex items-center gap-2 disabled:opacity-50 shadow-lg"
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
