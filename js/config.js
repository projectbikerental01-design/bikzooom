/* ==========================================================================
   BIKZOOOM - Firebase connection (the only thing that must live in a file)
   --------------------------------------------------------------------------
   The browser needs these values BEFORE it can talk to the database, so they
   cannot be stored inside the database itself. They are not secret: your data
   is protected by the rules in database.rules.json, not by hiding this config.

   !! Check databaseURL: Firebase Console > Realtime Database > the URL shown
      at the top of the Data tab. If it differs from the one below, replace it.

   EmailJS keys are NOT here. They are saved in the Realtime Database at
   /adminConfig/emailjs (admin-only) by admin/setup.html and can be changed in
   Admin > Settings > Email.
   ========================================================================== */

window.BZ_CONFIG = {
  firebase: {
    apiKey: "AIzaSyDDTkT_22hz39W8odeYnRLlUblHAmaMg-Q",
    authDomain: "bikzooom.firebaseapp.com",
    databaseURL: "https://bikzooom-default-rtdb.firebaseio.com",
    projectId: "bikzooom",
    storageBucket: "bikzooom.firebasestorage.app",
    messagingSenderId: "662622113553",
    appId: "1:662622113553:web:68bf210e9b32ce782e06b0"
  },
  emailjs: { publicKey: "", serviceId: "", templateId: "" },

  /* PAYMENTS - paste your Netlify payment server address here (no slash at the end), e.g.
     https://bikzooom-payments.netlify.app
     No Razorpay keys go in this file. They live only on the Netlify server. */
  paymentApi: "https://bikzooom-payment.netlify.app/",
  razorpay: {
    name: "Bikzooom",
    description: "Bike rental booking",
    themeColor: "#0E5A3C"
  }
};
