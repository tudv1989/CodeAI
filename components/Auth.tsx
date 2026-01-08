
import React, { useState } from 'react';
import { User as UserIcon, Lock, Crown, Mail, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = JSON.parse(localStorage.getItem('casino_users') || '{}');

    if (isLogin) {
      const user = users[username];
      if (user && user.password === password) {
        onAuthSuccess({
          username,
          displayName: user.displayName,
          balance: user.balance,
          avatarSeed: user.avatarSeed
        });
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } else {
      if (!username || !password || !displayName) {
        setError('Vui lòng điền đầy đủ thông tin.');
        return;
      }
      if (users[username]) {
        setError('Tên đăng nhập đã tồn tại.');
        return;
      }

      const newUser = {
        password,
        displayName,
        balance: 1000000, // Starting bonus
        avatarSeed: Math.random().toString(36).substring(7)
      };

      users[username] = newUser;
      localStorage.setItem('casino_users', JSON.stringify(users));
      
      onAuthSuccess({
        username,
        displayName: newUser.displayName,
        balance: newUser.balance,
        avatarSeed: newUser.avatarSeed
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-yellow-400 to-yellow-700 shadow-2xl mb-4">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black font-luxury gold-gradient">ROYAL CASINO</h1>
          <p className="text-yellow-500/50 text-xs tracking-[0.3em] font-bold mt-2 uppercase">Ghi danh thượng lưu</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex bg-black/40 p-1 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isLogin ? 'gold-bg text-black' : 'text-gray-500 hover:text-white'}`}
            >
              ĐĂNG NHẬP
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isLogin ? 'gold-bg text-black' : 'text-gray-500 hover:text-white'}`}
            >
              ĐĂNG KÝ
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Tên hiển thị</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                  <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-yellow-500/50 focus:ring-0 transition-all outline-none placeholder:text-gray-700"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Tên đăng nhập</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin123"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-yellow-500/50 focus:ring-0 transition-all outline-none placeholder:text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-yellow-500/50 focus:ring-0 transition-all outline-none placeholder:text-gray-700"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs font-semibold text-center mt-2">{error}</p>
            )}

            <button 
              type="submit"
              className="w-full gold-bg text-black font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(183,135,40,0.3)] hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 group"
            >
              {isLogin ? 'VÀO SÒNG BÀI' : 'TẠO TÀI KHOẢN'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
            Chỉ dành cho hội viên VIP. Vui lòng không chia sẻ mật khẩu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
