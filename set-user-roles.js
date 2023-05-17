// import * as admin from "firebase-admin";
var admin = require("firebase-admin");

// 👉 Set your project ID. Find it in:
// https://console.firebase.google.com/project/_/settings/general
const projectId = "project-gab";
console.log(`Running on ${projectId}`);

// 👉 Import your service account key file.
// Make sure to change this path if necessary.
const serviceAccount = require(`./firebase-service-account.json`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${projectId}.firebaseio.com`,
});
const auth = admin.auth();

const setClaims = async (email, claims) => {
  const user = await auth.getUserByEmail(email);
  auth.setCustomUserClaims(user.uid, claims);
  console.log(user);
};

// 👉 Call the setClaims function. Set the email and roles here.
setClaims('agnieszka.dabrowska@groupone.com.pl', {
  roles: ['MODERATOR'],
});