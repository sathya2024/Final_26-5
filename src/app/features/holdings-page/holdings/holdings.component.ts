import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InvestmentModalComponent } from '../investment-modal/investment-modal.component';
import { DeleteConfirmationModalComponent } from '../delete-confirmation-modal/delete-confirmation-modal.component';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { retry } from 'rxjs/operators';
import { NgxPaginationModule } from 'ngx-pagination';
import { BondService } from '../../../core/services/bond.service';
import { toDateInputValue } from '../../../utils/date-utils';
import { AiChatPopupComponent } from '../ai-chat-popup/ai-chat-popup.component';
 
@Component({
  selector: 'app-holdings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ReactiveFormsModule,
    FormsModule,
    InvestmentModalComponent,
    DeleteConfirmationModalComponent,NgxPaginationModule,AiChatPopupComponent
  ],
  templateUrl: './holdings.component.html',
  styleUrls: ['./holdings.component.css'],
})
export class HoldingsComponent implements OnInit {
  investments: any[] = [];
 
  Id = 0;
  totalInvestmentValue = 0;
  totalInvestmentCost = 0;
  totalGainLoss = 0;
  totalGainLossPercentage = 0;
  totalQuantity: number = 0;
  loading = true;
  error = '';
  showInvestmentModal = false;
  editMode = false;
  selectedType = 'stock';
  selectedInvestment = null;
  showDeleteConfirm = false;
  investmentToDelete: any = null;
  userId: number = 0;
  activeTab: 'all' | 'stock' | 'bond' = 'all';
  sortColumn: string = '';
sortDirection: 'asc' | 'desc' = 'asc';
searchText: string = '';
currentPage: number = 1;
itemsPerPage: number = 5;
itemsPerPageOptions: number[] = [5, 10, 15, 20];
showChatPopup = false;
 
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private bondService: BondService
  ) { }
 
  ngOnInit(): void {
    console.log('User ID1:', this.userId);
    this.userId = Number(localStorage.getItem('userId'));
    this.loadInvestments();
  }
 
  loadInvestments(): void {
    this.http
      .get<any[]>(`http://localhost:5154/api/Investment/user/${this.userId}`)
      .subscribe({
        next: (data) => {
          console.log('Fetched investments:', data); // Debugging line
          this.investments = data
            .filter((inv) => inv.transactionType === 'Buy')
            .map((inv) => ({
              ...inv,
              symbol: inv.stockName || inv.schemeName || inv.fixedIncomeName || null, // Map symbol
              currentPrice: null,
              currentValue: null,
              gainLoss: null,
              gainLossPercentage: null,
            }));
          console.log('Mapped Investments:', this.investments);
          this.updateCurrentPrices();
        },
        error: (err) => {
          console.error('Error fetching investments:', err); // Log the error
          this.error = 'Failed to load investments';
          this.loading = false;
        },
      });
  }
 
  getPageInfo(): string {
    const totalItems = this.investments.length;
    const start = totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, totalItems);
    return `Showing ${start} to ${end} of ${totalItems} entries`;
  }
 
  get filteredInvestments(): any[] {
    let filtered = this.activeTab === 'all'
      ? this.investments
      : this.investments.filter(inv =>
          inv.type && inv.type.toLowerCase() === this.activeTab
        );
 
    if (this.searchText && this.searchText.trim() !== '') {
      const search = this.searchText.trim().toLowerCase();
      filtered = filtered.filter(inv =>
        (inv.stockName && inv.stockName.toLowerCase().includes(search)) ||
        (inv.fixedIncomeName && inv.fixedIncomeName.toLowerCase().includes(search)) ||
        (inv.symbol && inv.symbol.toLowerCase().includes(search))
      );
    }
    if (this.sortColumn) {
      filtered = filtered.slice().sort((a, b) => {
        const aValue = this.getSortValue(a, this.sortColumn);
        const bValue = this.getSortValue(b, this.sortColumn);
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return this.sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (aValue instanceof Date && bValue instanceof Date) {
          return this.sortDirection === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }
       
        return this.sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      });
    }
    return filtered;
  }
 
 
 
