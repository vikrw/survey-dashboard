# SurveyPro Dashboard

SurveyPro is a modern, responsive web application for creating surveys and analyzing responses in real-time. It features a premium dark-mode aesthetic with glassmorphic UI elements and dynamic data visualization.

## Setup Instructions

1. **Prerequisites**: Ensure you have Node.js (v26) and npm installed.
2. **Clone and Install**:
   ```bash
   git clone git@github.com:vikrw/survey-dashboard.git
   cd survey-dashboard
   npm install
   ```
3. **Firebase Configuration**: The application uses Firebase for Authentication and Realtime Database. The credentials are pre-configured in `src/environments/environment.ts` for development.
4. **Run the Development Server**:
   ```bash
   npm run start
   ```
   Navigate to `http://localhost:4200/` in your browser. The app will automatically reload if you change any source files.

## Architecture Explanation

The application is built using a modern, scalable technology stack:

- **Frontend Framework**: **Angular 22** utilizing the latest features, including Standalone Components, Signals (`signal`, `computed`, `effect`), and the experimental `resource()` API for reactive asynchronous data fetching.
- **State Management**: Local state (such as managing the dynamic list of questions in the Survey Builder) is handled using a custom Angular Injectable store (`survey.store.ts`) powered by Signals.
- **Styling**: **Tailwind CSS** is used for utility-first styling. The design system heavily leverages CSS variables, backdrop-blurs for glassmorphism, and custom gradient animations to achieve a premium UI.
- **Backend & Database**: **Firebase Realtime Database** is used for storing survey definitions and responses. **Firebase Authentication** handles user sessions (login/signup).
- **Data Visualization**: **D3.js (v7)** is used to render complex SVG charts (Bar Chart and Donut/Pie Chart). D3 is integrated into Angular via `ViewChild` native element references, ensuring D3's DOM manipulations play nicely with Angular's lifecycle.
- **Routing & Security**: Angular Router manages navigation. Route guards (`AuthGuard`, `AdminGuard`, `GuestGuard`) ensure that unauthenticated users cannot access the builder/dashboard, and authenticated users are redirected away from the login page.

## Assumptions Made

During the development of this prototype, the following assumptions were made:

1. **Admin Role Assignment**: For demonstration purposes, any user who signs up with an email address containing the word `"admin"` (e.g., `admin@test.com`) is automatically assigned the `admin` role. Only admins can access the Analytics Dashboard.
2. **Database Indexing (In-Memory Filtering)**: We assume strict `.indexOn` rules are not currently configured in the Firebase Realtime Database. To prevent the dashboard queries from crashing due to missing indexes, the `DashboardService` fetches the lists of surveys and responses and filters them securely in memory on the client side.
3. **Mock Data Generation**: To allow users to immediately view the Analytics Dashboard in action, the application assumes you want sample data. Whenever a new survey is saved in the Builder, the application automatically generates and pushes a batch of random mock responses to Firebase for that survey.
4. **Modern Browser Environment**: The application assumes the user is running a modern web browser that supports CSS grid, `backdrop-filter`, and modern ES modules. Polyfills for older browsers (like IE11) are not included.
5. **Chart Rendering**: We assume the first question containing options (Multiple Choice or Checkbox) is the most relevant for the "Option Distribution" Pie Chart. The dashboard dynamically selects this question to render the pie chart, bypassing any open-ended text questions.
