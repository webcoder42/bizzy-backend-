import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    Fullname: {
      type: String,
      required: true,
    },

    username: {
      type: String,

      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: false, // Not needed for Google auth
    },
    deviceId: {
      type: String,
      unique: true, // Ensure only one user per device
      sparse: true, // Prevent MongoDB error if some records don't have deviceId
    },
    googleId: {
      type: String,
      default: null,
    },
    lastMessage: {
      type: Date,
      default: null,
    },
    profileImage: {
      type: String,
      default: "",
    },
    UserType: {
      type: String,
      enum: ["freelancer", "client"],
      default: "freelancer",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    bio: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    location: {
      country: {
        type: String,
        enum: [
          "Afghanistan",
          "Albania",
          "Algeria",
          "Andorra",
          "Angola",
          "Antigua and Barbuda",
          "Argentina",
          "Armenia",
          "Australia",
          "Austria",
          "Azerbaijan",
          "Bahamas",
          "Bahrain",
          "Bangladesh",
          "Barbados",
          "Belarus",
          "Belgium",
          "Belize",
          "Benin",
          "Bhutan",
          "Bolivia",
          "Bosnia and Herzegovina",
          "Botswana",
          "Brazil",
          "Brunei",
          "Bulgaria",
          "Burkina Faso",
          "Burundi",
          "Cabo Verde",
          "Cambodia",
          "Cameroon",
          "Canada",
          "Central African Republic",
          "Chad",
          "Chile",
          "China",
          "Colombia",
          "Comoros",
          "Congo",
          "Costa Rica",
          "Croatia",
          "Cuba",
          "Cyprus",
          "Czech Republic",
          "Democratic Republic of the Congo",
          "Denmark",
          "Djibouti",
          "Dominica",
          "Dominican Republic",
          "Ecuador",
          "Egypt",
          "El Salvador",
          "Equatorial Guinea",
          "Eritrea",
          "Estonia",
          "Eswatini",
          "Ethiopia",
          "Fiji",
          "Finland",
          "France",
          "Gabon",
          "Gambia",
          "Georgia",
          "Germany",
          "Ghana",
          "Greece",
          "Grenada",
          "Guatemala",
          "Guinea",
          "Guinea-Bissau",
          "Guyana",
          "Haiti",
          "Honduras",
          "Hungary",
          "Iceland",
          "India",
          "Indonesia",
          "Iran",
          "Iraq",
          "Ireland",
          "Israel",
          "Italy",
          "Jamaica",
          "Japan",
          "Jordan",
          "Kazakhstan",
          "Kenya",
          "Kiribati",
          "Korea, North",
          "Korea, South",
          "Kuwait",
          "Kyrgyzstan",
          "Laos",
          "Latvia",
          "Lebanon",
          "Lesotho",
          "Liberia",
          "Libya",
          "Liechtenstein",
          "Lithuania",
          "Luxembourg",
          "Madagascar",
          "Malawi",
          "Malaysia",
          "Maldives",
          "Mali",
          "Malta",
          "Marshall Islands",
          "Mauritania",
          "Mauritius",
          "Mexico",
          "Micronesia",
          "Moldova",
          "Monaco",
          "Mongolia",
          "Montenegro",
          "Morocco",
          "Mozambique",
          "Myanmar",
          "Namibia",
          "Nauru",
          "Nepal",
          "Netherlands",
          "New Zealand",
          "Nicaragua",
          "Niger",
          "Nigeria",
          "North Macedonia",
          "Norway",
          "Oman",
          "Pakistan",
          "Palau",
          "Panama",
          "Papua New Guinea",
          "Paraguay",
          "Peru",
          "Philippines",
          "Poland",
          "Portugal",
          "Qatar",
          "Romania",
          "Russia",
          "Rwanda",
          "Saint Kitts and Nevis",
          "Saint Lucia",
          "Saint Vincent and the Grenadines",
          "Samoa",
          "San Marino",
          "Sao Tome and Principe",
          "Saudi Arabia",
          "Senegal",
          "Serbia",
          "Seychelles",
          "Sierra Leone",
          "Singapore",
          "Slovakia",
          "Slovenia",
          "Solomon Islands",
          "Somalia",
          "South Africa",
          "South Sudan",
          "Spain",
          "Sri Lanka",
          "Sudan",
          "Suriname",
          "Sweden",
          "Switzerland",
          "Syria",
          "Taiwan",
          "Tajikistan",
          "Tanzania",
          "Thailand",
          "Timor-Leste",
          "Togo",
          "Tonga",
          "Trinidad and Tobago",
          "Tunisia",
          "Turkey",
          "Turkmenistan",
          "Tuvalu",
          "Uganda",
          "Ukraine",
          "United Arab Emirates",
          "United Kingdom",
          "United States",
          "Uruguay",
          "Uzbekistan",
          "Vanuatu",
          "Vatican City",
          "Venezuela",
          "Vietnam",
          "Yemen",
          "Zambia",
          "Zimbabwe",
        ],
      },
      city: {
        type: String,
        default: "",
      },
    },

    socialLinks: {
      github: String,
      linkedin: String,
      twitter: String,
      website: String,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    portfolio: [
      {
        title: String,
        description: String,
        link: String,
        image: String,
      },
    ],

    totalEarnings: {
      type: Number,
      default: 0,
    },
    // New field to store add fund logs as an array of objects
    addFundLogs: [
      {
        amount: Number, // Original amount added
        credited: Number, // Actual credited after fee
        date: { type: Date, default: Date.now },
        note: String, // Optional note
      }
    ],
    totalSpend: {
      type: Number,
      default: 0,
    },

    completedProjects: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
    },

    availability: {
      type: String,
      enum: ["online", "offline", "busy", "onVacation"],
      default: "offline",
    },

    phone: {
      number: {
        type: String,
        // Optionally add simple validation for phone number format
        // validate: { validator: v => /^\d{7,15}$/.test(v), message: 'Phone number length is not valid!' },
      },
      countryCode: {
        type: String,
        default: '',
      },
    },

    accountStatus: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },

    referralCode: {
      type: String,
      unique: true,
    },

    referralLink: {
      type: String,
      unique: true,
    },

    referredBy: {
      type: String,
      default: null,
    },

    loginHistory: [
      {
        ip: String,
        device: String,
        date: { type: Date, default: Date.now },
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("users", userSchema);
export default User;
