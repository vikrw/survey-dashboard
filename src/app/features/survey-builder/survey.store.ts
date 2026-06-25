import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, delay, of, catchError, EMPTY } from 'rxjs';
import { Database, ref, push, set } from '@angular/fire/database';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

export type QuestionType = 'Text' | 'Multiple Choice' | 'Checkbox';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options: string[];
  isRequired: boolean;
}

export interface SurveyState {
  title: string;
  questions: Question[];
  isSaving: boolean;
}

const initialState: SurveyState = {
  title: 'Untitled Survey',
  questions: [],
  isSaving: false
};

export const SurveyStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    totalQuestions: computed(() => state.questions().length),
    validQuestions: computed(() => state.questions().filter(q => q.title.trim() !== '').length),
  })),
  withMethods((
    store, 
    toastService = inject(ToastService),
    db = inject(Database),
    router = inject(Router),
    authService = inject(AuthService)
  ) => ({
    updateTitle(title: string) {
      patchState(store, { title });
    },
    addQuestion(question: Question) {
      patchState(store, (state) => ({ questions: [...state.questions, question] }));
    },
    updateQuestion(updatedQuestion: Question) {
      patchState(store, (state) => ({
        questions: state.questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
      }));
    },
    deleteQuestion(id: string) {
      patchState(store, (state) => ({
        questions: state.questions.filter(q => q.id !== id)
      }));
    },
    setSaving(isSaving: boolean) {
      patchState(store, { isSaving });
    },
    saveSurvey: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(async () => {
          try {
            const user = authService.currentUser();
            if (!user) throw new Error('Must be logged in to save survey');

            const surveysRef = ref(db, 'surveys');
            const newSurveyRef = push(surveysRef);
            
            const surveyData = {
              id: newSurveyRef.key as string,
              title: store.title(),
              questions: store.questions(),
              createdBy: user.uid,
              createdAt: new Date().toISOString()
            };
            
            await set(newSurveyRef, surveyData);
            
            // GENERATE MOCK RESPONSES FOR DASHBOARD
            const responsesRef = ref(db, 'responses');
            const numResponses = Math.floor(Math.random() * 6) + 10; // 10-15 responses
            
            const responsePromises = [];
            for(let i=0; i<numResponses; i++) {
              const answers = store.questions().map(q => {
                let answerText = '';
                if (q.type === 'Text') {
                  answerText = 'Sample text answer ' + Math.floor(Math.random() * 100);
                } else if (q.type === 'Multiple Choice' || q.type === 'Checkbox') {
                  const optIdx = Math.floor(Math.random() * q.options.length);
                  answerText = q.options[optIdx];
                }
                return { questionId: q.id, answer: answerText };
              });
              
              responsePromises.push(push(responsesRef, {
                surveyId: surveyData.id,
                submittedAt: new Date().toISOString(),
                answers
              }));
            }
            await Promise.all(responsePromises);
            
            return newSurveyRef.key as string;
          } catch (err) {
            console.error('Error saving survey:', err);
            throw err;
          }
        }),
        tap({
          next: (surveyId) => {
            patchState(store, { isSaving: false });
            toastService.success('Survey saved!');
            router.navigate(['/dashboard']);
          },
          error: (err: any) => {
            patchState(store, { isSaving: false });
            toastService.error(err?.message || 'Failed to save survey.');
          }
        }),
        catchError(() => EMPTY)
      )
    )
  }))
);
