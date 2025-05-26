import { Component } from '@angular/core';
import { RetirementAdvisorService } from '../core/services/gemini-ai.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
 
@Component({
  selector: 'app-ai-insight',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-insight.component.html',
  styleUrl: './ai-insight.component.css'
})
export class AiInsightComponent {
  allInvestments: any[] = [];
  stockInvestments: any[] = [];
  selectedStockName: string = '';
  advice: string = '';
  error: string = '';
  loading: boolean = false;
 
  showFullAdvice: boolean = false;
  constructor(private advisorService: RetirementAdvisorService) {}
 
  ngOnInit(): void {
    const data = localStorage.getItem('investments');
    this.allInvestments = data ? JSON.parse(data) : [];
    this.stockInvestments = this.allInvestments.filter(
      (inv) => inv.stockName
    );
  }
 
 
  get displayAdvice(): string {
    const lines = this.advice.split('\n');
    return this.showFullAdvice ? this.advice : lines.slice(0, 10).join('\n');
  }
 
  toggleAdviceView(): void {
    this.showFullAdvice = !this.showFullAdvice;
  }
 
  async getAdvice() {
    this.advice = '';
    this.error = '';
    this.loading = true;
 
    const selected = this.stockInvestments.find(
      (inv) => inv.stockName === this.selectedStockName
    );
 
    if (!selected) {
      this.error = 'Please select a valid stock with complete sell data.';
      this.loading = false;
      return;
    }
 
    try {
      this.advice = await this.advisorService.getInvestmentAdvice(selected);
      console.log('AI Advice:', this.advice);
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
}
 