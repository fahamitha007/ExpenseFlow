EXPENSEFLOW / PERSONAL EXPENSE TRACKER

WHAT'S INCLUDED
- Existing multi-page design retained and updated with a dark navy-blue home hero.
- Light and dark theme toggle; your choice is remembered in this browser.
- Dashboard totals: total income, total expenses, balance, plus month-by-month income, expenses and balance.
- Supabase email/password account creation and sign-in.
- Supabase transactions protected by per-user Row Level Security (RLS).
- Guest mode remains available; guest transactions are stored locally in the browser.
- Fixed the home-page status notice so it updates when configuration is detected; it no longer stays on the original Connect Supabase warning.

SET UP SUPABASE (REQUIRED FOR CLOUD SYNC)
1. Create/open your project at https://supabase.com/dashboard.
2. Open Project Settings -> API. Copy the Project URL and the Publishable key (or legacy anon key).
3. Open supabase-config.js in a text editor. Replace YOUR_PROJECT_ID and YOUR_SUPABASE_PUBLISHABLE_KEY with those exact values. Keep the quotation marks.
   Never use a service_role/secret key in this browser project.
4. In Supabase Dashboard, open SQL Editor -> New query. Copy all contents of supabase-schema.sql into the editor and click Run.
5. Open Authentication -> Providers and make sure Email is enabled.
6. For local testing, serve the folder with a local web server (for example VS Code Live Server). Do not rely on opening files with file:// for authentication redirects.
7. Open index.html through the local server, go to Profile / Sign In, create an account, then add income or expenses.
8. If email confirmation is enabled, confirm the email before signing in. You can adjust confirmation settings under Authentication for your development project.

IMPORTANT
- The ZIP includes a config template, not your private project credentials. You must paste your own Supabase URL and Publishable/anon key into supabase-config.js before cloud connection can work.
- Supabase uses RLS policies in supabase-schema.sql so signed-in users can only read/write their own transaction rows.
- Guest records are local to the current browser and are not automatically uploaded to an account.
- Monthly totals are grouped using each transaction's date. Income and expenses appear separately for each month.
- Currency is displayed in Indian rupees (₹).

FILES
- index.html: dark navy home page
- dashboard.html: total and month-wise income/expense summary
- profile.html: create account/sign in/guest mode
- add-income.html and add-expense.html: transaction entry
- all-transactions.html: transaction history and deletion
- style.css: responsive styling and light/dark themes
- script.js: transaction, dashboard, theme, and Supabase logic
- supabase-config.js: paste your project URL and publishable key here
- supabase-schema.sql: table and secure RLS policies to run in Supabase SQL Editor


TRANSACTION DISPLAY / USER ISOLATION FIX
- Supabase transaction reads sort by transaction_date (the actual schema column), not date.
- Authenticated reads and deletes are scoped to the signed-in user's user_id.
- If cloud loading fails for a signed-in user, the app shows an error instead of displaying local guest transactions.
- Guest mode continues to use this browser's localStorage. Guest data is device/browser-local and is not cloud-synced.
- If you created the transactions table manually, ensure supabase-schema.sql policies are applied in Supabase SQL Editor.
