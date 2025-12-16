## Next.js + AI

Simple shadcn-based UI, multiple pages, live interviews with AI and feedbacks

TODOs:

[-] Possibly need a file with all possible routes so we can reuse those
[-?] Hide some sections on Landing Page for small screens
[-] Also about 404 page: when user tries to access a page that doesn't exist, we should show a 404 page with a link to the home page
[-] Implement 404 page for dynamic routes (right now sending random ID for job-info crashes the app)
[-] Implement 404 page (when user tries to access a page that doesn't exist)
[V] Right now when we press Easy, Medium or Hard button all of them show a spinner, which is not good UX. We should show a spinner only for the clicked button and just disable the other buttons.
[V] Show feedback overall rating on Interviews page
[V] Interviews page should also show if interviews already have feedback generated
[V] After an interview feedback is generated button name still says Generate Feedback; should be View Feedback
[V] remove intermediary New Interview page - currently it feels clunky because first you click New Interview and are redirected to a new page with a green button New Interview in the middle. Feels very jarring... The idea is that clicking New Interview on Interviews page will bring a user directly on a page where interview is conducted
[-?] show available interview count on Interview List page so that user knows he reached the limit even before he clicks New Interview link
[V] show Plan Limit Reached warning on Upgrades page dynamically, that is only for users who really reached the limit
