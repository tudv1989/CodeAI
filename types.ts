
export enum GameSide {
  TAI = 'TÀI', // Big: 11-18
  XIU = 'XỈU', // Small: 3-10
}

export interface GameResult {
  dice: [number, number, number];
  total: number;
  side: GameSide;
  timestamp: number;
}

export interface ChatMessage {
  role: 'dealer' | 'user';
  content: string;
}
