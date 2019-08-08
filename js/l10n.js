const langs = {};

langs.en = {
  html: {
    utilities: 'Utilities',
    clubs: 'Clubs',
    schedule: 'Schedule',
    staff: 'Staff',
    options: 'Options',
    'pausd-login': 'PAUSD Login Page',
    barcode: 'Barcode',
    'barcode-desc-before-link': 'Click on the eye icon to display; turn up your screen brightness to the max when scanning just in case. Edits are saved automatically. For the curious, student ID cards use Code 39, which you can read about on ',
    wikipedia: 'Wikipedia',
    'barcode-desc-after-link': '.',
    'add-barcode': 'Add barcode',
    minscore: 'Minimum finals score calculator',
    'current-grade': 'Current grade: ',
    'finals-worth': 'Portion of grade the final determines: ',
    'min-grade': 'Minimum acceptable grade: ',
    map: 'Map',
    'for-image': 'For the image:',
    'image-instruct': ' You can use a finger to pan, or two to rotate, zoom, and pan. You can use your mouse to drag, or scroll to zoom or right-click to rotate.',
    'for-gmaps': 'For Google Maps:',
    'gmaps-instruct': " Only works when you're connected to the internet. If you're on touchscreen and can't scroll back up, try scrolling on the buttons.",
    'club-list': 'Club list',
    'clubs-disclaimer-before-link': 'Please note that club information was taken from their ',
    'clubs-disclaimer-link': 'chartered club list as of February 2nd, 2019',
    'clubs-disclaimer-after-link': '. Apparently some of their information turned out to be inaccurate, so blame them, not us.',
    'lists-disabled': "You've disabled the club and staff lists",
    'turn-back-on': 'Turn back on',
    'select-date': 'select date',
    events: 'Events',
    'staff-list': 'Staff list',
    'last-psa': 'Last PSA',
    'before-version': 'You are using the ',
    'after-version': ' version.',
    theme: 'Theme',
    'light-theme': 'Light theme',
    'dark-theme': 'Dark theme',
    'neither-theme': 'Neither theme',
    'time-formatting': 'Time formatting',
    '12h': '12-hour',
    '24h': '24-hour',
    'title-compact': 'Tab title compactness',
    units: 'Units included',
    numbers: 'Numbers only',
    'disable-lists': 'Disable club/staff lists',
    periods: 'Periods',
    'periods-desc': 'Click on the coloured square to change period colour.',
    'show-self': 'Show SELF',
    'hide-self': 'Hide SELF',
    'control-centre': 'Control Centre',
    'control-centre-desc': "If UGWA isn't updating, try these buttons.",
    reload: 'Restart UGWA',
    'trick-cache': 'trick the cache',
    'staff-name': 'Staff name',
    close: 'Close',
    'club-name': 'Club name',
    psa: 'From the Creators',
    ok: 'OK',
    'add-ugwa': 'To add UGWA to your home screen',
    desktop: 'Desktop',
    'desktop-instruct': ' — bookmark this page or pin this tab (right click on the tab and select "Pin tab")',
    chromebook: 'Chromebook',
    'chromebook-instruct': ' — pin this page to the shelf (menu > more tools > add to shelf)',
    ios: 'iOS',
    'ios-instruct': ' — tap on the share icon and select "add to home screen"',
    android: 'Android',
    'android-instruct': ' — tap on the menu and select "add to home screen"',
    bugs: 'Bug reports',
    'before-gh-link': 'You can ',
    'gh-link': 'make a new issue on GitHub',
    'inter-link': ' or email ',
    'sean-email': 'sy24484@pausd.us',
    'after-email': ' to make a feature request or bug report.',
    browsers: 'UGWA only aims to support the latest versions of Chrome and iOS Safari (not MacOS Safari); other versions are low-priority.',
    about: 'About',
    intent: 'The app was originally made to make the features of TheGunnApp available to Chromebook users.',
    'before-source-link': 'UGWA is open sourced on ',
    github: 'GitHub',
    'after-source-link': '.',
    'other-versions': 'Other versions: ',
    'gunn-schedule': 'Gunn Schedule',
    'inter-link-1': ' (no alternate schedules) · ',
    ugwita: 'Ugwita',
    'inter-link-2': ' (ugly) · ',
    ugwa2: 'Ugwa 2',
    'inter-link-3': ' (not done) · ',
    ugwisha: 'Ugwisha',
    'after-links': '',
    lonely: 'UGWA is lonely and needs friends! You should make your own schedule app.',
    'other-apps': 'Gunn apps made by other people: ',
    'tga-ios': 'TheGunnApp',
    'inter-link-4': ' by the iOS App Development club · ',
    'tga-android': 'TheGunnApp',
    'inter-link-5': ' by David C. · ',
    nugwa: 'Not UGWA',
    'after-apps': ' by Tomer S.',
    credits: 'Credits',
    sean: 'Sean',
    'sean-creds': ' made most of the app.',
    henry: 'Henry',
    'henry-creds': ' made the Google Maps overlay.',
    search: 'Google Search',
    'inter-comma': ', ',
    so: 'Stack Overflow',
    'inter-and': ', and ',
    mdn: 'MDN',
    'service-creds': ' helped.',
    'feature-based': 'Many features based on the original Gunn App.',
    'before-material': 'Design based on ',
    material: 'Material Design',
    'after-material': "'s icons, colours, and specifications.",
    languages: 'Languages',
    'this-is-joke': '(This is a joke.)',
    'no-hour': 'No hours',
    'comm': 'Interstudent communication',
    'prev-chats': 'Previous chats',
    'open-chat': 'Join chat',
    'send': 'Send',
    'msg-note': 'Only consonants, numbers, spaces, and a few punctuation marks are allowed. 5 messages per 10 seconds.',
    'want-ugwa-normal': 'To install UGWA like a normal app:',
    'safari-only': '(this can only be done in the Safari app)',
    'b4-share-icon': 'Tap the share button ',
    'b4-add-home': ', select "',
    'add-home': 'Add to Home Screen',
    'b4-add-home-img': '" in the bottom row,',
    'b4-add': 'then tap "',
    add: 'Add',
    'after-add': '."',
    'use-safari': "Open UGWA in Safari first; this can't be done anywhere else.",
    naw: 'Thanks but no thanks',
    heaucques: 'OK.'
  },
  other: {
    'anti-ugwaga': 'Click/tap to continue to the Unofficial Gunn Web App',
    'psa-error': "; couldn't get last PSA; maybe you aren't connected to the internet?",
    'no-study-before-emph': 'You ',
    'no-study-emph': "don't need to study",
    'no-study-after-emph': "; even if you score 0%, you'll be above your threshold.",
    'zero-error': "Please don't enter so many zeroes.",
    'minscore-before-emph': "You'll need to score at least ",
    'minscore-after-emph': ' to keep your parents happy.',
    'minscore-too-high-addendum': " If there's no extra credit, you're screwed.",
    gmaps: 'use google maps',
    image: 'use the image',
    'gmaps-error': "Google Maps not loading! Maybe you aren't connected to the internet?",
    you: 'You',
    'barcode-legacy-default': 'Student #{N}',
    'barcode-default': 'Intellectual student',
    'barcode-student-placeholder': "Whose ID is this?",
    ds: 'S  M  T  W  &Theta;  F  S',
    mos: 'jan  feb  mar  apr  may  jun  jul  aug  sep  oct  nov  dec',
    'no-school': 'No school today!',
    flex: 'Flex',
    brunch: 'Brunch',
    lunch: 'Lunch',
    self: 'SELF',
    periodx: 'Period {X}',
    months: 'January  February  March  April  May  June  July  August  September  October  November  December',
    loading: 'Loading',
    'no-events': 'No events today :(',
    'events-error': "; couldn't get events; maybe you aren't connected to the internet?",
    days: 'Sunday  Monday  Tuesday  Wednesday  Thursday  Friday  Saturday',
    'default-alt-msg': 'good luck with our schedule lol',
    'period-name-label': 'Set label for ',
    'enable-lists': 'Enable club/staff lists',
    'supreme-leader': 'Supreme Leader',
    universe: 'Universe',
    'blamed-teacher': 'Blamed Teacher',
    'staff-error': "; couldn't get staff data; maybe you aren't connected to the internet?",
    title: 'Title:',
    department: 'Department:',
    email: 'Email:',
    phone: 'Phone:',
    website: 'Website:',
    basement: 'Basement:',
    'oc-basement': "OC's Basement",
    'sophomore-club': 'Sophomore Club',
    'soph-desc': 'A club to commemorate the class of 2021, the first class to undergo SELF, with one of the best attendance rates. All grades welcome!',
    'soph-day': 'Thursday',
    'soph-time': 'Flex',
    'soph-room': 'Any room',
    'soph-prez': 'Tara Firenzi',
    'soph-teacher': 'Courtney Carlomagno',
    'soph-email': 'ccarlomagno@pausd.org',
    'club-error': "; couldn't get club data; maybe you aren't connected to the internet?",
    day: 'Meeting day:',
    time: 'Meeting time:',
    location: 'Location:',
    desc: 'Description:',
    presidents: 'President(s):',
    advisors: 'Teacher Advisor(s):',
    'teacher-email': 'Teacher Email:',
    donation: 'Suggested donation:',
    'before-alt-msg': 'This is an alternate schedule. The school says, "',
    'after-alt-msg': '"',
    appname: 'Unofficial Gunn Web App (UGWA)',
    'add-to-list': 'Add to my clubs',
    'remove-from-list': 'Remove from my clubs',
    'lunch-clubs': 'Clubs',
    summer: 'Enjoy your summer!',
    'image-url': 'Image URL',
    cannot: 'There was a problem fetching the image.'
  },
  placeholders: {
    clubs: 'Search clubs',
    staff: 'Search staff',
    'send-msg': 'Send a message'
  },
  times: {
    duration({T: minutes}) {
      if (minutes < 1) return 'less than a minute';
      return (minutes >= 120 ? Math.floor(minutes / 60) + ' hours' : minutes >= 60 ? 'an hour' : '')
        + (minutes % 60 === 0 ? '' : (minutes >= 60 ? ' and ' : '') + (minutes % 60 === 1 ? 'a minute' : (minutes % 60) + ' minutes'));
    },
    date: '{M} {D}',
    ended: '{P} ended {T} ago.',
    ending: '{P} ending in {T}.',
    'ending-short': '{T} left',
    starting: '{P} starting in {T}.',
    'starting-short': '{T} until {P}',
    long: '{T} long',
    'self-ended': 'Ended {T} ago.',
    'self-starting': 'Starting in {T}.',
    'self-ending': 'Ending in {T1}; started {T2} ago.'
  }
};

