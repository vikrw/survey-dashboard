import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { form, FormField, required, email } from '@angular/forms/signals';
import { AuthService } from '../../../core/auth/auth.service';

interface ForgotPasswordData {
  email: string;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormField, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);

  // Source of Truth
  model = signal<ForgotPasswordData>({ email: '' });

  // Signal Form definition
  resetForm = form(this.model, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Invalid email format' });
  });

  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);

  async onSubmit(event?: Event) {
    if (event) {
      event.preventDefault();
      // Sync autofilled values that the signal might have missed
      const form = event.target as HTMLFormElement;
      const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
      if (emailInput?.value) {
        this.model.update(m => ({ ...m, email: emailInput.value }));
        await new Promise(r => setTimeout(r, 0)); // Wait a tick for signal forms to re-evaluate validity
      }
    }

    if (this.resetForm().invalid()) {
      this.errorMessage.set('Please provide a valid email address.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.authService.sendPasswordReset(this.model().email);
      this.successMessage.set('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/user-not-found') {
        this.errorMessage.set('No user found with this email address.');
      } else {
        this.errorMessage.set(err.message || 'Failed to send password reset email.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
