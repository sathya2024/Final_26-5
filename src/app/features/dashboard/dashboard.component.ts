import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Chart, registerables } from 'chart.js/auto';
import { AppConfig } from '../../core/config/ap.config';
import { Observable } from 'rxjs';
import { catchError, of, throwError } from 'rxjs';
 
import { Injectable } from '@angular/core';
import { AiInsightComponent } from "../../ai-insight/ai-insight.component";
 
declare var bootstrap: any;
 
Chart.register(...registerables);
 
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, AiInsightComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  logoPath: string = 'assets/images/logo2.png';
  userInitial: string = '';
  investments: any[] = [];
  userId: number = 0;
  totalInvestmentValue = 0;
  totalInvestmentCost = 0;
  totalGainLoss = 0;
  totalGainLossPercentage = 0;
  loading = true;
  totalQuantity: number = 0;
 
  error = '';
  hoveredSymbol: string = '';
  hoveredTrend: number[] = [];
  hoveredLabels: string[] = [];
  showTrendTooltip = false;
  tooltipPosition = { x: 0, y: 0 };
  chart: any;
  assetAllocationLabels: string[] = [];
  assetAllocationData: number[] = [];
  investmentTypeLabels: string[] = [];
  investmentTypeData: number[] = [];
  isDropdownOpen: boolean = false;
  insightText: string = '';
  trendChart: any;
  newsTooltipVisible = false;
  newsTooltipPosition = { x: 0, y: 0 };
  newsTooltipSymbol = '';
  newsTooltipNews: any[] = [];
  newsTooltipLoading = false;
  newsTooltipError = '';
  newsTooltipDateRangeDays = 7;
  adviceText: string = '';
  adviceLoading: boolean = false;
  adviceError: string | null = null;
 
 
  private insightModal: any;
  finnhubService: any;
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) { }
 
  ngOnInit(): void {
    console.log('User ID:', localStorage.getItem('userId'));
    const user = localStorage.getItem('loggedInUser');
    if (user) {
      const userName = JSON.parse(user).userName;
      this.userInitial = userName ? userName.charAt(0).toUpperCase() : '';
    }
    this.loadInvestments();
    this.insightModal = new bootstrap.Modal(document.getElementById('insightModal'));
 
    setTimeout(() => {
      this.scorecardModal = new bootstrap.Modal(document.getElementById('scorecardModal'));
    }, 500);
 
  }
 
  loadInvestments(): void {
    const userIdFromStorage = localStorage.getItem('userId');
    this.userId = userIdFromStorage ? parseInt(userIdFromStorage, 10) : 0;
    this.http.get<any[]>(AppConfig.api.getInvestments(this.userId)).subscribe({
      next: (data) => {
 
        this.investments = data.filter(
          (inv) => inv.userId === this.userId && inv.transactionType === 'Buy'
        );
 
        this.calculateTotals();
        this.loading = false;
        this.prepareChartData();
        this.updateCurrentPrices();
        this.top3holdings(this.investments);
        this.preparePerformanceData();
 console.log('Investments loaded:', this.investments);
 localStorage.setItem('investments', JSON.stringify(this.investments));
      },
      error: (err) => {
        this.error = 'Failed to load investments';
        this.loading = false;
      },
    });
  }
 
  topHoldings: any[] = [];
  top3holdings(investments: any[]): void {
    const sorted = [...investments]
      .filter(inv => inv.gainLoss != null && inv.transactionType === AppConfig.transactionType.buy)
      .sort((a, b) => (b.gainLoss || 0) - (a.gainLoss || 0));
    this.topHoldings = sorted.slice(0, 3);
 
  }
 
  updateCurrentPrices(): void {
    const updatePromises = this.investments.map((investment) => {
      if (investment.stockName) {
        return this.http
          .get(AppConfig.api.getQuote(investment.stockName))
          .toPromise()
          .then((response: any) => {
 
            investment.currentPrice = response.currentPrice;
 
            const quantity =
              investment.type === AppConfig.transactionType.Stock
                ? investment.numberOfShares
                : investment.type === AppConfig.transactionType.MutualFund
                  ? investment.amount / investment.price
                  : investment.type === AppConfig.transactionType.Bond
                    ? investment.units
                    : 1;
 
            investment.currentValue = investment.currentPrice * quantity;
            investment.gainLoss =
              (investment.currentPrice - investment.purchasePrice) * quantity;
            investment.gainLossPercentage =
              ((investment.currentPrice - investment.purchasePrice) /
                investment.purchasePrice) *
              100;
 
          })
          .catch((error) => {
            console.error(`Error fetching data for ${investment.symbol}`, error);
          });
      } else {
        console.warn('Missing symbol for investment:', investment);
      }
      return Promise.resolve();
    });
 
    Promise.all(updatePromises)
      .then(() => {
        this.calculateTotals();
 
        this.preparePerformanceData();
 
        this.top3holdings(this.investments);
        this.prepareChartData();
        this.loading = false;
      })
      .catch((error) => {
        this.error = 'Failed to update prices. Please try again later.';
        this.top3holdings(this.investments);
        this.loading = false;
      });
  }
 
  calculateTotals(): void {
    this.totalInvestmentCost = 0;
    this.totalInvestmentValue = 0;
    this.totalQuantity = 0;
    this.totalGainLoss = 0;
    this.totalGainLossPercentage = 0;
 
for (const inv of this.investments) {
      // Calculate quantity
      if (inv.type === 'Stock') {
        this.totalQuantity += Number(inv.numberOfShares) || 0;
      } else if (inv.type === 'Bond') {
        this.totalQuantity += 1; // Each bond is counted as 1
      }
    }
   
for (const inv of this.investments) {
      if (inv.type === 'Stock') {
        const cost = inv.purchasePrice * inv.numberOfShares;
        this.totalInvestmentCost += cost;
        const currentPrice = inv.currentPrice || inv.purchasePrice; // Use currentPrice if available
        this.totalInvestmentValue += currentPrice * inv.numberOfShares;
      }
      else if (inv.type === 'Bond') {
        this.totalInvestmentCost += inv.investmentAmount;
        const currentPrice = inv.CurrentPrice || inv.investmentAmount; // Use currentPrice if available
        this.totalInvestmentValue += currentPrice;
      }
    }
    console.log('Total Investment Cost:', this.totalInvestmentCost);
    console.log('Total Investment Value:', this.totalInvestmentValue);  
 
    this.totalGainLoss = this.totalInvestmentValue - this.totalInvestmentCost;
    this.totalGainLossPercentage =
      (this.totalGainLoss / this.totalInvestmentCost) * 100;
  }
 
 
  prepareChartData(): void {
    const assetAllocation: { [key: string]: number } = {};
    const typeAllocation: { [key: string]: number } = {};
 
    for (const inv of this.investments) {
      const assetLabel = inv.Symbol || inv.stockName || inv.fixedIncomeName;
      const type = inv.type;
      const value = this.getCurrentValue(inv);
      // Asset allocation
      assetAllocation[assetLabel] = (assetAllocation[assetLabel] || 0) + value;
 
      // Investment type allocation
      typeAllocation[type] = (typeAllocation[type] || 0) + value;
    }
 
    this.assetAllocationLabels = Object.keys(assetAllocation);
    this.assetAllocationData = Object.values(assetAllocation);
 
    this.investmentTypeLabels = Object.keys(typeAllocation);
    this.investmentTypeData = Object.values(typeAllocation);
    this.updateCharts();
 
  }
 
 
  preparePerformanceData(): void {
    const monthlyData: { [key: string]: number } = {};
    let latestDate: Date | null = null;
 
    for (const inv of this.investments) {
      if (!inv.purchaseDate) continue; // Guard against missing dates
 
      const date = new Date(inv.purchaseDate);
      if (isNaN(date.getTime())) continue; // Guard against invalid dates
 
      // Update latest date
      if (!latestDate || date > latestDate) {
        latestDate = date;
      }
 
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
 
      const gainLoss = this.calculateGainLoss(inv);
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + gainLoss;
    }
 
    // Ensure latest date's month is included even if there was no gain/loss
    if (latestDate) {
      const latestMonthKey = `${latestDate.getFullYear()}-${(latestDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyData.hasOwnProperty(latestMonthKey)) {
        monthlyData[latestMonthKey] = 0;
      }
    }
 
    const sortedMonthKeys = Object.keys(monthlyData).sort();
    const monthlyLabels = sortedMonthKeys.map(m => {
      const [year, month] = m.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return `${date.toLocaleString('default', { month: 'short' })} ${year}`;
    });
 
    const monthlyValues = sortedMonthKeys.map(m => monthlyData[m]);
 
    this.renderPerformanceChart(monthlyLabels, monthlyValues);
  }
 
 
  renderPerformanceChart(labels: string[], data: number[]): void {
    new Chart(AppConfig.charts.PerformanceChart, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Performance Over Time',
          data: data,
          borderColor: AppConfig.charts.performanceLine.borderColor,
          backgroundColor: AppConfig.charts.performanceLine.backgroundColor,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value: string | number) {
                if (typeof value === 'number') {
                  return AppConfig.charts.rupees + value.toFixed(2);
                }
                return value; // fallback for string ticks
              },
            }
 
          }
        }
      }
    });
  }
 
 
 
  calculateGainLoss(inv: any): number {
    switch (inv.type) {
      case AppConfig.transactionType.Stock:
        return (inv.numberOfShares || 1) * (inv.purchasePrice ? inv.purchasePrice * AppConfig.growthFactor.s1 : inv.price ? inv.price * AppConfig.growthFactor.s1 : 0);
      case AppConfig.transactionType.MutualFund:
        if (inv.amountType === AppConfig.transactionType.Rupees) {
          return inv.amount && inv.price
            ? (inv.amount / inv.price) * inv.price * AppConfig.growthFactor.s1
            : inv.price
              ? 1 * inv.price * AppConfig.growthFactor.s1
              : 0;
        } else {
          return inv.amount && inv.price
            ? inv.amount * inv.price * AppConfig.growthFactor.s1
            : inv.price
              ? 1 * inv.price * AppConfig.growthFactor.s1
              : 0;
        }
 
      case AppConfig.transactionType.Bond:
        return inv.price
          ? (inv.units || 1) * inv.price * AppConfig.growthFactor.bond - (inv.units || 1) * inv.price
          : inv.investmentAmount
            ? inv.investmentAmount * AppConfig.growthFactor.bond - inv.investmentAmount
            : 0;
      default:
        return (inv.quantity || 1) * (inv.price ? inv.price * AppConfig.growthFactor.s1 : 0);
    }
  }
 
 
  updateCharts(): void {
    new Chart(AppConfig.charts.asset, {
      type: 'doughnut',
      data: {
        labels: this.assetAllocationLabels,
        datasets: [
          {
            data: this.assetAllocationData,
            backgroundColor: AppConfig.charts.assetAllocationColors,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
 
 
    new Chart(AppConfig.charts.invType, {
      type: 'doughnut',
      data: {
        labels: this.investmentTypeLabels,
        datasets: [
          {
            data: this.investmentTypeData,
            backgroundColor: AppConfig.charts.investmentTypeColors,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  }
 
  getCurrentValue(inv: any): number {
    const price = inv.purchasePrice || inv.price || inv.investmentAmount || 1;
    const units =
      inv.type === AppConfig.transactionType.Stock
        ? inv.numberOfShares || 1
        : inv.type === AppConfig.transactionType.MutualFund && inv.amountType === AppConfig.transactionType.Rupees
          ? inv.amount / price
          : inv.type === AppConfig.transactionType.Bond
            ? inv.units || 1
            : inv.units || inv.amount || 1;
 
    const growthFactor = inv.type === AppConfig.transactionType.Bond ? AppConfig.growthFactor.bond : AppConfig.growthFactor.default;
    return units * price * growthFactor;
  }
 
  refreshPrices(): void {
    this.loadInvestments();
  }
 
  showInsight(): void {
    // Set your dynamic or static insight message here
    this.insightText = `Your total portfolio gain is $${this.totalGainLoss.toFixed(2)} which is ${this.totalGainLossPercentage.toFixed(2)}% of the total investment. Keep an eye on your top holdings for consistent growth.`;
 
    this.insightModal.show();
  }
 
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
 
  getInvestmentInsight(description: string): Observable<string> {
    return this.http.post('/api/insights', description, { responseType: 'text' });
  }
 
  showNewsTooltip(symbol: string, event: MouseEvent) {
    this.newsTooltipVisible = true;
    this.newsTooltipPosition = { x: event.clientX + 10, y: event.clientY + 10 };
    this.newsTooltipSymbol = symbol;
    this.newsTooltipLoading = true;
    this.newsTooltipError = '';
    this.newsTooltipNews = [];
 
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 6);
 
    this.http.get<any[]>(`http://localhost:5154/api/finnhub/news?symbol=${symbol}&from=${from.toISOString().slice(0,10)}&to=${to.toISOString().slice(0,10)}`)
      .pipe(
        catchError(err => {
          this.newsTooltipError = 'Failed to load news.';
          this.newsTooltipLoading = false;
          return of([]);
        })
      )
      .subscribe(news => {
        this.newsTooltipNews = news;
        this.newsTooltipLoading = false;
      });
  }
 
  hideNewsTooltip() {
    this.newsTooltipVisible = false;
  }
 
  updateTooltipPosition = (event: MouseEvent) => {
    this.tooltipPosition = { x: event.clientX + 15, y: event.clientY + 15 };
    const el = document.getElementById('trendTooltip');
    if (el) {
      el.style.left = `${this.tooltipPosition.x}px`;
      el.style.top = `${this.tooltipPosition.y}px`;
    }
  };
 
// Add these properties
portfolioHealth: any = null;
scorecardLoading: boolean = false;
scorecardError: string = '';
private scorecardModal: any;
 
// Add this method to load the scorecard info
loadPortfolioScorecard(): void {
  this.scorecardLoading = true;
  this.scorecardError = '';
  this.http.get<any>(`${AppConfig.api.baseUrl}/PortfolioHealth/user/${this.userId}`)
    .subscribe({
      next: (data) => {
        this.portfolioHealth = data;
        this.scorecardLoading = false;
        this.showScorecardModal();
      },
      error: (err) => {
        this.scorecardError = 'Failed to load portfolio scorecard';
        this.scorecardLoading = false;
      }
    });
}
 
// Add this method to show the modal
showScorecardModal(): void {
  if (!this.scorecardModal) {
    this.scorecardModal = new bootstrap.Modal(document.getElementById('scorecardModal'));
  }
  this.scorecardModal.show();
}
 
scrollToAdvice(): void {
  const adviceSection = document.getElementById('aiInsightSection');
  if (adviceSection) {
    adviceSection.scrollIntoView({ behavior: 'smooth' });
  }
}
openAIInsightModal() {
  const modalElement = document.getElementById('aiInsightModal');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}
 
 
  logout(): void {
    this.authService.clearUser();
    this.router.navigate(['/login']);
  }
}
 
 
 