setTab(tab: 'all' | 'stock' | 'bond') {
  this.activeTab = tab;
}
 
// Add this after your setTab method
setSort(column: string) {
  if (this.sortColumn === column) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
}
 
// Helper to get the value for sorting
getSortValue(inv: any, column: string): any {
  switch (column) {
    case 'Symbol':
      return inv.stockName || inv.fixedIncomeName || '';
    case 'Type':
      return inv.type || '';
    case 'Quantity':
      return inv.type === 'Stock' ? inv.numberOfShares : 0;
    case 'Purchase Price':
      return inv.purchasePrice || inv.price || inv.investmentAmount || 0;
    case 'Purchase Date':
      return new Date(inv.purchaseDate || inv.date || inv.investmentDate || 0);
    case 'Current Price':
      return inv.currentPrice || 0;
    case 'Current Value':
      return inv.currentValue || 0;
    case 'Gain/Loss':
      return inv.gainLoss || 0;
    case 'Gain/Loss %':
      return inv.gainLossPercentage || 0;
    default:
      return inv[column] || '';
  }
}
updateCurrentPrices(): void {
  const stockApiUrl = 'http://localhost:5154/api/finnhub/quote';
 
  // Only process Stock and Bond investments
  const allowedTypes = ['Stock', 'Bond'];
 
  const updatePromises = this.investments
    .filter(inv => allowedTypes.includes(inv.type))
    .map((investment) => {
      if (investment.type === 'Stock' && investment.symbol) {
        // STOCK: Fetch from Finnhub
        return this.http
          .get(`${stockApiUrl}?symbol=${investment.symbol}`)
          .toPromise()
          .then((response: any) => {
            investment.currentPrice = response.currentPrice;
 
            // Quantity for stocks
            const quantity = investment.numberOfShares || 1;
 
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
      } else if (investment.type === 'Bond' && investment.fixedIncomeName) {
        // BOND: Fetch from backend JSON
        return this.bondService.getBondQuote(investment.fixedIncomeName)
          .toPromise()
          .then((response: any) => {
            investment.currentPrice = response.currentPrice;
 
            // For bonds, treat investmentAmount as "units" (face value)
            const units = investment.investmentAmount || 1;
 
            // For bonds, current value is currentPrice (market value of bond)
            investment.currentValue = response.currentPrice;
 
            // Gain/Loss is difference between current price and investment amount
            investment.gainLoss = response.currentPrice - units;
            investment.gainLossPercentage =
              ((response.currentPrice - units) / units) * 100;
          })
          .catch((error) => {
            console.error(`Error fetching bond price for ${investment.fixedIncomeName}`, error);
          });
      }
      return Promise.resolve();
    });
 
  Promise.all(updatePromises)
    .then(() => {
      this.calculateTotals();
      this.loading = false;
    })
    .catch((error) => {
      this.error = 'Failed to update prices. Please try again later.';
      this.loading = false;
    });
}
  calculateTotals(): void {
    this.totalInvestmentCost = 0;
    this.totalInvestmentValue = 0;
    this.totalQuantity = 0;
    this.totalGainLoss = 0;
    this.totalGainLossPercentage = 0;
 
    for (const inv of this.filteredInvestments) {
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
        const currentPrice = inv.currentPrice || inv.investmentAmount; // Use currentPrice if available
        this.totalInvestmentValue += currentPrice;
      }
    }
 
    this.totalGainLoss = this.totalInvestmentValue - this.totalInvestmentCost;
    this.totalGainLossPercentage =
      (this.totalGainLoss / this.totalInvestmentCost) * 100;
  }
 
  refreshPrices(): void {
    this.loadInvestments();
  }
 
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
 
  goToHoldings(): void {
    this.router.navigate(['/holdings']);
  }
 
  goToTransactions(): void {
    this.router.navigate(['/transactions']);
  }
 
  openAddInvestmentModal(type: string = 'bond') {
    this.editMode = false;
    this.selectedType = type;
    this.selectedInvestment = null;
    this.showInvestmentModal = true;
  }
 
  openEditInvestmentModal(inv: any) {
    this.editMode = true;
    this.selectedType = inv.type?.toLowerCase() || inv.Type?.toLowerCase() || 'stock';
 
    // Normalize data for the modal
    this.selectedInvestment = {
      ...inv,
      transactionType: inv.transactionType || inv.TransactionType || 'Buy',
      stockName: inv.stockName || inv.StockName || '',
      schemeName: inv.schemeName || inv.SchemeName || '',
      folioNo: inv.folioNo || inv.FolioNumber || '',
      investmentDate: toDateInputValue(inv.investmentDate || inv.InvestmentDate || ''),
      amountType: inv.amountType || inv.AmountType || '',
      amount: inv.amount || inv.Amount || '',
      price: inv.price || inv.Price || '',
      purchaseDate: toDateInputValue(inv.purchaseDate || inv.PurchaseDate || ''),
      sellDate: toDateInputValue(inv.sellDate || inv.SellDate || ''),
      numberOfShares: inv.numberOfShares || inv.NumberOfShares || '',
      dematAccount: inv.dematAccount || inv.DematAccount || '',
      brokerage: inv.brokerage || inv.Brokerage || '',
      brokerageType: inv.brokerageType || inv.BrokerageType || '',
      Id: inv.Id || inv.id,
    };    
    this.showInvestmentModal = true;
    console.log('Selected Investment for Edit:', this.selectedInvestment); // Debugging line to check data
 
  }
 
  closeInvestmentModal() {
    this.showInvestmentModal = false;
  }
  generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, // Generate a random number from 0 to 15
        v = c === 'x' ? r : (r & 0x3 | 0x8); // Modify the y part to ensure valid GUID version
      return v.toString(16); // Convert the value to hexadecimal
    });
  }
 
  handleInvestmentSave(event: any) {
    const investmentType = event.type || this.selectedType;
 
   
    const payload = {
      ...event,
      UserId: this.userId,
      Type: investmentType,
      Id: this.editMode ? event.Id : this.generateGuid(),
    };
    delete payload.stockName;
    delete payload.dematAccount;
    delete payload.brokerageType;
    if (investmentType.toLowerCase() !== 'bond') {
      delete payload.transactionType;
    }
    delete payload.userId;
    delete payload.type;
    delete payload.id;
 
    // Map investment type to API endpoint
    let endpoint = '';
    switch (investmentType.toLowerCase()) {
      case 'stock':
        endpoint = 'stock';
        break;
      case 'bond':
        endpoint = 'bond';
        break;
      default:
        endpoint = 'stock';
    }
   
 
    if (this.editMode) {
      const transactionType = payload.TransactionType || payload.data?.TransactionType;
      console.log('Transaction Type:', transactionType);
      if (transactionType === 'Buy') {
        console.log('Editing investment, Id:', event.Id, 'Payload:', payload);
        const flatPayload = {
          ...payload,
          ...payload.data,
          Id: event.Id
        };
        delete flatPayload.data;
        console.log('Flat Payload:', flatPayload);
        this.http
          .put(`http://localhost:5154/api/Investment/${endpoint}/${event.Id}`, flatPayload)
          .pipe(retry(3))
          .subscribe({
            next: () => this.loadInvestments(),
            error: (err) => console.error('Error updating investment:', err),
          });
      }
      else if (transactionType === 'Sell') {
        const flatPayload2 = {
          ...payload,
          ...payload.data,
          Id: this.generateGuid(),
        };
        delete flatPayload2.data;
        console.log('Flat Payload2:', flatPayload2);
        this.http
          .post(`http://localhost:5154/api/Investment/${endpoint}`, flatPayload2)
          .pipe(retry(3))
          .subscribe({
            next: () => this.loadInvestments(),
            error: (err) => console.error('Error adding investment:', err),
          });
      }
    } else {
      console.log('Adding new investment, Payload:', payload);
      this.http
        .post(`http://localhost:5154/api/Investment/${endpoint}`, payload)
        .subscribe({
          next: () => this.loadInvestments(),
          error: (err) => console.error('Error adding investment:', err),
        });
    }
    this.closeInvestmentModal();
  }
 
  confirmDelete(inv: any) {
    this.investmentToDelete = inv;
    this.showDeleteConfirm = true;
  }
 
  deleteInvestment() {
    if (!this.investmentToDelete) return;
    const id = this.investmentToDelete.Id || this.investmentToDelete.id;
    this.http.request('delete', `http://localhost:5154/api/Investment/${id}`, {
      body: { Id: id }
    }).subscribe({
 
      next: () => {
        this.loadInvestments();
        this.showDeleteConfirm = false;
        this.investmentToDelete = null;
      },
      error: (err) => {
        this.error = 'Failed to delete investment';
        this.showDeleteConfirm = false;
      },
    });
  }
 
  exportToExcel(): void {
    const allowedTypes = ['Stock', 'Bond'];
    let exportList = this.filteredInvestments;
    if (this.activeTab === 'all') {
      exportList = exportList.filter(inv =>
        allowedTypes.includes(inv.type)
      );
    }
    const exportData = exportList.map((inv) => {
      if (inv.type === 'Stock') {
        const quantity = inv.numberOfShares || 0;
        const purchasePrice = inv.purchasePrice || 0;
        const currentPrice = inv.currentPrice || purchasePrice;
        const currentValue = currentPrice * quantity;
        const gainLoss = (currentPrice - purchasePrice) * quantity;
        const gainLossPercentage =
          purchasePrice && quantity
            ? ((gainLoss / (purchasePrice * quantity)) * 100).toFixed(2)
            : '-';
 
        return {
          Symbol: inv.stockName || inv.symbol || 'N/A',
          Type: inv.type,
          Quantity: quantity,
          'Purchase Price': purchasePrice,
          'Purchase Date': inv.purchaseDate || inv.date || inv.investmentDate || '-',
          'Current Price': currentPrice,
          'Current Value': currentValue,
          'Gain/Loss': gainLoss,
          'Gain/Loss %': gainLossPercentage
        };
      } else if (inv.type === 'Bond') {
        const investmentAmount = inv.investmentAmount || 0;
        const currentPrice = inv.currentPrice || investmentAmount;
        const gainLoss = currentPrice - investmentAmount;
        const gainLossPercentage =
          investmentAmount
            ? ((gainLoss / investmentAmount) * 100).toFixed(2)
            : '-';
 
        return {
          Symbol: inv.fixedIncomeName || inv.symbol || 'N/A',
          Type: inv.type,
          Quantity: 1,
          'Purchase Price': investmentAmount,
          'Purchase Date': inv.purchaseDate || inv.date || inv.investmentDate || '-',
          'Current Price': currentPrice,
          'Current Value': currentPrice,
          'Gain/Loss': gainLoss,
          'Gain/Loss %': gainLossPercentage
        };
      } else {
        return {
          Symbol: inv.stockName || inv.fixedIncomeName || 'N/A',
          Type: inv.type,
          Quantity: '-',
          'Purchase Price': '-',
          'Purchase Date': '-',
          'Current Price': '-',
          'Current Value': '-',
          'Gain/Loss': '-',
          'Gain/Loss %': '-'
        };
      }
    });
 
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Holdings');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Holdings-${this.activeTab}.xlsx`);
  }  
  openChatPopup() {
    this.showChatPopup = true;
  }
  mapStockPayloadToApi(formValue: any): any {
    return {
      Id: formValue.Id || formValue.id,
      UserId: this.userId,
      Type: formValue.type || formValue.Type || 'stock',
      TransactionType: formValue.transactionType || formValue.TransactionType || 'Buy',
      StockName: formValue.stockName || formValue.StockName,
      DematAccount: formValue.dematAccount || formValue.DematAccount,
      PurchaseDate: formValue.purchaseDate || formValue.PurchaseDate,
      NumberOfShares: formValue.numberOfShares || formValue.NumberOfShares,
      Brokerage: formValue.brokerage || formValue.Brokerage,
      BrokerageType: formValue.brokerageType || formValue.BrokerageType,
      PurchasePrice: formValue.purchasePrice || formValue.PurchasePrice,
      SellDate: formValue.sellDate || formValue.SellDate || null,
      SellPrice: formValue.sellPrice || formValue.SellPrice || null,
    };
   
  }
 
}
 
 