import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { toDateInputValue } from '../../../utils/date-utils';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  startWith,
} from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-bond-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bond-form.component.html',
  styleUrls: ['./bond-form.component.css']
})
export class BondFormComponent implements OnInit {
  @Input() data: any;
  @Input() isEditMode = false;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
   
  allBondNames: string[] = [];
  filteredNames: string[] = [];
  showDropdown = false;
 

  form!: FormGroup;

 
   
  constructor(private fb: FormBuilder, private http: HttpClient) {
 
    this.form = this.fb.group({
     fixedIncomeName: [''],
  
   });
 }


  ngOnInit() {
    this.form = this.fb.group({
      transactionType: [this.data?.transactionType || 'Buy', Validators.required],
      fixedIncomeName: [this.data?.fixedIncomeName || '', Validators.required],
      investmentDate: [toDateInputValue(this.data?.investmentDate) || '', Validators.required],
      investmentAmount: [this.data?.investmentAmount || '', Validators.required],
      couponRate: [this.data?.couponRate || '', Validators.required],
      compoundingFrequency: [this.data?.compoundingFrequency || 'Yearly', Validators.required],
      interestType: [this.data?.interestType || 'Accrued', Validators.required],
      maturityDate: [toDateInputValue(this.data?.maturityDate) || '', Validators.required],
      sellDate: [toDateInputValue(this.data?.sellDate) || ''],
    sellPrice: [this.data?.sellPrice || ''],
    });
    this.form.get('transactionType')?.valueChanges.subscribe(type => {
      const sellDate = this.form.get('sellDate');
      const sellPrice = this.form.get('sellPrice');
      if (type === 'Sell') {
        sellDate?.setValidators([Validators.required]);
        sellPrice?.setValidators([Validators.required]);
      } else {
        sellDate?.clearValidators();
        sellPrice?.clearValidators();
      }
      sellDate?.updateValueAndValidity();
      sellPrice?.updateValueAndValidity();
    });
  
    // If editing and type is already Sell, set validators
    if (this.form.get('transactionType')?.value === 'Sell') {
      this.form.get('sellDate')?.setValidators([Validators.required]);
      this.form.get('sellPrice')?.setValidators([Validators.required]);
    }
    // Fetch bond names once
    this.http.get<string[]>('http://localhost:5154/api/Bond/names').subscribe(
      (names) => (this.allBondNames = names)
    );
 
    // Filter suggestions when input changes
    this.form.get('fixedIncomeName')!.valueChanges
      .pipe(
        startWith(''),
        debounceTime(200),
        distinctUntilChanged(),
        map((input: string) => {
          if (!input) return [];
          input = input.toLowerCase();
          return this.allBondNames.filter((name) =>
            name.toLowerCase().includes(input)
          );
        })
      )
      .subscribe((filtered) => {
        this.filteredNames = filtered;
        this.showDropdown = filtered.length > 0;
      });
  }
 
  selectName(name: string) {
    this.form.get('fixedIncomeName')!.setValue(name);
    this.showDropdown = false;
  }
 
  hideDropdownLater() {
    // delay so mousedown can happen first
    setTimeout(() => (this.showDropdown = false), 200);
 
  }

 // Mapping function: camelCase -> PascalCase
 private mapToBackendPayload(formValue: any): any {
  return {
    TransactionType: formValue.transactionType,
    FixedIncomeName: formValue.fixedIncomeName,
    InvestmentDate: formValue.investmentDate,
    InvestmentAmount: formValue.investmentAmount,
    CouponRate: formValue.couponRate,
    CompoundingFrequency: formValue.compoundingFrequency,
    InterestType: formValue.interestType,
    MaturityDate: formValue.maturityDate,
    SellDate: formValue.sellDate,
    SellPrice: formValue.sellPrice,
  };
}

submit() {
  if (this.form.valid) {
    const value = this.form.getRawValue();

    // Clean up: convert empty strings to null for sell fields
    if (!value.sellDate) value.sellDate = null;
    if (!value.sellPrice) value.sellPrice = null;

    // Map to backend keys
    const payload = this.mapToBackendPayload(value);
    this.save.emit(payload);
  }
}
onFixedIncomeFocus() {
  const currentValue = this.form.get('fixedIncomeName')!.value;
  if (!currentValue) {
    // Show all bonds when input is empty and focused (clicked)
    this.filteredNames = this.allBondNames;
    this.showDropdown = this.filteredNames.length > 0;
  }
}
}