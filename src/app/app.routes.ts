import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'builder', pathMatch: 'full' },
  { 
    path: 'login', 
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'signup', 
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
  },
  { 
    path: 'forgot-password', 
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  { 
    path: 'builder', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/survey-builder/survey-builder.component').then(m => m.SurveyBuilderComponent)
  },
  { 
    path: 'dashboard', 
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  { path: '**', redirectTo: 'builder' }
];
