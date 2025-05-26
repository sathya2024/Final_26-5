import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { stockSearchComponent } from '../stock-search/stock-search.component';
import { toDateInputValue } from '../../../utils/date-utils';

@Component({
  selector: 'app-stock-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    stockSearchComponent,
  ],
  templateUrl: './stock-form.component.html',
  styleUrl: './stock-form.component.css',
})
export class stockFormComponent implements OnInit {
  @Input() data: any;
  @Input() isEditMode = false;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  showSellPrompt = false;
  showSellFields = false;
  sellPromptData: any = null;
  form!: FormGroup;
  sellForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      transactionType: [
        this.data?.transactionType || 'Buy',
        Validators.required,
      ],
      stockName: [this.data?.stockName || '', Validators.required],
      dematAccount: [this.data?.dematAccount || '', Validators.required],
      purchaseDate: [toDateInputValue(this.data?.purchaseDate) || '', Validators.required],
      numberOfShares: [this.data?.numberOfShares || '', Validators.required],
      brokerage: [this.data?.brokerage || '', Validators.required],
      brokerageType: [this.data?.brokerageType || '%', Validators.required],
      purchasePrice: [this.data?.purchasePrice || '', Validators.required],
      sellDate: [toDateInputValue(this.data?.sellDate) || ''],
      sellPrice: [this.data?.sellPrice || ''],
    });

    this.form.get('transactionType')?.valueChanges.subscribe((type) => {
      const sellDateControl = this.form.get('sellDate');
      const sellPriceControl = this.form.get('sellPrice');
      if (type === 'Sell') {
        sellDateControl?.setValidators([Validators.required]);
        sellPriceControl?.setValidators([Validators.required]);
      } else {
        sellDateControl?.clearValidators();
        sellPriceControl?.clearValidators();
      }
      sellDateControl?.updateValueAndValidity();
      sellPriceControl?.updateValueAndValidity();
    });

    if (this.form.get('transactionType')?.value === 'Sell') {
      this.form.get('sellDate')?.setValidators([Validators.required]);
      this.form.get('sellPrice')?.setValidators([Validators.required]);
    }

    if (this.isEditMode) {
      this.form.get('stockName')?.disable();
    }

    this.sellForm = this.fb.group({
      sellDate: ['', Validators.required],
      sellPrice: ['', Validators.required],
    });
  }

  onstockSelected(symbol: string) {
    if (!this.isEditMode) {
      this.form.get('stockName')?.setValue(symbol);
    }
  }

  submit() {
    if (this.form.valid) {
      const value = this.form.getRawValue();
      const originalQty = this.data?.numberOfShares ?? 0;
      const newQty = value.numberOfShares;
      if (value.transactionType === 'Buy') {
        value.sellDate = null;
        value.sellPrice = null;
      }
      if (this.isEditMode && newQty < originalQty) {
        this.promptSellOrCorrection(originalQty, newQty, value);
      } else {
        this.save.emit(this.mapToApiFields(value));
      }
    }
  }

  promptSellOrCorrection(originalQty: number, newQty: number, value: any) {
    this.showSellPrompt = true;
    this.sellPromptData = { originalQty, newQty, value };
  }

  handleSellPrompt(choice: 'correction' | 'sell') {
    if (choice === 'correction') {
      this.save.emit(this.mapToApiFields(this.sellPromptData.value));
      this.showSellPrompt = false;
    } else if (choice === 'sell') {
      this.showSellFields = true;
      this.showSellPrompt = false;
      this.sellForm.reset(); 
    }
  }

  confirmSell() {
    if (this.sellForm.valid) {
      const { value, newQty, originalQty } = this.sellPromptData;

      // Updated holding (after partial sell)
      const updatedHolding = {
        ...value,
        numberOfShares: newQty,
      };

      // Sell transaction (all required fields, PascalCase)
      const sellTransaction = {
        StockName: value.stockName,
        DematAccount: value.dematAccount,
        TransactionType: 'Sell',
        NumberOfShares: originalQty - newQty,
        SellDate: this.sellForm.value.sellDate,
        SellPrice: this.sellForm.value.sellPrice,
        Brokerage: value.brokerage,
        BrokerageType: value.brokerageType,
        PurchaseDate: value.purchaseDate,
        PurchasePrice: value.purchasePrice,
        SellId: this.generateGuid(),

      };

      this.save.emit({ type: 'updateHolding', data: this.mapToApiFields(updatedHolding) });
      this.save.emit({ type: 'sellTransaction', data: sellTransaction });

      this.showSellFields = false;
      this.sellForm.reset();
    }
  }

  
 generateGuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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
