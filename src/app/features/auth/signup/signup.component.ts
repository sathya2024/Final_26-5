import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
 
import { REGEX, SECURITY_QUESTIONS, PASSWORD_STRENGTH, API_ENDPOINTS, calculatePasswordStrength } from '../../../core/config/ap2.config';
 
@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule, FormsModule],
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  submitted = false;
  showPassword = false;
  passwordStrength: number = 0;
  errorMessage: string = '';
  securityQuestions = SECURITY_QUESTIONS;
  imagePath = 'assets/images/1.jpg';
  logoPath = 'assets/images/logo2.png';
 
  verificationSent = false;
  emailVerified = false;
  isVerifying = false;
 
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}
 
  ngOnInit(): void {
    this.signupForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.pattern(REGEX.name)]],
        UserName: ['', [Validators.required, Validators.pattern(REGEX.name)]],
        email: ['', [Validators.required, Validators.pattern(REGEX.email)]],
        password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(REGEX.password)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6), Validators.pattern(REGEX.password)]],
        securityQuestion: ['', Validators.required],
        securityAnswer: ['', Validators.required],
        verificationCode: [''],
      },
      { validators: this.passwordMatchValidator }
    );
 
    this.signupForm.get('password')?.valueChanges.subscribe(value => {
      this.passwordStrength = calculatePasswordStrength(value);
    });
  }
 
  passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  };
 
  getStrengthClass(): string {
    return PASSWORD_STRENGTH.getStrengthClass(this.passwordStrength);
  }
 
  getStrengthLabel(): string {
    return PASSWORD_STRENGTH.getStrengthLabel(this.passwordStrength);
  }
 
  getStrengthTextClass(): string {
    return PASSWORD_STRENGTH.getStrengthTextClass(this.passwordStrength);
  }
 
  get f() {
    return this.signupForm.controls;
  }
 
  sendVerificationCode() {
    const email = this.signupForm.get('email')?.value;
    if (!this.signupForm.get('email')?.valid) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }
 
    this.http.post('http://localhost:5154/api/emailverification/send', { email }).subscribe({
      next: () => {
        this.verificationSent = true;
        this.errorMessage = '';
        alert(`Verification code sent to ${email}`);
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err);
      }
    });
  }
 
  verifyEmailCode() {
    const email = this.signupForm.get('email')?.value;
    const code = this.signupForm.get('verificationCode')?.value?.trim();
 
    if (!code) {
      this.errorMessage = 'Please enter the verification code.';
      return;
    }
 
    this.isVerifying = true;
 
    this.http.post('http://localhost:5154/api/emailverification/verify', { email, code }).subscribe({
      next: () => {
        this.emailVerified = true;
        this.errorMessage = '';
        this.signupForm.get('verificationCode')?.setErrors(null);
        alert('Email verified successfully!');
      },
      error: (err) => {
        this.errorMessage = this.extractErrorMessage(err);
        this.emailVerified = false;
      },
      complete: () => {
        this.isVerifying = false;
      }
    });
  }
 
  onSubmit() {
    this.submitted = true;
 
    if (this.signupForm.invalid || !this.emailVerified) {
      this.errorMessage = !this.emailVerified
        ? 'Please verify your email before signing up.'
        : 'Please fill in all required fields correctly.';
      return;
    }
 
    // Here you can save user data locally if needed, or call your local storage logic
 
    alert('Registration successful!');
 
    // Reset form state
    this.signupForm.reset();
    this.signupForm.markAsPristine();
    this.signupForm.markAsUntouched();
    this.submitted = false;
    this.passwordStrength = 0;
    this.emailVerified = false;
    this.verificationSent = false;
 
    // Redirect to login page
    this.router.navigate(['/login']);
  }
 
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
 
  private extractErrorMessage(err: any): string {
    if (typeof err === 'string') return err;
    if (err.error?.message && typeof err.error.message === 'string') return err.error.message;
    if (typeof err.error === 'string') return err.error;
    return 'An unexpected error occurred.';
  }
}
 
 