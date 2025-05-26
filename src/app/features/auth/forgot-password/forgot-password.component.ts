import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SECURITY_QUESTIONS, API_ENDPOINTS } from '../../../core/config/ap3.config';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule]
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;
  securityQuestions = SECURITY_QUESTIONS;
  logoPath = 'assets/images/logo2.png';
  private router = inject(Router);
 
  constructor(private fb: FormBuilder, private http: HttpClient) {}
 
  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      securityQuestion: ['', Validators.required],
      securityAnswer: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }
 
  goBack(): void {
    this.router.navigate(['/login']);
  }
 
  async onSubmit() {
    const form = this.forgotForm.value;
 
    if (form.newPassword !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
 
    try {
      const verifyUrl = `${API_ENDPOINTS.verifySecurityAnswer}?email=${form.email}&question=${encodeURIComponent(form.securityQuestion)}&answer=${encodeURIComponent(form.securityAnswer)}`;
     
      await this.http.get(verifyUrl, { responseType: 'text' }).toPromise();
 
      await this.updatePassword({
        email: form.email,
        securityQuestion: form.securityQuestion,
        securityAnswer: form.securityAnswer,
        newPassword: form.newPassword
      });
    } catch (error: any) {
      if (error.status === 404) {
        alert('User not found');
      } else if (error.status === 400) {
        alert('Security question or answer is incorrect');
      } else {
        alert('An unexpected error occurred');
        console.error(error);
      }
    }
  }
 
  async updatePassword(requestBody: {
    email: string,
    securityQuestion: string,
    securityAnswer: string,
    newPassword: string
  }) {
    try {
      await this.http.put<string>(
        API_ENDPOINTS.forgotPassword,
        requestBody,
        { responseType: 'text' as 'json' }
      ).toPromise();
 
      this.router.navigate(['/login']);
    } catch (error: any) {
      if (error.status === 404) {
        alert('User not found');
      } else if (error.status === 400) {
        alert('Security question or answer is incorrect');
      } else {
        alert('An unexpected error occurred');
        console.error(error);
      }
    }
  }
}
 
 