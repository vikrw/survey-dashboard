import { Component, inject, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { PieChartComponent } from './components/pie-chart/pie-chart.component';

import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BarChartComponent, PieChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  
  analyticsResource = resource({
    params: () => this.authService.currentUser(),
    loader: async ({ params: user }) => {
      if (!user) return { surveyId: '', activeSurveys: 0, totalResponses: 0, questionStats: [] };
      return firstValueFrom(this.dashboardService.getAnalytics());
    }
  });

  get pieChartData() {
    const stats = this.analyticsResource.value()?.questionStats;
    if (!stats) return null;
    return stats.find((q: any) => q.optionDistribution)?.optionDistribution || null;
  }
}
