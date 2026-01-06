import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Send, Users, MessageSquare, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchMessages();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedUser) {
      fetchPrivateMessages();
    } else {
      fetchMessages();
    }
  }, [selectedUser]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/${user?.id}`);
      
      ws.onopen = () => {
        setConnected(true);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('WebSocket disconnected');
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/chat/messages?group_id=campus-general`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrivateMessages = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API}/chat/messages?receiver_id=${selectedUser.id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching private messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      content: newMessage,
      sender_name: user?.name,
      receiver_id: selectedUser?.id || null,
      group_id: selectedUser ? null : 'campus-general',
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messageData));
    } else {
      try {
        await axios.post(`${API}/chat/messages`, messageData);
        if (selectedUser) {
          fetchPrivateMessages();
        } else {
          fetchMessages();
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }

    setNewMessage('');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4" data-testid="chat-page">
      {/* Users List */}
      <Card className="glass-card w-72 hidden lg:flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-['Outfit'] flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contacts
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="px-4 pb-4 space-y-2">
            <Button
              variant={!selectedUser ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => setSelectedUser(null)}
              data-testid="general-chat-btn"
            >
              <div className="p-2 rounded-full bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Campus General</p>
                <p className="text-xs text-muted-foreground">Public chat</p>
              </div>
            </Button>

            <div className="py-2">
              <p className="text-xs text-muted-foreground px-2 mb-2">Direct Messages</p>
              {users.map((u) => (
                <Button
                  key={u.id}
                  variant={selectedUser?.id === u.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3 mb-1"
                  onClick={() => setSelectedUser(u)}
                  data-testid={`user-${u.id}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {u.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="glass-card flex-1 flex flex-col">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedUser ? (
              <>
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {selectedUser.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-['Outfit']">{selectedUser.name}</CardTitle>
                  <p className="text-xs text-muted-foreground capitalize">{selectedUser.role}</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 rounded-full bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-['Outfit']">Campus General</CardTitle>
                  <p className="text-xs text-muted-foreground">Public chat room</p>
                </div>
              </>
            )}
          </div>
          <Badge variant={connected ? 'default' : 'secondary'} className="gap-1">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
            {connected ? 'Live' : 'Connecting...'}
          </Badge>
        </CardHeader>

        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const showDate = index === 0 || 
                  formatDate(messages[index - 1]?.created_at) !== formatDate(message.created_at);

                return (
                  <React.Fragment key={message.id || index}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <Badge variant="secondary" className="text-xs">
                          {formatDate(message.created_at)}
                        </Badge>
                      </div>
                    )}
                    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-secondary text-xs">
                            {message.sender_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                        {!isOwn && (
                          <p className="text-xs text-muted-foreground mb-1">{message.sender_name}</p>
                        )}
                        <div
                          className={`inline-block px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-secondary rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
              data-testid="message-input"
            />
            <Button onClick={handleSendMessage} className="rounded-full" data-testid="send-message-btn">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
