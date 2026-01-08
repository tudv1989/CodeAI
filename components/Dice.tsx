
import React from 'react';

interface DiceProps {
  value: number;
  isRolling: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, isRolling }) => {
  const dots: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  return (
    <div className={`w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl shadow-inner relative transition-all duration-300 transform ${isRolling ? 'animate-shake' : 'hover:scale-105'}`}>
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-3 gap-1">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dots[value]?.includes(i) && (
              <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${value === 1 ? 'bg-red-600 shadow-[0_0_5px_rgba(220,38,38,0.5)]' : 'bg-gray-900'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dice;
