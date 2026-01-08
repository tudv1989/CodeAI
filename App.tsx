
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Coins, History, MessageSquare, TrendingUp, Trophy, Wallet, RefreshCw, ChevronRight } from 'lucide-react';
import { GameSide, GameResult, ChatMessage } from './types';
import Dice from './components/Dice';
import { getDealerCommentary } from './geminiService';

const BET_AMOUNTS = [1000, 5000, 10000, 50000, 100000, 500000];

const App: React.FC = () => {
  const [balance, setBalance] = useState(1000000);
  const [currentBet, setCurrentBet] = useState(10000);
  const [betSide, setBetSide] = useState<GameSide | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [diceValues, setDiceValues] = useState<[number, number, number]>([1, 1, 1]);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'dealer', content: 'Chào mừng quý khách đến với Royal Tai Xiu. Chúc quý khách một ngày đại thắng!' }
  ]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const rollDice = useCallback(async () => {
    if (isRolling || !betSide) return;
    if (balance < currentBet) {
      alert("Bạn không đủ chip!");
      return;
    }

    setIsRolling(true);
    setBalance(prev => prev - currentBet);
    setLastWin(null);

    // Simulate rolling delay
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

      // Handle win/loss
      let winAmount = 0;
      if (side === betSide) {
        // Simple logic: 1:1 payout
        // Note: Triple (Bão) usually makes the house win in Tai/Xiu unless specific triple bets exist,
        // but for simplicity, we'll follow standard Big/Small rules.
        winAmount = currentBet * 2;
        setBalance(prev => prev + winAmount);
        setLastWin(winAmount);
      }

      // AI Commentary
      const commentary = await getDealerCommentary(result, balance + winAmount);
      setMessages(prev => [...prev, { role: 'dealer', content: commentary }]);
    }, 1500);
  }, [isRolling, betSide, balance, currentBet]);

  const toggleBetSide = (side: GameSide) => {
    if (isRolling) return;
    setBetSide(side);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-yellow-500/30 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-700 rounded-2xl shadow-lg">
            <Trophy className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-luxury font-black gold-gradient">ROYAL TAI XIU</h1>
            <p className="text-xs text-yellow-500/70 tracking-[0.2em] font-semibold">PREMIUM CASINO EXPERIENCE</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Balance</span>
            <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
              <Coins className="text-yellow-400 w-5 h-5" />
              <span className="text-2xl font-bold text-yellow-400">{balance.toLocaleString()}</span>
            </div>
          </div>
          <button 
            onClick={() => setBalance(1000000)}
            className="p-2 hover:rotate-180 transition-transform duration-500 text-gray-500 hover:text-yellow-400"
          >
            <RefreshCw size={24} />
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        {/* Main Board */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-gradient-to-b from-neutral-900 to-black p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
            {/* Decorative background circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-yellow-500/5 rounded-full blur-[100px]" />

            {/* Dice Display */}
            <div className="flex justify-center items-center gap-4 md:gap-8 mb-12 py-8 bg-black/40 rounded-3xl border border-white/5">
              {diceValues.map((val, idx) => (
                <Dice key={idx} value={val} isRolling={isRolling} />
              ))}
              <div className="ml-4 md:ml-8 flex flex-col items-center">
                <span className="text-gray-500 text-xs font-bold uppercase mb-1">Total</span>
                <span className="text-5xl font-black text-white">{isRolling ? '?' : diceValues.reduce((a,b)=>a+b,0)}</span>
              </div>
            </div>

            {/* Betting Areas */}
            <div className="grid grid-cols-2 gap-6">
              {/* XIU (Small) */}
              <button
                disabled={isRolling}
                onClick={() => toggleBetSide(GameSide.XIU)}
                className={`group relative overflow-hidden p-8 rounded-3xl transition-all duration-300 border-4 h-48 flex flex-col items-center justify-center ${
                  betSide === GameSide.XIU 
                    ? 'border-red-500 bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.2)]' 
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className={`text-5xl font-black mb-2 transition-colors ${betSide === GameSide.XIU ? 'text-red-500' : 'text-gray-400'}`}>XỈU</span>
                <span className="text-sm font-bold opacity-60">3 - 10</span>
                {betSide === GameSide.XIU && (
                   <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full animate-pulse">
                     <TrendingUp size={12} />
                     BETTING
                   </div>
                )}
              </button>

              {/* TAI (Big) */}
              <button
                disabled={isRolling}
                onClick={() => toggleBetSide(GameSide.TAI)}
                className={`group relative overflow-hidden p-8 rounded-3xl transition-all duration-300 border-4 h-48 flex flex-col items-center justify-center ${
                  betSide === GameSide.TAI 
                    ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_40px_rgba(234,179,8,0.2)]' 
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className={`text-5xl font-black mb-2 transition-colors ${betSide === GameSide.TAI ? 'text-yellow-500' : 'text-gray-400'}`}>TÀI</span>
                <span className="text-sm font-bold opacity-60">11 - 18</span>
                {betSide === GameSide.TAI && (
                   <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-500 text-black text-[10px] px-2 py-1 rounded-full animate-pulse">
                     <TrendingUp size={12} />
                     BETTING
                   </div>
                )}
              </button>
            </div>

            {/* Bet Multiplier Bar */}
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-4">
                <Wallet size={16} className="text-yellow-500" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Bet Amount</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {BET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCurrentBet(amt)}
                    className={`py-3 px-2 rounded-xl font-bold transition-all ${
                      currentBet === amt 
                        ? 'gold-bg text-black shadow-lg scale-105' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {(amt >= 1000) ? `${amt/1000}K` : amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-10 flex flex-col items-center">
              {lastWin && (
                <div className="mb-4 text-2xl font-black text-green-400 animate-bounce flex items-center gap-2">
                  <Trophy size={24} />
                  WIN +{lastWin.toLocaleString()}!
                </div>
              )}
              <button
                onClick={rollDice}
                disabled={isRolling || !betSide}
                className={`w-full max-w-md py-6 rounded-2xl text-2xl font-black transition-all flex items-center justify-center gap-3 relative overflow-hidden ${
                  isRolling || !betSide
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'gold-bg text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(183,135,40,0.5)] active:scale-95'
                }`}
              >
                {isRolling ? (
                   <>
                    <RefreshCw className="animate-spin" />
                    LẮC XÚC XẮC...
                   </>
                ) : (
                  <>
                    <RefreshCw />
                    {betSide ? `ĐẶT ${betSide}` : 'CHỌN CỬA ĐẶT'}
                  </>
                )}
              </button>
              <p className="mt-4 text-xs text-gray-500 uppercase tracking-tighter">Please gamble responsibly. VIP Members Only.</p>
            </div>
          </div>

          {/* Bead Plate (History) */}
          <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <History size={18} className="text-yellow-500" />
                 <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Results</h2>
               </div>
               <div className="flex gap-4 text-[10px] font-bold">
                 <div className="flex items-center gap-1">
                   <div className="w-2 h-2 rounded-full bg-yellow-500" />
                   <span className="text-gray-400">TÀI: {history.filter(h => h.side === GameSide.TAI).length}</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <div className="w-2 h-2 rounded-full bg-red-500" />
                   <span className="text-gray-400">XỈU: {history.filter(h => h.side === GameSide.XIU).length}</span>
                 </div>
               </div>
            </div>
            <div className="flex gap-2">
              {history.length > 0 ? history.map((res, i) => (
                <div 
                  key={res.timestamp} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    res.side === GameSide.TAI ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                  }`}
                  title={`Total: ${res.total} - ${res.dice.join(',')}`}
                >
                  {res.side[0]}
                </div>
              )) : (
                <div className="text-gray-600 italic text-sm py-2">No history yet...</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: AI Dealer Chat */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-black/40 rounded-[2rem] border border-white/5 overflow-hidden flex flex-col h-[500px] lg:h-auto lg:flex-grow">
            <div className="p-5 border-b border-white/5 flex items-center gap-3 bg-gradient-to-r from-yellow-500/10 to-transparent">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-yellow-500 p-0.5">
                  <img src="https://picsum.photos/seed/dealer/200" alt="Dealer" className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all cursor-pointer" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
              </div>
              <div>
                <h3 className="font-bold text-white leading-none">AI Dealer</h3>
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider mt-1">Online & Professional</p>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-5 space-y-4 scrollbar-hide"
            >
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'dealer' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                    msg.role === 'dealer' 
                      ? 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none' 
                      : 'bg-yellow-500 text-black font-semibold rounded-tr-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-black/60 border-t border-white/5">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                <MessageSquare size={16} className="text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Ask for advice..." 
                  className="bg-transparent border-none focus:ring-0 text-sm text-white w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      if (!input.value.trim()) return;
                      setMessages(prev => [...prev, { role: 'user', content: input.value }]);
                      input.value = '';
                      // Simulate small delay then could call Gemini for specific advice
                    }
                  }}
                />
                <ChevronRight size={18} className="text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-black p-6 rounded-[2rem] border border-white/5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Casino Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Active Players</span>
                <span className="text-sm font-bold text-white">1,248</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Jackpot Pool</span>
                <span className="text-sm font-bold text-yellow-500">2,450,000,000</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full w-2/3 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="py-8 text-center border-t border-white/5">
        <p className="text-xs text-gray-600 max-w-2xl mx-auto leading-relaxed">
          The "Royal Tai Xiu Casino" is a purely digital entertainment experience. All virtual currencies used in this application have no real-world value. Please gamble responsibly. (C) 2025 Royal Gaming Network.
        </p>
      </footer>
    </div>
  );
};

export default App;
