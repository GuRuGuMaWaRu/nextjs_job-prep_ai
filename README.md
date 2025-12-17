## Next.js + AI

Simple shadcn-based UI, multiple pages, live interviews, technical questions practice, resume optimization with AI

TODOs:

[-] Possibly need a file with all possible routes so we can reuse those
[-] Implement 404 page for dynamic routes (right now sending random ID for job-info crashes the app)
[-] Looks into 404 pages for deeper nested routes

Completed TODOs:

[V] Add 404 page for the main app layer - it will activate when a logged in user tries to access a top-layer page that doesn't exist, i.e. /sdfsadfsdaf
[V] Right now when we press Easy, Medium or Hard button all of them show a spinner, which is not good UX. We should show a spinner only for the clicked button and just disable the other buttons.
[V] Show feedback overall rating on Interviews page
[V] Interviews page should also show if interviews already have feedback generated
[V] After an interview feedback is generated button name still says Generate Feedback; should be View Feedback
[V] remove intermediary New Interview page - currently it feels clunky because first you click New Interview and are redirected to a new page with a green button New Interview in the middle. Feels very jarring... The idea is that clicking New Interview on Interviews page will bring a user directly on a page where interview is conducted
[V] show Plan Limit Reached warning on Upgrades page dynamically, that is only for users who really reached the limit

Optional TODOs:

[-?] Hide some sections on Landing Page for small screens
[-?] show available interview count on Interview List page so that user knows he reached the limit even before he clicks New Interview link
