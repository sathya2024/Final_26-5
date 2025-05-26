import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { NgxPaginationModule } from 'ngx-pagination';
// import { NgChartsModule } from 'ng2-charts';
@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule,NgxPaginationModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css'],
})
export class TransactionsComponent implements OnInit {
  transactions: any[] = [];
  recentTransactions: any[] = [];
  filteredTransactions: any[] = [];
  investments: any[] = [];
  userId: number|null = null; // Default value
  totalInvestmentValue = 0;
  totalInvestmentCost = 0;
  totalGainLoss = 0;
  totalGainLossPercentage = 0;
  perDayGainLoss = 10;
  loading = true;
  error = '';
  userInitial: string = '';
 
  // Filter variables
  fromDate: string = '';
  toDate: string = '';
  selectedType: string = 'all';
  searchQuery: string = '';
 
  isSearchFocused: boolean = false;
//  pagination
 
itemsPerPage = 5;
currentPage = 1;
itemsPerPageOptions = [5, 10, 15,20];
 
 
getPageInfo(): string {
  const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
  const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredTransactions.length);
  return `Showing ${startItem}-${endItem} of ${this.filteredTransactions.length}`;
}
 
 onItemsPerPageChange(newSize: number) {
  this.itemsPerPage = newSize;
  this.currentPage   = 1;       // ← reset page
}
 
  constructor(private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}
 
  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('userId'));
    const user = localStorage.getItem('loggedInUser');
    if (user) {
      const userName = JSON.parse(user).userName;
      this.userInitial = userName ? userName.charAt(0).toUpperCase() : '';
    }
    this.loadInvestments();
  }
 
 
 
  loadInvestments(): void {
    this.http.get<any[]>(`http://localhost:5154/api/Investment/user/${this.userId}`).subscribe({
      next: (data) => {
        const userInvestments = data.filter(inv => inv.userId === this.userId);
 
        // Show all transactions (Buy & Sell)
        this.transactions = userInvestments.map((item: any) => ({
          id: item.id,
          name: item.stockName || item.fixedIncomeName || item.schemeName || item.securityName || 'N/A',
          type: item.type,
          transactionType: item.transactionType,
          date: item.purchaseDate || item.investmentDate || 'N/A',
          amount: item.purchasePrice || item.investmentAmount || item.amount || item.price || 'N/A',
          units: item.numberOfShares || item.units || 1,
          symbol: item.stockName || item.fixedIncomeName || item.schemeName || item.securityName || 'N/A',
          purchaseprice: item.purchasePrice || item.investmentAmount || item.amount || item.price || 'N/A',
        }));
 
        this.recentTransactions = [...this.transactions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);
 
        this.filteredTransactions = [...this.transactions];
 
        // Only use 'Buy' transactions for summary card calculations
        this.investments = userInvestments.filter(inv => inv.transactionType === 'Buy');
 
        this.updateCurrentPrices(); // Will recalculate totals after updating prices
      },
      error: (err) => {
        console.error('Error loading investments:', err);
        this.error = 'Failed to load investments';
        this.loading = false;
      },
    });
  }
 
   //  filters to the "All Transactions" table
  //  applyFilters(): void {
 
  //   this.filteredTransactions = this.transactions.filter((txn) => {
  //     const matchesDate =
  //       (!this.fromDate || new Date(txn.date) >= new Date(this.fromDate)) &&
  //       (!this.toDate || new Date(txn.date) <= new Date(this.toDate));
  //     const matchesType =
  //       this.selectedType === 'all' ||  txn.transactionType.toLowerCase() === this.selectedType.toLowerCase();
  //       console.log('Selected Type:', this.selectedType);
  //     const matchesSearch =
  //       !this.searchQuery ||
  //       txn.name.toLowerCase().includes(this.searchQuery.toLowerCase());
  //     return matchesDate && matchesType && matchesSearch;
  //   });
  //   console.log(this.filteredTransactions)
   
  // }
 
 
  applyFilters(): void {
    this.filteredTransactions = this.transactions.filter((txn) => {
      const txnDate = new Date(txn.date);
      txnDate.setHours(0, 0, 0, 0); // Strip time
   
      const from = this.fromDate ? new Date(this.fromDate) : null;
      if (from) from.setHours(0, 0, 0, 0); // Strip time
   
      const to = this.toDate ? new Date(this.toDate) : null;
      if (to) to.setHours(0, 0, 0, 0); // Strip time
   
      const matchesDate =
        (!from || txnDate >= from) &&
        (!to || txnDate <= to);
   
      const matchesType =
        this.selectedType === 'all' ||
        txn.transactionType.toLowerCase() === this.selectedType.toLowerCase();
   
      const matchesSearch =
        !this.searchQuery ||
        txn.name.toLowerCase().includes(this.searchQuery.toLowerCase());
   
      return matchesDate && matchesType && matchesSearch;
    });
  }
  clearFilters(): void {
    this.fromDate = '';
    this.toDate = '';
    this.selectedType = 'all';
    this.searchQuery = '';
    this.filteredTransactions = [...this.transactions];
  }
 
 
  // Calculate totals for investments
  calculateTotals(): void {
    this.totalInvestmentCost = 0;
    this.totalInvestmentValue = 0;
 
    for (const inv of this.investments) {
      if (inv.type === 'Stock') {
        const cost = inv.purchasePrice * inv.numberOfShares;
        this.totalInvestmentCost += cost;
        const currentPrice = inv.currentPrice || inv.purchasePrice; // Use currentPrice if available
        this.totalInvestmentValue += currentPrice * inv.numberOfShares;
      } else if (inv.type === 'MutualFund') {
        const units =
          inv.amountType === 'Rupees' ? inv.amount / inv.price : inv.amount;
        const currentPrice = inv.currentPrice || inv.price; // Use currentPrice if available
        this.totalInvestmentCost += units * inv.price;
        this.totalInvestmentValue += units * currentPrice;
      } else if (inv.type === 'GoldBond') {
        const cost = inv.units * inv.price;
        const currentPrice = inv.currentPrice || inv.price; // Use currentPrice if available
        this.totalInvestmentCost += cost;
        this.totalInvestmentValue += inv.units * currentPrice;
      } else if (inv.type === 'Bond') {
        this.totalInvestmentCost += inv.investmentAmount;
        const currentPrice = inv.currentPrice || inv.investmentAmount; // Use currentPrice if available
        this.totalInvestmentValue += currentPrice;
      }
    }
 
    this.totalGainLoss = this.totalInvestmentValue - this.totalInvestmentCost;
    this.totalGainLossPercentage =
      (this.totalGainLoss / this.totalInvestmentCost) * 100;
  }
  updateCurrentPrices(): void {
    const apiUrl = 'http://localhost:5154/api/finnhub/quote';
 
    const updatePromises = this.investments.map((investment) => {
      if (investment.symbol) {
        return this.http
          .get(`${apiUrl}?symbol=${investment.symbol}`)
          .toPromise()
          .then((response: any) => {
            console.log('API Response:', response); // Debugging line
            investment.currentPrice = response.currentPrice;
 
            // Calculate quantity based on type
            const quantity =
              investment.type === 'Stock'
                ? investment.numberOfShares
                : investment.type === 'MutualFund'
                ? investment.amount / investment.price
                : investment.type === 'GoldBond'
                ? investment.units
                : 1; // Default to 1 for bonds or other types
 
            // Correct calculations
            investment.currentValue = investment.currentPrice * quantity;
            investment.gainLoss =
              (investment.currentPrice - investment.purchasePrice) * quantity;
            investment.gainLossPercentage =
              ((investment.currentPrice - investment.purchasePrice) /
                investment.purchasePrice) *
              100;
              console.log('Current Price:', investment.currentPrice);
              console.log('Quantity:', quantity);
              console.log('Current Value:', investment.currentValue);
          })
          .catch((error) => {
            console.error(`Error fetching data for ${investment.symbol}`, error);
          });
      } else {
        console.warn('Missing symbol for investment:', investment); // Log missing symbol
      }
      return Promise.resolve();
    });
 
    Promise.all(updatePromises)
      .then(() => {
        console.log('Updated Investments:', this.investments); // Debugging line
        this.calculateTotals(); // Recalculate totals after updating prices
        this.loading = false;
      })
      .catch((error) => {
        this.error = 'Failed to update prices. Please try again later.';
        this.loading = false;
      });
  }
