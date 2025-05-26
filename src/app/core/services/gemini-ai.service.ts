import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
 
const API_KEY = 'AIzaSyBy_zw81B0mMZHj6CPNgCuIYROu-hi6N8o'; // Replace with your key
 
@Injectable({
    providedIn: 'root',
})
export class RetirementAdvisorService {
    private genAI = new GoogleGenerativeAI(API_KEY);
    private chat: any;
 
    constructor() {
        this.initChat();
    }
 
    private async initChat() {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        this.chat = model.startChat({ history: [] });
    }
 
    private buildPromptFromStoredData(investmentData: any): string {
        let prompt = `You are a Investment advisor. I bought ${investmentData.numberOfShares} shares of ${investmentData.stockName} on ${investmentData.purchaseDate} at $${investmentData.purchasePrice} each using ${investmentData.dematAccount} with ${investmentData.brokerage}% brokerage.`;
 
        if (investmentData.sellDate && investmentData.sellPrice) {
            prompt += ` I sold them on ${investmentData.sellDate} at $${investmentData.sellPrice}. What is the return and was it a good trade?`;
        } else {
            prompt += ` I have not sold these shares yet. Based on current market trends, what is the outlook for this investment? Should I hold or sell soon? Provide suggestions or similar opportunities.`;
        }
 
        return prompt;
    }
 
    async getInvestmentAdvice(investmentData: any): Promise<string> {
        if (
            !investmentData.numberOfShares ||
            !investmentData.stockName ||
            !investmentData.purchaseDate ||
            !investmentData.purchasePrice ||
            !investmentData.dematAccount ||
            investmentData.brokerage == null
        ) {
            throw new Error('Incomplete investment data. Purchase information is required.');
        }
   
        const prompt = this.buildPromptFromStoredData(investmentData);
   
        try {
            const result = await this.chat.sendMessage(prompt);
            const response = await result.response;
            const fullText = response.text();
   
            // ✅ Return shortened, filtered response
            return this.extractKeyInsights(fullText);
            // return fullText;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error('Failed to fetch advice from Gemini API');
        }
    }
   
    private extractKeyInsights(text: string): string {
        const lines = text
            .split('\n')
            .map(line => line.trim().replace(/\*+/g, '')); // Remove * and ** used in formatting
   
        const importantLines = lines.filter(line =>
            line &&
            !line.toLowerCase().includes('disclaimer') &&
            !line.toLowerCase().includes('this is not financial advice') &&
            !line.startsWith('Based on') &&
            !line.startsWith('Keep in mind') &&
            !line.startsWith('Consider') &&
            !line.startsWith('Check') &&
            !line.startsWith('Look for') &&
            !line.toLowerCase().startsWith('how to') &&
            !line.toLowerCase().includes('etf') &&
            !line.toLowerCase().includes('diversify') &&
            line.length < 300
        );
   
        return importantLines.join('\n'); // Return all matching lines, not just top 30
    }
   
   
   
}
 
 
 
 