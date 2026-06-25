import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { form, FormField, required, email } from '@angular/forms/signals';
import { AuthService } from '../../../core/auth/auth.service';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormField, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);

  // Source of Truth
  loginModel = signal<LoginData>({
    email: '',
    password: ''
  });

  // Create field tree and validation rules
  loginForm = form(this.loginModel, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Invalid email format' });
    required(path.password, { message: 'Password is required' });
  });

  errorMessage = signal('');
  isLoading = signal(false);

  async onSubmit(event?: Event) {
    if (event) {
      event.preventDefault();
      // Sync autofilled values that the signal might have missed
      const form = event.target as HTMLFormElement;
      const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;
      if (emailInput?.value || passwordInput?.value) {
        this.loginModel.update(m => ({
          ...m,
          email: emailInput?.value || m.email,
          password: passwordInput?.value || m.password
        }));
        await new Promise(r => setTimeout(r, 0)); // Wait a tick for signal forms to re-evaluate validity
      }
    }

    if (this.loginForm().invalid()) {
      this.errorMessage.set('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const credentials = this.loginModel();

    try {
      await this.authService.login(credentials.email, credentials.password);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Login failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
