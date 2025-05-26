import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventEmitter, Input, Output } from '@angular/core';
import { stockFormComponent } from '../stock-form/stock-form.component';
import { BondFormComponent } from '../bond-form/bond-form.component';            
import { Investment } from '../../../core/models/investment';

@Component({
  selector: 'app-investment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, stockFormComponent,BondFormComponent],
  templateUrl: './investment-modal.component.html',
  styleUrl: './investment-modal.component.css'
})
export class InvestmentModalComponent {
  @Input() isEditMode = false;
  @Input() data: any = null;
  @Input() selectedType: string = 'stock';
  @Output() closeModal = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  onTypeChange() {
    if (!this.isEditMode) {
      this.data = null; 
    }
  }

  close() {
    this.closeModal.emit();
  }

  onSave(formData: any) {
    // Only emit PascalCase fields, and always include Id if editing
    const payload = {
      ...formData,
      type: this.selectedType,
      Id: this.data?.Id || formData.Id,
    };
    if (this.data?.Id) {
      payload.Id = this.data.Id;
    }
    console.log('Payload being sent to API:', payload); // Debug log
    this.save.emit(payload);
    this.close();
  }
  mapToApiFields(formValue: any): any {
    return {
      Id: formValue.Id || formValue.id,
      UserId: formValue.userId,
      Type: formValue.type || 'stock',
      TransactionType: formValue.transactionType,
      StockName: formValue.stockName,
      DematAccount: formValue.dematAccount,
      PurchaseDate: formValue.purchaseDate,
      NumberOfShares: formValue.numberOfShares,
      Brokerage: formValue.brokerage,
      BrokerageType: formValue.brokerageType,
      PurchasePrice: formValue.purchasePrice,
      SellDate: formValue.sellDate || null,
      SellPrice: formValue.sellPrice || null,
    };
  }
  
}
