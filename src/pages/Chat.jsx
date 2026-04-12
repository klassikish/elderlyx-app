import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Heart, Car, CheckCheck, Check } from 'lucide-react';
import SosButton from '@/components/SosButton';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

const urlParams = new URLSearchParams(window.location.search);
const BOOKING_ID = urlParams.get('booking');

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const bottomRef = useRef(null);
  const [text, setText] = useState('');

  // Load booking details
  const { data: bookings = [] } = useQuery({
    queryKey: ['booking-detail', BOOKING_ID],
    queryFn: () => base44.entities.Booking.filter({ id: BOOKING_ID }, '-created_date', 1),
    enabled: !!BOOKING_ID,
  });
  const booking = bookings[0];

  // Load messages
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', BOOKING_ID],
    queryFn: () => base44.entities.Message.filter({ booking_id: BOOKING_ID }, 'created_date', 100),
    enabled: !!BOOKING_ID,
    refetchInterval: 3000, // poll every 3 seconds
  });

  // Mark incoming messages as read
  useEffect(() => {
    const unread = messages.filter(m => !m.is_read && m.sender_id !== user?.id);
    if (unread.length === 0) return;
    unread.forEach(m =>
      base44.entities.Message.update(m.id, { is_read: true, read_at: new Date().toISOString() })
    );
    qc.invalidateQueries({ queryKey: ['messages', BOOKING_ID] });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!BOOKING_ID) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.booking_id === BOOKING_ID) {
        qc.invalidateQueries({ queryKey: ['messages', BOOKING_ID] });
        if (event.type === 'create' && event.data.sender_id !== user?.id) {
          toast(`💬 ${event.data.sender_name}: ${event.data.text}`, { duration: 3000 });
          // Send push notification
          base44.entities.Notification.create({
            user_email: user?.email,
            title: `New message from ${event.data.sender_name}`,
            body: event.data.text,
            type: 'general',
            booking_id: BOOKING_ID,
          });
        }
      }
    });
    return unsub;
  }, [BOOKING_ID, user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: () => base44.entities.Message.create({
      booking_id: BOOKING_ID,
      sender_id: user?.id,
      sender_name: user?.full_name || user?.email,
      sender_role: user?.role || 'family',
      text: text.trim(),
      is_read: false,
    }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['messages', BOOKING_ID] });
      const prev = qc.getQueryData(['messages', BOOKING_ID]) || [];
      const optimisticMsg = {
        id: `optimistic-${Date.now()}`,
        booking_id: BOOKING_ID,
        sender_id: user?.id,
        sender_name: user?.full_name || user?.email,
        text: text.trim(),
        is_read: false,
        created_date: new Date().toISOString(),
      };
      qc.setQueryData(['messages', BOOKING_ID], [...prev, optimisticMsg]);
      return { prev };
    },
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['messages', BOOKING_ID] });
    },
    onError: (err, _, ctx) => {
      if (ctx?.prev) qc.setQueryData(['messages', BOOKING_ID], ctx.prev);
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const otherName = user?.role === 'caregiver'
    ? booking?.family_name || booking?.family_email
    : booking?.caregiver_name || 'Caregiver';

  // Group messages by date
  const grouped = messages.reduce((acc, m) => {
    const day = format(new Date(m.created_date), 'MMM d, yyyy');
    if (!acc[day]) acc[day] = [];
    acc[day].push(m);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-screen bg-background max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/ChatList')} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        {booking && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${booking.service_type === 'companionship' ? 'bg-pink-100' : 'bg-blue-100'}`}>
            {booking.service_type === 'companionship'
              ? <Heart className="w-5 h-5 text-pink-500" />
              : <Car className="w-5 h-5 text-blue-500" />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm truncate">{otherName}</p>
          {booking && (
            <p className="text-[10px] text-muted-foreground capitalize">{booking.service_type} · {booking.status}</p>
          )}
          </div>
          {booking && <SosButton booking={booking} />}
          </div>

          {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!BOOKING_ID && (
          <p className="text-center text-muted-foreground text-sm py-10">No booking selected.</p>
        )}
        {Object.entries(grouped).map(([day, msgs]) => (
          <div key={day}>
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2">
              {msgs.map((m, i) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!isMe && (
                        <span className="text-[10px] text-muted-foreground font-medium ml-1">{m.sender_name}</span>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-card border border-border text-foreground rounded-bl-sm'
                      }`}>
                        {m.text}
                      </div>
                      <div className={`flex items-center gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[9px] text-muted-foreground">{format(new Date(m.created_date), 'h:mm a')}</span>
                        {isMe && (
                          m.is_read
                            ? <CheckCheck className="w-3 h-3 text-primary" />
                            : <Check className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        {messages.length === 0 && BOOKING_ID && (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-4xl mb-3">👋</p>
            <p className="font-semibold text-foreground">Say hello!</p>
            <p className="text-xs text-muted-foreground mt-1">This is the start of your conversation with {otherName}.</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 pb-safe">
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none bg-muted rounded-2xl px-4 py-3 text-sm outline-none border-0 focus:ring-2 focus:ring-primary/30 max-h-32 min-h-[44px]"
            style={{ lineHeight: '1.4' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}