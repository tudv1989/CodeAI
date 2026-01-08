
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Coins, History, MessageSquare, TrendingUp, Trophy, Wallet, RefreshCw, ChevronRight, LogOut, User as UserIcon } from 'lucide-react';
import { GameSide, GameResult, ChatMessage, User } from './types';
import Dice from './components/Dice';
import Auth from './components/Auth';
import { getDealerCommentary } from './geminiService';

const BET_AMOUNTS = [1000, 5000, 10000, 50000, 100000, 500000];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [currentBet, setCurrentBet] = useState(10000);
  const [betSide, setBetSide] = useState<GameSide | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [diceValues, setDiceValues] = useState<[number, number, number]>([1, 1, 1]);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load user from session
  useEffect(() => {
    const savedUser = sessionStorage.getItem('current_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setBalance(parsedUser.balance);
      setMessages([{ 
        role: 'dealer', 
        content: `Chào mừng đại gia ${parsedUser.displayName} đã quay trở lại sòng bài Royal!` 
      }]);
    }
  }, []);

  // Persist balance to "database" (localStorage)
  useEffect(() => {
    if (user) {
      const users = JSON.parse(localStorage.getItem('casino_users') || '{}');
      if (users[user.username]) {
        users[user.username].balance = balance;
        localStorage.setItem('casino_users', JSON.stringify(users));
        
        // Also update session
        const updatedUser = { ...user, balance };
        sessionStorage.setItem('current_user', JSON.stringify(updatedUser));
      }
    }
  }, [balance, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setBalance(userData.balance);
    sessionStorage.setItem('current_user', JSON.stringify(userData));
    setMessages([{ 
      role: 'dealer', 
      content: `Kính chào đại gia ${userData.displayName}. Chúc ngài một đêm đại thắng rực rỡ!` 
    }]);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('current_user');
    setUser(null);
  };

  const rollDice = useCallback(async () => {
    if (isRolling || !betSide || !user) return;
    if (balance < currentBet) {
      alert("Số dư không đủ, vui lòng nạp thêm!");
      return;
    }

    setIsRolling(true);
    setBalance(prev => prev - currentBet);
    setLastWin(null);

    setTimeout(async () => {
      const newDice: [number, number, number] = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ];
      
      const total = newDice.reduce((a, b) => a + b, 0);
      const side = total >= 11 ? GameSide.TAI : GameSide.XIU;
      
      const result: GameResult = {
        dice: newDice,
        total,
        side,
        timestamp: Date.now(),
      };

      setDiceValues(newDice);
      setHistory(prev => [result, ...prev].slice(0, 20));
      setIsRolling(false);

      let winAmount = 0;
      if (side === betSide) {
        winAmount = currentBet * 2;
        setBalance(prev => prev + winAmount);
        setLastWin(winAmount);
      }

      const commentary = await getDealerCommentary(result, balance + winAmount);
      setMessages(prev => [...prev, { role: 'dealer', content: commentary }]);
    }, 1500);
  }, [isRolling, betSide, balance, currentBet, user]);

  const toggleBetSide = (side: GameSide) => {
    if (isRolling) return;
    setBetSide(side);
  };

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-yellow-500/30 shadow-2xl relative">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-700 rounded-2xl shadow-lg">
            <Trophy className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-luxury font-black gold-gradient">ROYAL TAI XIU</h1>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               <p className="text-[10px] text-yellow-500/70 tracking-[0.2em] font-semibold uppercase">VIP MEMBER: {user.displayName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tài khoản (Chip)</span>
            <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20 shadow-[inset_0_0_10px_rgba(234,179,8,0.1)]">
              <Coins className="text-yellow-400 w-5 h-5" />
              <span className="text-2xl font-bold text-yellow-400 tabular-nums">{balance.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setBalance(prev => prev + 1000000)}
              className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-yellow-500"
              title="Nhận chip miễn phí"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors text-red-500"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        {/* Main Board */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-gradient-to-b from-neutral-900 to-black p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-yellow-500/5 rounded-full blur-[100px]" />

            {/* Dice Display */}
            <div className="flex justify-center items-center gap-4 md:gap-8 mb-12 py-10 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
              {diceValues.map((val, idx) => (
                <Dice key={idx} value={val} isRolling={isRolling} />
              ))}
              <div className="ml-4 md:ml-8 flex flex-col items-center">
                <span className="text-gray-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Kết quả</span>
                <span className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{isRolling ? '?' : diceValues.reduce((a,b)=>a+b,0)}</span>
              </div>
            </div>

            {/* Betting Areas */}
            <div className="grid grid-cols-2 gap-6">
              <button
                disabled={isRolling}
                onClick={() => toggleBetSide(GameSide.XIU)}
                className={`group relative overflow-hidden p-8 rounded-[2.5rem] transition-all duration-500 border-4 h-56 flex flex-col items-center justify-center ${
                  betSide === GameSide.XIU 
                    ? 'border-red-500 bg-red-500/10 shadow-[0_0_60px_rgba(239,68,68,0.3)]' 
                    : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <span className={`text-6xl font-black mb-2 transition-all duration-500 ${betSide === GameSide.XIU ? 'text-red-500 scale-110' : 'text-gray-600'}`}>XỈU</span>
                <span className="text-xs font-bold opacity-40 uppercase tracking-widest">Nhỏ (3 - 10)</span>
                {betSide === GameSide.XIU && (
                   <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500 text-white text-[10px] px-3 py-1.5 rounded-full font-black animate-pulse shadow-lg">
                     <TrendingUp size={12} />
                     ON BET
                   </div>
                )}
              </button>

              <button
                disabled={isRolling}
                onClick={() => toggleBetSide(GameSide.TAI)}
                className={`group relative overflow-hidden p-8 rounded-[2.5rem] transition-all duration-500 border-4 h-56 flex flex-col items-center justify-center ${
                  betSide === GameSide.TAI 
                    ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_60px_rgba(234,179,8,0.3)]' 
                    : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <span className={`text-6xl font-black mb-2 transition-all duration-500 ${betSide === GameSide.TAI ? 'text-yellow-500 scale-110' : 'text-gray-600'}`}>TÀI</span>
                <span className="text-xs font-bold opacity-40 uppercase tracking-widest">Lớn (11 - 18)</span>
                {betSide === GameSide.TAI && (
                   <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-yellow-500 text-black text-[10px] px-3 py-1.5 rounded-full font-black animate-pulse shadow-lg">
                     <TrendingUp size={12} />
                     ON BET
                   </div>
                )}
              </button>
            </div>

            {/* Bet Multiplier */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-yellow-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Mức cược hiện tại</span>
                </div>
                <span className="text-yellow-500 font-black">{currentBet.toLocaleString()} Chip</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {BET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCurrentBet(amt)}
                    className={`py-4 px-2 rounded-2xl font-black transition-all border ${
                      currentBet === amt 
                        ? 'gold-bg text-black shadow-xl scale-105 border-transparent' 
                        : 'bg-black/40 text-gray-400 border-white/5 hover:bg-white/5'
                    }`}
                  >
                    {(amt >= 1000) ? `${amt/1000}K` : amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Game */}
            <div className="mt-10 flex flex-col items-center relative">
              {lastWin && (
                <div className="absolute -top-16 text-3xl font-black text-green-400 animate-bounce flex items-center gap-3 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                  <Trophy size={32} />
                  +{lastWin.toLocaleString()}!
                </div>
              )}
              <button
                onClick={rollDice}
                disabled={isRolling || !betSide}
                className={`w-full max-w-lg py-7 rounded-[2rem] text-2xl font-black transition-all flex items-center justify-center gap-4 relative overflow-hidden group shadow-2xl ${
                  isRolling || !betSide
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'gold-bg text-black hover:scale-[1.02] active:scale-95'
                }`}
              >
                {isRolling ? (
                   <>
                    <RefreshCw className="animate-spin" />
                    ĐANG LẮC...
                   </>
                ) : (
                  <>
                    <RefreshCw className="group-hover:rotate-180 transition-transform duration-700" />
                    {betSide ? `XÁC NHẬN ${betSide}` : 'CHỌN CỬA ĐẶT CƯỢC'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <History size={20} className="text-yellow-500" />
                 <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Bảng lịch sử</h2>
               </div>
               <div className="flex gap-6 text-[10px] font-black tracking-widest uppercase">
                 <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                   <span className="text-gray-400">TÀI: {history.filter(h => h.side === GameSide.TAI).length}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                   <span className="text-gray-400">XỈU: {history.filter(h => h.side === GameSide.XIU).length}</span>
                 </div>
               </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {history.length > 0 ? history.map((res, i) => (
                <div 
                  key={res.timestamp} 
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 transition-transform hover:scale-110 cursor-help shadow-lg ${
                    res.side === GameSide.TAI ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                  }`}
                  title={`Tổng: ${res.total} | Xúc xắc: ${res.dice.join(', ')}`}
                >
                  {res.side[0]}
                </div>
              )) : (
                <div className="w-full text-center text-gray-600 italic text-sm py-4">Chưa có dữ liệu ván đấu...</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Chat & Stats */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-black/40 rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-[600px] lg:flex-grow shadow-xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-yellow-500/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl border-2 border-yellow-500/50 p-1 bg-black shadow-lg">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=dealer_royal`} alt="Dealer" className="w-full h-full rounded-xl object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#0a0a0a]" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">Royal Dealer</h3>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mt-0.5">Sẵn sàng phục vụ</p>
                </div>
              </div>
              <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                <UserIcon size={20} className="text-yellow-500" />
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-6 space-y-5 scrollbar-hide"
            >
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'dealer' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'dealer' 
                      ? 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none' 
                      : 'bg-yellow-500 text-black font-bold rounded-tr-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-black/60 border-t border-white/5">
              <div className="flex items-center gap-3 bg-white/5 px-5 py-4 rounded-2xl border border-white/10 focus-within:border-yellow-500/50 transition-all">
                <MessageSquare size={18} className="text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Gửi tin nhắn cho Dealer..." 
                  className="bg-transparent border-none focus:ring-0 text-sm text-white w-full placeholder:text-gray-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      if (!input.value.trim()) return;
                      setMessages(prev => [...prev, { role: 'user', content: input.value }]);
                      input.value = '';
                    }
                  }}
                />
                <button className="text-yellow-500 hover:scale-110 transition-transform">
                   <ChevronRight size={22} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-neutral-900 to-black p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-6">Trạng thái hệ thống</h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400 font-medium">Đang trực tuyến</span>
                <span className="text-sm font-black text-white flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                   1,842
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400 font-medium">Hũ Jackpot</span>
                <span className="text-lg font-black text-yellow-500 tabular-nums tracking-wider">8,540,200,000</span>
              </div>
              <div className="relative w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-700 to-yellow-400 w-3/4 animate-pulse rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              </div>
              <p className="text-[10px] text-gray-600 text-center font-bold uppercase tracking-widest mt-2">Hệ thống minh bạch 100%</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center border-t border-white/5">
        <p className="text-[10px] text-gray-600 max-w-2xl mx-auto leading-relaxed uppercase tracking-widest font-bold">
          Dự án mô phỏng giải trí kỹ thuật số. Không có giá trị quy đổi tiền thật.
          <br />
          &copy; 2025 Royal Elite Club. Đã đăng ký bản quyền.
        </p>
      </footer>
    </div>
  );
};

export default App;
