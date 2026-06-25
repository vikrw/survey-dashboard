import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { inject } from '@angular/core';
import { Database, ref, get, query, orderByChild, equalTo } from '@angular/fire/database';
import { AuthService } from '../../core/auth/auth.service';

export interface SurveyAnalytics {
  surveyId: string;
  activeSurveys: number;
  totalResponses: number;
  questionStats: {
    questionId: string;
    questionTitle: string;
    responsesCount: number;
    optionDistribution?: { option: string; count: number }[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private db = inject(Database);
  private authService = inject(AuthService);

  getAnalytics(): Observable<SurveyAnalytics> {
    return from(this.fetchData());
  }

  private async fetchData(): Promise<SurveyAnalytics> {
    const user = this.authService.currentUser();
    if (!user) {
      return { surveyId: '', activeSurveys: 0, totalResponses: 0, questionStats: [] };
    }

    try {
      // Fetch all surveys and filter locally to avoid needing Realtime DB indices
      const surveySnap = await get(ref(this.db, 'surveys'));

      if (!surveySnap.exists()) {
        return { surveyId: '', activeSurveys: 0, totalResponses: 0, questionStats: [] };
      }

      const allSurveysObj = surveySnap.val();
      const userSurveys = Object.values(allSurveysObj).filter((s: any) => s.createdBy === user.uid);
      
      if (userSurveys.length === 0) {
        return { surveyId: '', activeSurveys: 0, totalResponses: 0, questionStats: [] };
      }

      // Sort by createdAt or id
      userSurveys.sort((a: any, b: any) => (a.createdAt || a.id).localeCompare(b.createdAt || b.id));
      
      const activeSurveys = userSurveys.length;
      const survey: any = userSurveys[userSurveys.length - 1]; // Get the most recent survey

      const responseSnap = await get(ref(this.db, 'responses'));

      let allResponses: any[] = [];
      if (responseSnap.exists()) {
        const allResObj = responseSnap.val();
        allResponses = Object.values(allResObj).filter((r: any) => r.surveyId === survey.id);
      }
      const totalResponses = allResponses.length;

      const questionsArray = Array.isArray(survey.questions) ? survey.questions : Object.values(survey.questions || {});
      const questionStats = questionsArray.map((q: any) => {
        let optionDistribution: { option: string; count: number }[] | undefined = undefined;

        if (q.type === 'Multiple Choice' || q.type === 'Checkbox') {
          const counts: Record<string, number> = {};
          const optionsArray = Array.isArray(q.options) ? q.options : Object.values(q.options || {});
          optionsArray.forEach((opt: any) => counts[opt] = 0);

          allResponses?.forEach((r: any) => {
            const answersArray = Array.isArray(r.answers) ? r.answers : Object.values(r.answers || {});
            const ans = answersArray.find((a: any) => a.questionId === q.id);
            if (ans && ans.answer) {
              if (counts[ans.answer] !== undefined) {
                counts[ans.answer]++;
              } else {
                counts[ans.answer] = 1;
              }
            }
          });

          optionDistribution = Object.keys(counts).map(k => ({ option: k, count: counts[k] }));
        }

        // Count how many people actually answered this specific question
        const responsesCount = allResponses?.filter((r: any) => {
          const answersArray = Array.isArray(r.answers) ? r.answers : Object.values(r.answers || {});
          const ans = answersArray.find((a: any) => a.questionId === q.id);
          return ans && ans.answer && String(ans.answer).trim() !== '';
        }).length || 0;

        return {
          questionId: q.id,
          questionTitle: q.title || 'Untitled Question',
          responsesCount,
          optionDistribution
        };
      }) || [];

      return { surveyId: survey.id, activeSurveys, totalResponses, questionStats };
    } catch (err) {
      console.error('Error fetching analytics:', err);
      return { surveyId: '', activeSurveys: 0, totalResponses: 0, questionStats: [] };
    }
  }
}
