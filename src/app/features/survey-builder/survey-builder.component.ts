import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionFormComponent } from './components/question-form/question-form.component';
import { SurveyStore, Question } from './survey.store';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-survey-builder',
  standalone: true,
  imports: [CommonModule, QuestionFormComponent, FormsModule],
  templateUrl: './survey-builder.component.html',
  styleUrl: './survey-builder.component.scss'
})
export class SurveyBuilderComponent {
  store = inject(SurveyStore);
  toastService = inject(ToastService);

  onTitleChange(newTitle: string) {
    this.store.updateTitle(newTitle);
  }

  addQuestion() {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type: 'Text',
      title: '',
      options: [],
      isRequired: false
    };
    this.store.addQuestion(newQuestion);
  }

  onQuestionUpdate(updatedQuestion: Question) {
    this.store.updateQuestion(updatedQuestion);
  }

  onQuestionDelete(id: string) {
    this.store.deleteQuestion(id);
  }

  saveSurvey() {
    if (this.store.questions().length === 0) {
      this.toastService.error('Please add at least one question.');
      return;
    }
    
    if (this.store.validQuestions() !== this.store.totalQuestions()) {
      this.toastService.error('Please ensure all questions have a title and valid options.');
      return;
    }

    this.store.saveSurvey();
  }
}
