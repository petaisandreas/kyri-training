// GENERATED from clients/kyri/client.json by scripts/sync-default.mjs / scripts/build.mjs. Do not edit by hand.
const deepFreeze = (o) => { Object.values(o).forEach((v) => v && typeof v === "object" && deepFreeze(v)); return Object.freeze(o); };
export default deepFreeze({
  "id": "kyri",
  "appName": "KYRI",
  "coachAppName": "KYRI Coach",
  "businessName": "KYRI Training",
  "coach": {
    "name": "Kyriakos Nicolaou",
    "short": "Kyri",
    "initials": "KN"
  },
  "contact": {
    "email": "kyri@trainwithkyri.com",
    "instagram": "trainwithkyri"
  },
  "locale": {
    "currency": "EUR",
    "numberLocale": "en-IE"
  },
  "storagePrefix": "kyri",
  "paymentRefPrefix": "KYRI",
  "ranking": {
    "prize": "Free 1-on-1 PT session + KYRI t-shirt"
  },
  "seed": {
    "location": "Main Gym"
  },
  "site": {
    "title": "KYRI Training — Personal training & conditioning",
    "description": "Personal training with Kyriakos Nicolaou: strength, conditioning and cardio for fighters and for everyone who wants to get fit. Book your sessions online.",
    "heroLead": "1-on-1 personal training and small-group sessions with Kyriakos Nicolaou. Fighters from every martial art come to him for their conditioning. Everyone else comes for the cardio, strength and fat loss. Same coach, same standard, a plan built around your goal.",
    "coachBio": "Personal trainer specialising in strength and conditioning. Kyri builds the engine: fighters from Muay Thai, boxing, MMA and more train with him to get through every round, and non-fighters train with him to get fitter, stronger and leaner. Every session is planned around your goal."
  },
  "legacy": {
    "renameFrom": "TrainHub",
    "renameTo": "KYRI Training",
    "prizeFrom": "gym t-shirt",
    "prizeTo": "KYRI t-shirt"
  }
});
