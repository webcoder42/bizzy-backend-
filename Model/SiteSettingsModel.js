import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema({
  siteTitle: {
    type: String,
    default: "BuzYoo Platform"
  },
  siteDescription: {
    type: String,
    default: "Welcome to BuzYoo!"
  },
  siteLogo: {
    type: String, // store image URL or path
    default: ""
  },
  contactEmail: {
    type: String,
    default: "support@bizy.com" // Admin can update support email
  },
  facebookLink: {
    type: String,
    default: ""
  },
  twitterLink: {
    type: String,
    default: ""
  },
  instagramLink: {
    type: String,
    default: ""
  },
  footerText: {
    type: String,
    default: "© 2024 BiZy. All rights reserved."
  },
  cashoutTax: {
    type: Number,
    default: 0, // Tax percentage for cashout
  },
  postProjectTax: {
    type: Number,
    default: 0, // Tax percentage for posting a project
  },
  addFundTax: {
    type: Number,
    default: 0, // Tax percentage for adding funds
  },
  minimumCashoutAmount: {
    type: Number,
    default: 500, // Minimum amount for cashout
  },
  // You can add more fields here for future dynamic settings
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);
export default SiteSettings; 