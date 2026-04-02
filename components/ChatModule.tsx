import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToDrSparkle } from '../services/geminiService';

export const ChatModule: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "嗨！小朋友你好呀！👋 我是Nina医生，欢迎来到牙齿王国！🏰✨ \n\n不管是关于刷牙的小秘密 🪥，还是对看牙医的好奇 🤔，都可以问我哦！\n\n让我们一起守护亮晶晶的笑容吧！🌟 你今天想聊些什么呢？",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Convert existing messages to Gemini history format
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendMessageToDrSparkle(history, userMessage.text);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "哎呀！我的魔法棒好像没电了... 🪄⚡ 请稍等一下或者再试一次哦！🥺",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full bg-white/50 rounded-3xl shadow-sm border border-white backdrop-blur-sm overflow-hidden my-4">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-tooth-dark to-cyan-500 p-4 flex items-center gap-3 text-white shadow-md z-10">
        <div className="bg-white/20 p-2 rounded-full">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Nina医生 AI</h2>
          <p className="text-xs text-cyan-100">随时为你解答牙齿的小秘密！✨</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
              msg.role === 'model' ? 'bg-white text-tooth-dark' : 'bg-gum-dark text-white'
            }`}>
              {msg.role === 'model' ? <Bot size={18} /> : <User size={18} />}
            </div>
            
            <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-gum-pink text-slate-800 rounded-tr-none' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-tooth-dark flex items-center justify-center shadow-sm">
              <Bot size={18} />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-1">
              <div className="w-2 h-2 bg-tooth-dark/40 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-tooth-dark/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-tooth-dark/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="问问关于牙齿的问题... (例如: 为什么要刷牙？)"
            className="w-full bg-slate-100 text-slate-800 placeholder:text-slate-400 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-tooth-dark/50 transition-shadow"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className="absolute right-2 bg-tooth-dark text-white p-2.5 rounded-full hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            <Send size={20} className={isLoading ? 'opacity-0' : 'opacity-100'} />
            {isLoading && (
               <span className="absolute inset-0 flex items-center justify-center">
                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               </span>
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          AI可能会犯错。如果牙齿真的很痛，一定要找爸爸妈妈带你去看真正的医生哦！🏥
        </p>
      </div>
    </div>
  );
};