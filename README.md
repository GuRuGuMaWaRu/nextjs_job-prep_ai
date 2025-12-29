## Next.js + AI

Simple shadcn-based UI, multiple pages, live interviews, technical questions practice, resume optimization with AI

TODOs:

- [-] BUG: although I select System theme in the theme switcher, I still see Dark theme selected.
- [-] BUG: when adding a new Job Info the form comes already prefilled with the values from the previously created Job Info.
- [-] Use zod validation for all forms
- [-] Check for existing email in the database before signing up - while user types or as a blur event happens
- [-] Allow changing plans (do I need Stripe for this?)
- [-] Show available counts for all items that have limits. These counts should be displayed on Job Info page on specific nav items that have limits (Interviews, Questions, Resume Analyses)
- [-] Proper DAL according to Next.js documentation, also auth via Proxy
- [-] Go over all my auth flow and update it to session-based authentication as per Next.js documentation and [https://www.youtube.com/watch?v=yoiBv0K6_1U]
- [-] Implement OAuth for authentication (Google, GitHub, etc.)

Completed TODOs:

- [V] Show a dialog with a confirmation before deleting a job info
- [V] BUG: When adding a new job info a user is redirected to that Job Info page, but if he goes back to Job Infos List page he won't see the new job info, only refreshing the page helps.
- [V] Should be able to delete Job Infos. For this I need a delete button (and a confirmation dialog). For the delete button I need to change Job Info card styling. When I hover over Delete Button it should show a tooltip, activate hover state for the whole card and make it's border red. For the Go To Button I need to add a tooltip that says "Go to Job Info" and activate hover state for the whole card.
- [V] Resumes page is not loading properly, I get redirected to Upgrade Plans page, which is not implemented yet. UPDATE: turns out this was a feature, not a bug; user is redirected to Upgrade Plans page only if he has no available resume analyses left.
- [V] On Job Infos page the main button for creating a new job info should be displayed first, before the list of job infos
- [V] Loading spinner for Interviews page is not aligned to the center of the page
- [V] Add DAL layers for all actions
- [V] Try to use data access layer as per WDS? [https://github.com/WebDevSimplified/next-js-data-access-layer/tree/main/src]. May be a good idea, at least worth a try. UPDATE: tried with a somewhat different approach, relied on Cursor to help me out and create a multi-layered architecture.
- [V] Username is missing in Interview actions (generateInterviewFeedback)
- [V] Looks into 404 pages for deeper nested routes
- [V] Implement 404 page for dynamic routes (right now sending random ID for job-info crashes the app)
- [V] Fix main app page loader vertical centering
- [V] Possibly need a file with all routes that we use
- [V] Add 404 page for the main app layer - it will activate when a logged in user tries to access a top-layer page that doesn't exist, i.e. /sdfsadfsdaf
- [V] Right now when we press Easy, Medium or Hard button all of them show a spinner, which is not good UX. We should show a spinner only for the clicked button and just disable the other buttons.
- [V] Show feedback overall rating on Interviews page
- [V] Interviews page should also show if interviews already have feedback generated
- [V] After an interview feedback is generated button name still says Generate Feedback; should be View Feedback
- [V] remove intermediary New Interview page - currently it feels clunky because first you click New Interview and are redirected to a new page with a green button New Interview in the middle. Feels very jarring... The idea is that clicking New Interview on Interviews page will bring a user directly on a page where interview is conducted
- [V] show Plan Limit Reached warning on Upgrades page dynamically, that is only for users who really reached the limit

Optional TODOs:

- [-?] Create a fork of this project with Tanstack Start.
- [-?] Hide some sections on Landing Page for small screens
- [-?] Try out BetterAuth for authentication [https://www.better-auth.com/]
- [-?] Try to use data access layer as per WDS? [https://github.com/WebDevSimplified/next-js-data-access-layer/tree/main/src]. I did some version of this, but it feels bad. Maybe some day I will try it again.
- [-?] May be an interesting idea to have an item called Check Your Fitness For The Job. For this a user will be able to save his professional description (not a CV, but the whole dump of his professional experience, skills, etc.) and then the app will analyze it and give him a score and a list of things he can improve to increase his chances of getting the job.
- [-?] Tweak colors to make the app more visually appealing, maybe also change some rounding etc. Personally I don't like the current Dark theme, want something more bluish.
- [-?] Since we already store all generated questions, we can use them for later reference - user may want to see the correct answer. Yet there's a problem - currently we save only questions, not the answer given by the user and AI feedback. We should store them. UPDATE: all replies/feedback will be saved automatically, then we can show them for a particular JobInfo, but there's also going to ba a page where user can see all questions/replies/feedbacks with ability to filter out by JobInfo, Question, Difficulty, etc and be able to delete them.
- [-?] There's currently no way to set user profile image. We should allow users to upload a profile image.
- [-?] I throw a lot of errors in my layered architecture, which seems confusing to me. I'd like to either return a success or failure object, not throw errors. Then in the layer closest to the UI I can handle the errors by either displaying them to the user or redirecting to an error page.

---

## IDEAS FOR IMPROVEMENTS (generated by Cursor)

### 1. User Experience Enhancements

#### A. Dashboard & Analytics

- **User Progress Dashboard**: Add comprehensive dashboard showing:
  - Interview completion rate over time (chart)
  - Question accuracy by difficulty level
  - Interview performance trends (ratings over time)
  - Time spent on preparation
  - Streak counter to encourage daily practice
- **Goal Setting**: Allow users to set weekly/monthly goals for interviews and questions
- **Achievement System**: Badges for milestones (first interview, 10 questions answered, etc.)

#### B. Search & Filtering

- **Search for job descriptions**: Add search/filter functionality on the main app page
- **Filter interviews by date/rating**: On the interviews list page
- **Tag system for job descriptions**: Allow users to tag jobs by tech stack, company size, etc.

---

### 2. Feature Additions

#### A. Interview Features

- **Interview History with Transcripts**: Store and display full conversation transcripts for each interview
- **Replay Interview Audio**: Allow users to listen back to their interview recordings
- **Common Weakness Detection**: AI analyzes patterns across multiple interviews to identify recurring weak areas
- **Interview Preparation Checklist**: Pre-interview checklist (environment check, tech setup, etc.)
- **Mock Interview Scheduler**: Calendar integration to schedule practice sessions with reminders

#### B. Question Bank Enhancements

- **Answer Tracking**: Save user answers to questions for later review
- **Favorite/Bookmark Questions**: Mark difficult questions to revisit
- **Question Categories**: Organize by topic (algorithms, system design, behavioral, etc.)
- **Timed Practice Mode**: Add countdown timer to simulate real interview pressure
- **Hints System**: Progressive hints for questions users are stuck on

#### C. Resume Features

- **Multiple Resume Versions**: Allow users to store multiple resume versions
- **Resume Comparison**: Compare multiple versions side-by-side
- **ATS Score**: Provide Applicant Tracking System compatibility score
- **Version History**: Track resume changes over time
- **Export Options**: Download optimized resume in different formats (PDF, DOCX)

---

### 3. Collaboration & Social Features

- **Study Groups**: Allow users to form groups and share progress
- **Peer Practice**: Match users for mutual mock interviews
- **Public Interview Recordings**: Option to share (anonymized) interview recordings with community
- **Leaderboard**: Gamification with weekly/monthly top performers
- **Referral Program**: Reward users for inviting friends

---

### 4. Technical Improvements

#### A. Performance

- **Caching Strategy**: Implement more aggressive caching for job descriptions and questions
- **Image Optimization**: Add Next.js Image component where applicable
- **Lazy Loading**: Implement for interview list and question cards
- **Progressive Web App (PWA)**: Add offline capabilities

#### B. Testing & Monitoring

- **Unit Tests**: Add tests for critical business logic
- **E2E Tests**: Playwright/Cypress for key user flows
- **Error Tracking**: Integrate Sentry or similar for production error monitoring
- **Analytics**: Add PostHog or Mixpanel for user behavior tracking
- **Performance Monitoring**: Core Web Vitals tracking

#### C. Accessibility

- **ARIA Labels**: Improve screen reader support
- **Keyboard Navigation**: Ensure all features are keyboard accessible
- **Focus Management**: Better focus indicators and trap in modals
- **WCAG 2.1 AA Compliance**: Full accessibility audit

---

### 5. Security & Data Management

- **Data Export**: GDPR compliance - allow users to export all their data
- **Account Deletion**: Proper data cleanup on account deletion
- **Rate Limiting**: Implement for API routes (already using Arcjet, good!)
- **CSP Headers**: Content Security Policy for XSS protection
- **Input Sanitization**: Ensure all user inputs are sanitized
- **Session Management**: Add "remember me" option and session timeout

---

### 6. AI/ML Enhancements

- **Personalized Question Difficulty**: Adaptive difficulty based on performance
- **Smart Interview Topics**: AI suggests which topics to focus on based on job description
- **Answer Quality Analysis**: Beyond correctness, analyze communication clarity and structure
- **Emotion/Confidence Detection**: Utilize Hume AI's emotion detection for interview feedback
- **Industry-Specific Training**: Specialized question banks for different industries (FAANG, startups, etc.)
- **Company-Specific Prep**: Database of common questions asked by specific companies

---

### 7. Content & Resources

- **Resource Library**: Add articles/videos on interview techniques
- **Company Database**: Information about different companies' interview processes
- **Salary Negotiation Module**: Tips and practice for salary discussions
- **Job Market Insights**: Trending skills, salary ranges by role/location
- **Interview Tips Section**: Best practices, common mistakes to avoid

---

### 8. Mobile Experience

- **Responsive Improvements**: While the UI is responsive, optimize for mobile specifically
- **Mobile App**: Consider React Native/Expo for native mobile apps
- **Push Notifications**: Remind users to practice (web push notifications)
- **Voice Interface**: Better mobile voice recording UI for interviews

---

### 9. Integration & Automation

- **LinkedIn Integration**: Import profile data, export optimized resume
- **Google Calendar Sync**: For scheduled practice sessions
- **Email Notifications**: Daily/weekly progress reports
- **Slack/Discord Bot**: Practice reminders in team channels
- **Chrome Extension**: Quick access to practice questions while browsing
- **Job Board Integration**: Import job descriptions directly from LinkedIn/Indeed

---

### 10. Monetization & Business

- **Team Plans**: For universities, bootcamps, and companies
- **Career Coach Add-on**: Live 1-on-1 sessions with real coaches
- **Sponsored Job Listings**: Companies can post positions
- **White-Label Solution**: For bootcamps and universities
- **Affiliate Program**: For career coaches and influencers
- **Enterprise Analytics**: Aggregate insights for corporate clients

---

### 11. Immediate Quick Wins (Easy to Implement)

1. Show available count on pages (implement the TODO item to show interview/question counts before users hit the limit)
2. Loading States: Add skeleton loaders instead of just spinners where appropriate
3. Empty States: More engaging empty states with illustrations
4. Toast Notifications: Add more user feedback for actions (saved, deleted, etc.)
5. Breadcrumb Navigation: Especially helpful in nested routes
6. Recent Items: "Recently viewed jobs" or "Continue where you left off"
7. Interview Duration Selector: Let users choose interview length (5, 10, 15 minutes)
8. Question Difficulty Badges: Visual difficulty indicators on question cards
9. Shareable Results: Generate shareable links for interview results
10. Dark Mode Improvements: Ensure all new components respect dark mode

---

### 12. UX/UI Polish

- **Onboarding Flow**: Add a multi-step tutorial for first-time users
- **Empty State Illustrations**: Use illustrations instead of plain text
- **Micro-interactions**: Add subtle animations for better feel
- **Better Error Messages**: More helpful error messages with recovery suggestions
- **Confirmation Dialogs**: For destructive actions (delete job, delete interview)
- **Undo Functionality**: For accidental deletions
- **Command Palette**: Keyboard shortcuts (Cmd+K) for power users
- **Better Loading States**: Replace more spinners with skeleton screens

---

### 🎯 Prioritized Roadmap Suggestion

#### Phase 1 (1-2 weeks) - Quick Wins

- Show usage counts on pages
- Better loading states/skeletons
- Interview transcripts storage
- Answer tracking for questions
- Better empty states

#### Phase 2 (1 month) - Core Features

- User dashboard with analytics
- Multiple resume versions
- Question categories and filtering
- Interview history with playback
- Email notifications

#### Phase 3 (2-3 months) - Advanced Features

- Timed practice mode
- Adaptive difficulty
- Resource library
- Mobile app or improved PWA
- Team/collaboration features

#### Phase 4 (3-6 months) - Scale & Business

- LinkedIn integration
- Company database
- Live coaching feature
- Team/enterprise plans
- Comprehensive testing suite
