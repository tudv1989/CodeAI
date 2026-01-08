
import { GoogleGenAI } from "@google/genai";
import { GameSide, GameResult } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getDealerCommentary = async (result: GameResult, balance: number): Promise<string> => {
  try {
    const prompt = `
      Bạn là một Dealer (người chia bài) chuyên nghiệp, quyến rũ và thông minh tại sòng bài "Royal Tai Xiu".
      Kết quả ván vừa rồi: 
      - Xúc xắc: ${result.dice.join(', ')}
      - Tổng điểm: ${result.total}
      - Cửa thắng: ${result.side}
      - Số dư hiện tại của người chơi: ${balance.toLocaleString()} chip.

      Hãy đưa ra một câu bình luận ngắn gọn (dưới 30 chữ) bằng tiếng Việt để chúc mừng hoặc an ủi người chơi một cách sang trọng. 
      Có thể pha chút hài hước hoặc mời gọi họ đặt cược tiếp. 
      Nếu tổng điểm là bộ ba (3 con giống nhau), hãy nhấn mạnh đây là trường hợp đặc biệt (Bão).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Bạn là Dealer sòng bài sang trọng. Ngôn ngữ: Tiếng Việt. Phong cách: Chuyên nghiệp, lôi cuốn.",
        temperature: 0.8,
      },
    });

    return response.text || "Chúc mừng bạn! Bạn có muốn thử vận may ở ván tiếp theo không?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Một ván đấu kịch tính! Hãy chuẩn bị cho ván tiếp theo nhé.";
  }
};
