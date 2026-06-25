import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { form, FormField, required, email, validateTree } from '@angular/forms/signals';
import { AuthService } from '../../../core/auth/auth.service';

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormField, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  private authService = inject(AuthService);

  // Source of Truth
  signupModel = signal<SignupData>({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Create field tree and validation rules
  signupForm = form(this.signupModel, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Invalid email format' });
    required(path.password, { message: 'Password is required' });
    required(path.confirmPassword, { message: 'Confirmation password is required' });

    // Custom cross-field validation: confirmPassword must match password
    validateTree(path, (context) => {
      const password = context.valueOf(path.password);
      const confirm = context.valueOf(path.confirmPassword);

      if (password !== confirm) {
        return {
          kind: 'mismatch',
          message: 'Passwords do not match',
          field: context.fieldTreeOf(path.confirmPassword)
        };
      }
      return null;
    });
  });

  errorMessage = signal('');
  isLoading = signal(false);

  async onSubmit(event?: Event) {
    if (event) {
      event.preventDefault();
      // Sync autofilled values that the signal might have missed
      const form = event.target as HTMLFormElement;
      const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInputs = form.querySelectorAll('input[type="password"]');
      if (emailInput?.value || passwordInputs.length > 0) {
        this.signupModel.update(m => ({
          ...m,
          email: emailInput?.value || m.email,
          password: (passwordInputs[0] as HTMLInputElement)?.value || m.password,
          confirmPassword: (passwordInputs[1] as HTMLInputElement)?.value || m.confirmPassword
        }));
        await new Promise(r => setTimeout(r, 0)); // Wait a tick for signal forms to re-evaluate validity
      }
    }

    if (this.signupForm().invalid()) {
      this.errorMessage.set('Please fill in all required fields correctly and ensure passwords match.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const credentials = this.signupModel();

    try {
      await this.authService.signup(credentials.email, credentials.password);
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/email-already-in-use') {
        this.errorMessage.set('This email is already registered. Please sign in instead.');
      } else if (code === 'auth/weak-password') {
        this.errorMessage.set('Password is too weak. Use at least 6 characters.');
      } else {
        this.errorMessage.set(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
