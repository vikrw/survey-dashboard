import { Injectable, inject, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user, sendPasswordResetEmail } from '@angular/fire/auth';
import { Database, ref, set, get, child } from '@angular/fire/database';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface UserProfile {
  uid: string;
  email: string | null;
  role: 'admin' | 'user';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Database);
  private router = inject(Router);

  // Signal holding the current user state
  currentUser = signal<UserProfile | null>(null);
  
  // Expose the firebase user observable directly as a signal
  user$ = user(this.auth);

  constructor() {
    // Keep signal in sync with firebase auth state
    this.user$.pipe(takeUntilDestroyed()).subscribe(async u => {
      if (u) {
        try {
          const dbRef = ref(this.db);
          const userSnapshot = await get(child(dbRef, `users/${u.uid}`));
          if (userSnapshot.exists()) {
            this.currentUser.set(userSnapshot.val() as UserProfile);
          } else {
            // Fallback for older users without a doc
            const fallbackRole = u.email?.toLowerCase().includes('admin') ? 'admin' : 'user';
            this.currentUser.set({ uid: u.uid, email: u.email, role: fallbackRole });
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          this.currentUser.set({ uid: u.uid, email: u.email, role: 'user' });
        }
      } else {
        this.currentUser.set(null);
      }
    });
  }

  async login(email: string, password: string) {
    try {
      const credentials = await signInWithEmailAndPassword(this.auth, email, password);
      this.router.navigate(['/builder'], { replaceUrl: true });
      return credentials.user;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Password Reset Error:', error);
      throw error;
    }
  }

  async signup(email: string, password: string) {
    try {
      const credentials = await createUserWithEmailAndPassword(this.auth, email, password);
      
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
      // Fire and forget: save to Realtime Database
      set(ref(this.db, `users/${credentials.user.uid}`), {
        uid: credentials.user.uid,
        email: credentials.user.email,
        role: role
      }).catch(err => console.error('Failed to create user doc:', err));

      this.router.navigate(['/builder'], { replaceUrl: true });
      return credentials.user;
    } catch (error) {
      console.error('Signup Error:', error);
      throw error;
    }
  }
}