exportToExcel(): void {
  // Prepare the data for export
  const exportData = this.filteredTransactions.map((txn) => ({
    Name: txn.name,
    Type: txn.type,
    'Transaction Type': txn.transactionType,
    Date: new Date(txn.date).toLocaleDateString(), // Format the date
    Price: txn.amount,
    'Units/Shares': txn.units,
  }));
 
  // Create a worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
 
  // Create a workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
 
  // Export the workbook to an Excel file
  XLSX.writeFile(workbook, 'Transactions.xlsx');
}
 
 
  // Navigation methods
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
 
  goToHoldings(): void {
    this.router.navigate(['/holdings']);
  }
 
  goToTransactions(): void {
    this.router.navigate(['/transactions']);
  }
  // sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
 
  sortTransactions(column: string): void {
    // If same column clicked, toggle direction
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
 
    this.filteredTransactions = [...this.filteredTransactions].sort((a, b) => {
      let valueA = a[column];
      let valueB = b[column];
 
      // Handle date comparison
      if (column === 'date') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }
 
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
 
  }
 
  selectedQuote: any = null;
  isQuoteLoading = false;
  selectedTxn: any = null;
 
  fetchQuote(symbol: string): void {
    if (!symbol || symbol === 'undefined') {
      console.error('❌ Invalid symbol:', symbol);
      return;
    }
 
    this.isQuoteLoading = true;
 
    this.http.get(`http://localhost:5154/api/finnhub/quote?symbol=${symbol}`).subscribe({
      next: (data) => {
        console.log('✅ Quote data received for', symbol, data);
        this.selectedQuote = data;
        this.isQuoteLoading = false;
      },
      error: (err) => {
        console.error('❌ Failed to fetch quote for symbol:', symbol, err);
        this.isQuoteLoading = false;
      }
    });
  }
 
 
  closeModal(): void {
    this.selectedQuote = null;
    this.selectedTxn = null;
  }
 
  onSymbolClick(txn: any): void {
    console.log('🖱️ Clicked symbol:', txn.symbol, 'Full txn:', txn);
    this.selectedTxn = txn;
    this.fetchQuote(txn.symbol);
  }
 
}
 
 
 