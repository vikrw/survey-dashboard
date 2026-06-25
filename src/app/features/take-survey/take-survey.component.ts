import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Database, ref, get, push } from '@angular/fire/database';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-take-survey',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './take-survey.component.html',
})
export class TakeSurveyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private db = inject(Database);
  private toastService = inject(ToastService);

  survey = signal<any>(null);
  answers = signal<Record<string, any>>({});
  isSubmitting = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const surveySnap = await get(ref(this.db, `surveys/${id}`));
      if (surveySnap.exists()) {
        this.survey.set(surveySnap.val());
      } else {
        this.toastService.error('Survey not found!');
        this.router.navigate(['/dashboard']);
      }
    }
  }

  toggleCheckbox(questionId: string, option: string, event: any) {
    const checked = event.target.checked;
    const current = this.answers()[questionId] || [];
    if (checked) {
      this.answers.update(a => ({ ...a, [questionId]: [...current, option] }));
    } else {
      this.answers.update(a => ({ ...a, [questionId]: current.filter((o: string) => o !== option) }));
    }
  }

  updateAnswer(questionId: string, value: any) {
    this.answers.update(a => ({ ...a, [questionId]: value }));
  }

  async submit() {
    this.isSubmitting.set(true);
    try {
      const s = this.survey();
      const finalAnswers = (s.questions || []).map((q: any) => {
        let answer = this.answers()[q.id] || '';
        if (Array.isArray(answer)) {
          // just save the first checked option for mock charting simplicity
          answer = answer[0] || '';
        }
        return { questionId: q.id, answer };
      });

      const responsesRef = ref(this.db, 'responses');
      await push(responsesRef, {
        surveyId: s.id,
        submittedAt: new Date().toISOString(),
        answers: finalAnswers
      });
      
      this.toastService.success('Survey submitted successfully!');
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error(err);
      this.toastService.error('Failed to submit survey');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
