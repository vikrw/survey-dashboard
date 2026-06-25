import { AbstractControl, ValidationErrors, ValidatorFn, FormArray } from '@angular/forms';

export const SurveyValidators = {
  // Custom cross-field validation: At least 2 options required for Multiple Choice
  minOptions(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const type = control.get('type')?.value;
      const options = control.get('options') as FormArray;
      
      if ((type === 'Multiple Choice' || type === 'Checkbox') && options) {
        if (options.length < min) {
          return { minOptions: { requiredLength: min, actualLength: options.length } };
        }
      }
      return null;
    };
  },

  // No duplicate options allowed
  uniqueOptions: (control: AbstractControl): ValidationErrors | null => {
    const type = control.get('type')?.value;
    const optionsArray = control.get('options') as FormArray;

    if ((type === 'Multiple Choice' || type === 'Checkbox') && optionsArray) {
      const values = optionsArray.controls
        .map(c => c.value?.trim().toLowerCase())
        .filter(val => val !== ''); // Ignore empty fields for duplicate check
        
      const hasDuplicates = values.some((val, idx) => values.indexOf(val) !== idx);
      
      if (hasDuplicates) {
        return { duplicateOptions: true };
      }
    }
    return null;
  },

  // Question title must differ from options
  titleDiffersFromOptions: (control: AbstractControl): ValidationErrors | null => {
    const title = control.get('title')?.value?.trim().toLowerCase();
    const optionsArray = control.get('options') as FormArray;
    
    if (title && optionsArray) {
      const options = optionsArray.controls
        .map(c => c.value?.trim().toLowerCase())
        .filter(val => val !== ''); // Ignore empty fields
        
      if (options.includes(title)) {
        return { titleSameAsOption: true };
      }
    }
    return null;
  }
};
