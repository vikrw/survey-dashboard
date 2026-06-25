import { Component, input, output, OnInit, OnDestroy, effect } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Question, QuestionType } from '../../survey.store';
import { SurveyValidators } from '../../validators/cross-field.validator';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './question-form.component.html',
  styleUrl: './question-form.component.scss'
})
export class QuestionFormComponent implements OnInit, OnDestroy {
  question = input.required<Question>();
  questionUpdate = output<Question>();
  questionDelete = output<string>();

  form!: FormGroup;
  private formSub!: Subscription;

  constructor(private fb: FormBuilder) {
    // Note: To react to signal changes natively we could use effect, but since we map to a FormGroup 
    // immediately in ngOnInit we can rely on the form valueChanges. If 'question' input can change dynamically from parent:
    effect(() => {
       const q = this.question();
       // Assuming form updates are handled below, effect tracks the input
    });
  }

  ngOnInit() {
    const q = this.question();
    this.form = this.fb.group({
      id: [q.id],
      type: [q.type, Validators.required],
      title: [q.title, Validators.required],
      isRequired: [q.isRequired],
      options: this.fb.array(q.options.map(opt => this.fb.control(opt, Validators.required)))
    }, {
      validators: [
        SurveyValidators.minOptions(2),
        SurveyValidators.uniqueOptions,
        SurveyValidators.titleDiffersFromOptions
      ]
    });

    // React to changes in type to manage options array
    this.form.get('type')?.valueChanges.subscribe((type: QuestionType) => {
      const optionsArr = this.options;
      if (type === 'Text') {
        optionsArr.clear();
      } else if (optionsArr.length === 0) {
        this.addOption('Option 1');
        this.addOption('Option 2');
      }
    });

    // Emit updates to parent
    this.formSub = this.form.valueChanges.subscribe(val => {
      this.questionUpdate.emit(this.form.getRawValue() as Question);
    });
  }

  ngOnDestroy() {
    if (this.formSub) {
      this.formSub.unsubscribe();
    }
  }

  get options() {
    return this.form.get('options') as FormArray;
  }

  addOption(value = '') {
    this.options.push(this.fb.control(value, Validators.required));
  }

  removeOption(index: number) {
    this.options.removeAt(index);
  }

  onDelete() {
    this.questionDelete.emit(this.question().id);
  }
}
