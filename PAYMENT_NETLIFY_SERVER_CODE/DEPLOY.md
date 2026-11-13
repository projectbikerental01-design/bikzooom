# Payment server on Netlify (Razorpay TEST mode)

This holds ONLY the payment functions. The website stays on Firebase Hosting.
Drag-and-drop on Netlify does not run functions, so use the CLI or GitHub.

## Get the Firebase service account (free)
Firebase Console > Project settings > Service accounts > Generate new private key.
Open the downloaded JSON and copy ALL of it. Keep that file private (never in this folder or GitHub).

## Deploy with the CLI
```
npm install -g netlify-cli
netlify login
npm install
netlify init             # create and link a new site
netlify env:import .env  # uploads Razorpay test keys, database URL, allowed website addresses
```
In Netlify dashboard > Site configuration > Environment variables, add:
`FIREBASE_SERVICE_ACCOUNT` = (paste the whole JSON)

Then:
```
netlify deploy --prod
```
Your payment server address is the site URL, e.g. https://bikzooom-payments.netlify.app.
Paste it into the website's `js/config.js` at `paymentApi`.

## Allowed website addresses
`ALLOWED_ORIGINS` in `.env` lists the websites allowed to call this server (your Firebase addresses are preset).
If you use a custom domain, add it (comma separated, with https://), then run `netlify env:import .env` again and redeploy.

## Going live
Replace the two Razorpay values with rzp_live_ ones in Netlify's environment variables and redeploy.