const availableLangs = {
  'en': 'English',
  'en-gt': 'English (Google Translated through Chinese)',
  // 'es': 'español'
};
if (!availableLangs[cookie.getItem('[gunn-web-app] language')]) {
  let lang = 'en';
  if (navigator.languages) {
    lang = navigator.languages.find(lang => availableLangs[lang]) || lang;
  } else {
    const userLang = navigator.language || navigator.userLanguage;
    if (availableLangs[userLang]) lang = userLang;
  }
  cookie.setItem('[gunn-web-app] language', lang);
}
let currentLang = cookie.getItem('[gunn-web-app] language');
function localize(id, src = 'other') {
  if (!langs[currentLang]) {
    console.warn(`Language ${currentLang} not loaded.`);
    langs[currentLang] = {};
  }
  if (!langs[currentLang][src]) {
    langs[currentLang][src] = {};
  }
  if (langs[currentLang][src][id] !== undefined) return langs[currentLang][src][id];
  if (!langs.en[src]) {
    console.warn(`Source ${src} does not exist.`);
    return id;
  }
  if (langs.en[src][id] === undefined) {
    console.warn(`Nothing set for ${src}/${id}`);
    return id;
  }
  return langs.en[src][id];
}
if (currentLang !== 'en') {
  const script = document.createElement('script');
  script.src = `./js/languages/${currentLang}.js`;
  document.head.appendChild(script);
}
