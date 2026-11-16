# S Dental Clinic – Responsive Management System

## Open locally
1. Extract the ZIP file.
2. Open `index.html` in Chrome, Edge, or Firefox.
3. Internet is needed for the optional Supabase CDN and Google Fonts; the demo UI itself runs locally.

## Included interactions
- Sidebar navigation for Dashboard, Patients, Activities, Reports, Schedule, Doctors, Doctor Schedule, and Treatment Checklist.
- Add/edit patient records and search/filter patients.
- Create/edit appointments, filter schedule by date and doctor.
- Print reports using the browser print dialog.
- Set doctor working days/hours, breaks and lunch, and block dates/emergency leave.
- Interactive treatment preparation checklist with local progress saving.
- Demo data is saved in browser localStorage on the device.

## Supabase connection (optional)
This project is a static front-end. To connect Supabase:
1. Open `config.js`.
2. Enter your Supabase **Project URL** and **anon/public key**.
3. Do not paste the `service_role` key into this project.
4. Create database tables and Row Level Security policies before storing real clinic data. The current build includes a client initializer only; CRUD is currently local demo storage and is not yet wired to Supabase tables.

## Publish with GitHub Pages
1. Open repository **Settings → Pages**.
2. Under Build and deployment, choose **Deploy from a branch**.
3. Choose `main` and `/ (root)`, then Save.
4. Wait for GitHub Pages to publish and open the URL shown on that page.

## Important
The sample patient and appointment records are demonstration data. Replace them before real clinic use. Do not use real patient health information until authentication, database access rules, backups, and privacy requirements are properly configured.
