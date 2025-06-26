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
      enum: [
        "Web Development",
        "Graphic Design",
        "Content Writing",
        "SEO",
        "Digital Marketing",
        "Mobile App Development",
        "UI/UX Design",
        "Data Entry",
        "Video Editing",
        "Translation",
        "Voice Over",
        "Customer Support",
        "Virtual Assistant",
        "Accounting & Finance",
        "Cybersecurity",
        "Game Development",
        "DevOps",
        "3D Modeling",
        "Motion Graphics",
        "Legal Consulting",
      ],
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

        validate: {
          validator: function (v) {
            // Remove country code and validate the length
            const numberOnly = v.replace(/^\+\d+/, "");
            const countryCode = this.countryCode; // Fetch the selected country code

            // Phone length validation based on country code
            const lengthConstraints = {
              "+1": 10, // USA/Canada (10 digits)
              "+7": 10, // Russia/Kazakhstan
              "+20": 10, // Egypt
              "+27": 10, // South Africa
              "+30": 10, // Greece
              "+31": 9, // Netherlands
              "+32": 9, // Belgium
              "+33": 9, // France
              "+34": 9, // Spain
              "+36": 9, // Hungary
              "+39": 10, // Italy
              "+40": 10, // Romania
              "+41": 9, // Switzerland
              "+43": 10, // Austria
              "+44": 10, // UK
              "+45": 8, // Denmark
              "+46": 9, // Sweden
              "+47": 8, // Norway
              "+48": 9, // Poland
              "+49": 10, // Germany
              "+51": 9, // Peru
              "+52": 10, // Mexico
              "+53": 8, // Cuba
              "+54": 10, // Argentina
              "+55": 11, // Brazil
              "+56": 9, // Chile
              "+57": 10, // Colombia
              "+58": 10, // Venezuela
              "+60": 9, // Malaysia
              "+61": 9, // Australia
              "+62": 10, // Indonesia
              "+63": 10, // Philippines
              "+64": 9, // New Zealand
              "+65": 8, // Singapore
              "+66": 9, // Thailand
              "+81": 10, // Japan
              "+82": 10, // South Korea
              "+84": 10, // Vietnam
              "+86": 11, // China
              "+90": 10, // Turkey
              "+91": 10, // India
              "+92": 11, // Pakistan
              "+93": 9, // Afghanistan
              "+94": 9, // Sri Lanka
              "+95": 9, // Myanmar
              "+98": 10, // Iran
              "+212": 9, // Morocco
              "+213": 9, // Algeria
              "+216": 8, // Tunisia
              "+218": 9, // Libya
              "+220": 7, // Gambia
              "+221": 9, // Senegal
              "+222": 8, // Mauritania
              "+223": 8, // Mali
              "+224": 9, // Guinea
              "+225": 8, // Ivory Coast
              "+226": 8, // Burkina Faso
              "+227": 8, // Niger
              "+228": 8, // Togo
              "+229": 8, // Benin
              "+230": 7, // Mauritius
              "+231": 8, // Liberia
              "+232": 8, // Sierra Leone
              "+233": 9, // Ghana
              "+234": 10, // Nigeria
              "+235": 8, // Chad
              "+236": 8, // Central African Republic
              "+237": 9, // Cameroon
              "+238": 7, // Cape Verde
              "+239": 7, // Sao Tome and Principe
              "+240": 9, // Equatorial Guinea
              "+241": 8, // Gabon
              "+242": 9, // Republic of the Congo
              "+243": 9, // DR Congo
              "+244": 9, // Angola
              "+245": 7, // Guinea-Bissau
              "+246": 7, // British Indian Ocean Territory
              "+248": 7, // Seychelles
              "+249": 9, // Sudan
              "+250": 9, // Rwanda
              "+251": 9, // Ethiopia
              "+252": 8, // Somalia
              "+253": 8, // Djibouti
              "+254": 9, // Kenya
              "+255": 9, // Tanzania
              "+256": 9, // Uganda
              "+257": 8, // Burundi
              "+258": 9, // Mozambique
              "+260": 9, // Zambia
              "+261": 9, // Madagascar
              "+262": 9, // Réunion/Mayotte
              "+263": 9, // Zimbabwe
              "+264": 9, // Namibia
              "+265": 9, // Malawi
              "+266": 8, // Lesotho
              "+267": 8, // Botswana
              "+268": 8, // Eswatini
              "+269": 7, // Comoros
              "+290": 4, // Saint Helena/Tristan da Cunha
              "+291": 7, // Eritrea
              "+297": 7, // Aruba
              "+298": 6, // Faroe Islands
              "+299": 6, // Greenland
              "+350": 8, // Gibraltar
              "+351": 9, // Portugal
              "+352": 9, // Luxembourg
              "+353": 9, // Ireland
              "+354": 7, // Iceland
              "+355": 9, // Albania
              "+356": 8, // Malta
              "+357": 8, // Cyprus
              "+358": 9, // Finland
              "+359": 9, // Bulgaria
              "+370": 8, // Lithuania
              "+371": 8, // Latvia
              "+372": 8, // Estonia
              "+373": 8, // Moldova
              "+374": 8, // Armenia
              "+375": 9, // Belarus
              "+376": 6, // Andorra
              "+377": 8, // Monaco
              "+378": 10, // San Marino
              "+379": 10, // Vatican City
              "+380": 9, // Ukraine
              "+381": 9, // Serbia
              "+382": 8, // Montenegro
              "+383": 8, // Kosovo
              "+385": 9, // Croatia
              "+386": 8, // Slovenia
              "+387": 8, // Bosnia and Herzegovina
              "+389": 8, // North Macedonia
              "+420": 9, // Czech Republic
              "+421": 9, // Slovakia
              "+423": 7, // Liechtenstein
              "+500": 5, // Falkland Islands
              "+501": 7, // Belize
              "+502": 8, // Guatemala
              "+503": 8, // El Salvador
              "+504": 8, // Honduras
              "+505": 8, // Nicaragua
              "+506": 8, // Costa Rica
              "+507": 8, // Panama
              "+508": 6, // Saint Pierre and Miquelon
              "+509": 8, // Haiti
              "+590": 9, // Guadeloupe/Saint Martin
              "+591": 8, // Bolivia
              "+592": 7, // Guyana
              "+593": 9, // Ecuador
              "+594": 9, // French Guiana
              "+595": 9, // Paraguay
              "+596": 9, // Martinique
              "+597": 7, // Suriname
              "+598": 8, // Uruguay
              "+599": 7, // Curaçao/Caribbean Netherlands
              "+670": 8, // East Timor
              "+672": 5, // Australian External Territories
              "+673": 7, // Brunei
              "+674": 7, // Nauru
              "+675": 8, // Papua New Guinea
              "+676": 7, // Tonga
              "+677": 7, // Solomon Islands
              "+678": 7, // Vanuatu
              "+679": 7, // Fiji
              "+680": 7, // Palau
              "+681": 6, // Wallis and Futuna
              "+682": 5, // Cook Islands
              "+683": 4, // Niue
              "+685": 6, // Samoa
              "+686": 8, // Kiribati
              "+687": 6, // New Caledonia
              "+688": 5, // Tuvalu
              "+689": 8, // French Polynesia
              "+690": 4, // Tokelau
              "+691": 7, // Micronesia
              "+692": 7, // Marshall Islands
              "+850": 10, // North Korea
              "+852": 8, // Hong Kong
              "+853": 8, // Macau
              "+855": 9, // Cambodia
              "+856": 10, // Laos
              "+880": 10, // Bangladesh
              "+886": 9, // Taiwan
              "+960": 7, // Maldives
              "+961": 8, // Lebanon
              "+962": 9, // Jordan
              "+963": 9, // Syria
              "+964": 10, // Iraq
              "+965": 8, // Kuwait
              "+966": 9, // Saudi Arabia
              "+967": 9, // Yemen
              "+968": 8, // Oman
              "+970": 9, // Palestine
              "+971": 9, // UAE
              "+972": 9, // Israel
              "+973": 8, // Bahrain
              "+974": 8, // Qatar
              "+975": 8, // Bhutan
              "+976": 8, // Mongolia
              "+977": 10, // Nepal
              "+992": 9, // Tajikistan
              "+993": 8, // Turkmenistan
              "+994": 9, // Azerbaijan
              "+995": 9, // Georgia
              "+996": 9, // Kyrgyzstan
              "+998": 9, // Uzbekistan
            };

            const requiredLength = lengthConstraints[countryCode];

            // Ensure the phone number length is valid for the given country code
            return numberOnly.length === requiredLength;
          },
          message: (props) =>
            `Phone number length is not valid for ${this.countryCode}!`,
        },
      },

      countryCode: {
        type: String,

        enum: Object.keys({
          "+1": 10, // USA/Canada (10 digits)
          "+7": 10, // Russia/Kazakhstan
          "+20": 10, // Egypt
          "+27": 10, // South Africa
          "+30": 10, // Greece
          "+31": 9, // Netherlands
          "+32": 9, // Belgium
          "+33": 9, // France
          "+34": 9, // Spain
          "+36": 9, // Hungary
          "+39": 10, // Italy
          "+40": 10, // Romania
          "+41": 9, // Switzerland
          "+43": 10, // Austria
          "+44": 10, // UK
          "+45": 8, // Denmark
          "+46": 9, // Sweden
          "+47": 8, // Norway
          "+48": 9, // Poland
          "+49": 10, // Germany
          "+51": 9, // Peru
          "+52": 10, // Mexico
          "+53": 8, // Cuba
          "+54": 10, // Argentina
          "+55": 11, // Brazil
          "+56": 9, // Chile
          "+57": 10, // Colombia
          "+58": 10, // Venezuela
          "+60": 9, // Malaysia
          "+61": 9, // Australia
          "+62": 10, // Indonesia
          "+63": 10, // Philippines
          "+64": 9, // New Zealand
          "+65": 8, // Singapore
          "+66": 9, // Thailand
          "+81": 10, // Japan
          "+82": 10, // South Korea
          "+84": 10, // Vietnam
          "+86": 11, // China
          "+90": 10, // Turkey
          "+91": 10, // India
          "+92": 11, // Pakistan
          "+93": 9, // Afghanistan
          "+94": 9, // Sri Lanka
          "+95": 9, // Myanmar
          "+98": 10, // Iran
          "+212": 9, // Morocco
          "+213": 9, // Algeria
          "+216": 8, // Tunisia
          "+218": 9, // Libya
          "+220": 7, // Gambia
          "+221": 9, // Senegal
          "+222": 8, // Mauritania
          "+223": 8, // Mali
          "+224": 9, // Guinea
          "+225": 8, // Ivory Coast
          "+226": 8, // Burkina Faso
          "+227": 8, // Niger
          "+228": 8, // Togo
          "+229": 8, // Benin
          "+230": 7, // Mauritius
          "+231": 8, // Liberia
          "+232": 8, // Sierra Leone
          "+233": 9, // Ghana
          "+234": 10, // Nigeria
          "+235": 8, // Chad
          "+236": 8, // Central African Republic
          "+237": 9, // Cameroon
          "+238": 7, // Cape Verde
          "+239": 7, // Sao Tome and Principe
          "+240": 9, // Equatorial Guinea
          "+241": 8, // Gabon
          "+242": 9, // Republic of the Congo
          "+243": 9, // DR Congo
          "+244": 9, // Angola
          "+245": 7, // Guinea-Bissau
          "+246": 7, // British Indian Ocean Territory
          "+248": 7, // Seychelles
          "+249": 9, // Sudan
          "+250": 9, // Rwanda
          "+251": 9, // Ethiopia
          "+252": 8, // Somalia
          "+253": 8, // Djibouti
          "+254": 9, // Kenya
          "+255": 9, // Tanzania
          "+256": 9, // Uganda
          "+257": 8, // Burundi
          "+258": 9, // Mozambique
          "+260": 9, // Zambia
          "+261": 9, // Madagascar
          "+262": 9, // Réunion/Mayotte
          "+263": 9, // Zimbabwe
          "+264": 9, // Namibia
          "+265": 9, // Malawi
          "+266": 8, // Lesotho
          "+267": 8, // Botswana
          "+268": 8, // Eswatini
          "+269": 7, // Comoros
          "+290": 4, // Saint Helena/Tristan da Cunha
          "+291": 7, // Eritrea
          "+297": 7, // Aruba
          "+298": 6, // Faroe Islands
          "+299": 6, // Greenland
          "+350": 8, // Gibraltar
          "+351": 9, // Portugal
          "+352": 9, // Luxembourg
          "+353": 9, // Ireland
          "+354": 7, // Iceland
          "+355": 9, // Albania
          "+356": 8, // Malta
          "+357": 8, // Cyprus
          "+358": 9, // Finland
          "+359": 9, // Bulgaria
          "+370": 8, // Lithuania
          "+371": 8, // Latvia
          "+372": 8, // Estonia
          "+373": 8, // Moldova
          "+374": 8, // Armenia
          "+375": 9, // Belarus
          "+376": 6, // Andorra
          "+377": 8, // Monaco
          "+378": 10, // San Marino
          "+379": 10, // Vatican City
          "+380": 9, // Ukraine
          "+381": 9, // Serbia
          "+382": 8, // Montenegro
          "+383": 8, // Kosovo
          "+385": 9, // Croatia
          "+386": 8, // Slovenia
          "+387": 8, // Bosnia and Herzegovina
          "+389": 8, // North Macedonia
          "+420": 9, // Czech Republic
          "+421": 9, // Slovakia
          "+423": 7, // Liechtenstein
          "+500": 5, // Falkland Islands
          "+501": 7, // Belize
          "+502": 8, // Guatemala
          "+503": 8, // El Salvador
          "+504": 8, // Honduras
          "+505": 8, // Nicaragua
          "+506": 8, // Costa Rica
          "+507": 8, // Panama
          "+508": 6, // Saint Pierre and Miquelon
          "+509": 8, // Haiti
          "+590": 9, // Guadeloupe/Saint Martin
          "+591": 8, // Bolivia
          "+592": 7, // Guyana
          "+593": 9, // Ecuador
          "+594": 9, // French Guiana
          "+595": 9, // Paraguay
          "+596": 9, // Martinique
          "+597": 7, // Suriname
          "+598": 8, // Uruguay
          "+599": 7, // Curaçao/Caribbean Netherlands
          "+670": 8, // East Timor
          "+672": 5, // Australian External Territories
          "+673": 7, // Brunei
          "+674": 7, // Nauru
          "+675": 8, // Papua New Guinea
          "+676": 7, // Tonga
          "+677": 7, // Solomon Islands
          "+678": 7, // Vanuatu
          "+679": 7, // Fiji
          "+680": 7, // Palau
          "+681": 6, // Wallis and Futuna
          "+682": 5, // Cook Islands
          "+683": 4, // Niue
          "+685": 6, // Samoa
          "+686": 8, // Kiribati
          "+687": 6, // New Caledonia
          "+688": 5, // Tuvalu
          "+689": 8, // French Polynesia
          "+690": 4, // Tokelau
          "+691": 7, // Micronesia
          "+692": 7, // Marshall Islands
          "+850": 10, // North Korea
          "+852": 8, // Hong Kong
          "+853": 8, // Macau
          "+855": 9, // Cambodia
          "+856": 10, // Laos
          "+880": 10, // Bangladesh
          "+886": 9, // Taiwan
          "+960": 7, // Maldives
          "+961": 8, // Lebanon
          "+962": 9, // Jordan
          "+963": 9, // Syria
          "+964": 10, // Iraq
          "+965": 8, // Kuwait
          "+966": 9, // Saudi Arabia
          "+967": 9, // Yemen
          "+968": 8, // Oman
          "+970": 9, // Palestine
          "+971": 9, // UAE
          "+972": 9, // Israel
          "+973": 8, // Bahrain
          "+974": 8, // Qatar
          "+975": 8, // Bhutan
          "+976": 8, // Mongolia
          "+977": 10, // Nepal
          "+992": 9, // Tajikistan
          "+993": 8, // Turkmenistan
          "+994": 9, // Azerbaijan
          "+995": 9, // Georgia
          "+996": 9, // Kyrgyzstan
          "+998": 9, // Uzbekistan
        }),
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
