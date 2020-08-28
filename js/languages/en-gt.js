function duration ({ T: minutes }) {
  if (minutes < 1) return 'Do not To One Minute bell'
  return (
    (minutes >= 120
      ? Math.floor(minutes / 60) + ' small Time'
      : minutes >= 60
      ? 'One small Time'
      : '') +
    (minutes % 60 === 0
      ? ''
      : (minutes >= 60 ? ' with ' : '') +
        (minutes % 60 === 1
          ? 'One Minute bell'
          : (minutes % 60) + ' Minute bell'))
  )
}

function dueDate ({ P: periodSpan, D: dateStr }) {
  return (
    'To period day period: ' + (periodSpan ? periodSpan + ' in ' : '') + dateStr
  )
}

window.langs['en-gt'] = {
  html: {
    utilities: 'real use work With',
    clubs: 'meeting So',
    schedule: 'Time while table',
    staff: 'member work',
    options: 'selected Pieces',
    barcode: 'Article code',
    'barcode-desc':
      'point hit eye eye Figure Mark Show Show; To Guard against Million One, will Screen screen bright degree Tune To most Big. Edit Edit will from move Protect Save. Out in it is good odd, learn Give birth certificate Make use generation code 39, you can To in this read read {wikipedia|dimension base hundred Branch}.',
    'add-barcode': 'add plus Article shape code',
    minscore:
      'most low Decide Match to make Achievement meter Calculate Device',
    'current-grade': 'when before of Wait level: {input}',
    'finals-worth':
      'most end Decide set of to make Achievement unit Minute: {input}',
    'min-grade': 'most low can Pick up Receive Wait level: {input}',
    map: 'Ground Figure',
    'image-instruct':
      '{for|Correct in Figure Like}: you can To use hand Means level shift, or use Two root hand Means Spin turn, Shrink put with level shift. you can To Make use mouse Mark Advance Row drag move, or By roll move Advance Row Shrink put, or By single hit mouse Mark right key Advance Row Spin turn.',
    'gmaps-instruct':
      '{for|Correct in Google Ground Figure}: only when you even Pick up To mutual Union network Time only Have effect. Such as fruit you in touch touch Screen on and And no law to on roll move, please taste test roll move press button.',
    'club-list': 'all fun unit name single',
    'clubs-disclaimer':
      'please Note meaning, all fun unit letter interest take from the Lord tube unit door of {link|cut to 2020 year 7 month 4 day of special Xu all fun unit name single}, because this will wrong error Return because in it They.',
    'lists-disabled':
      'you Already ban use all fun unit with member work Column table',
    'turn-back-on': 'weight new hit open',
    'select-date': 'selected select day period',
    'staff-list': 'member work name single',
    version: 'you positive in Make use {version} Version.',
    theme: 'the Lord question',
    'light-theme': 'shallow color the Lord question',
    'dark-theme': 'black dark the Lord question',
    'neither-theme': 'All Do not Yes the Lord question',
    'time-formatting': 'Time while Case formula',
    '12h': '12 small Time',
    '24h': 'twenty four small Time',
    'title-compact': 'Mark sign Mark question of tight Make up Sex',
    units: 'package With single Bit',
    numbers: 'only number word',
    'disable-lists': 'ban use all fun unit/work Make people member name single',
    periods: 'Term while',
    'periods-desc':
      'single hit color color positive square shape To more change Time period Yan color.',
    'control-centre': 'control system in heart',
    'control-centre-desc':
      'Such as fruit UGWA No Have more new, please taste test To under press button.',
    reload: 'weight new start move UGWA',
    'trick-cache': 'bully cheat slow Save',
    'staff-name': 'Position member name',
    close: 'turn off',
    'club-name': 'all fun unit name Weigh',
    ok: 'it is good',
    'add-ugwa': 'want will UGWA add plus To the Lord Screen screen',
    'desktop-instruct':
      '{name|table surface}— for this page surface add plus book sign or will this Mark sign solid set (in Mark sign on single hit mouse Mark right key, Of course Rear selected select " solid set Mark sign ")',
    'chromebook-instruct':
      '{name|Chromebook}— will this page surface solid set To book frame (dish single > more many work With > add plus To book frame)',
    'ios-instruct':
      '{name|of iOS}— point hit Total enjoy Figure Mark, Of course Rear selected select " add plus To the Lord Screen screen "',
    'android-instruct':
      '{name|An Zhuo system Unify}— in dish single on point hit and selected select " add plus To the Lord Screen screen "',
    bugs: 'wrong error Report Inform',
    'report-bugs':
      'you can To {gh|in GitHub on hair cloth new period Journal} or Electricity child mail Pieces {email|sy24484 @ pausd. us} mention Out Work can please begging or wrong error Report Inform.',
    browsers:
      'UGWA only Purpose in support hold most new Version this of Chrome with iOS   Safari (and Do not Yes MacOS   Safari); its he Version this of excellent first level More low.',
    about: 'turn off in',
    intent:
      'The should use most early Yes for to Chromebook use Household mention for TheGunnApp of Work can and Create build of.',
    source: 'UGWA Yes open source of {github|Github}.',
    'other-versions':
      'its he Version this: {gunn-schedule|hill Favor Time while table} (no its he Time between table) · {ugwita|Wu dimension tower} (ugly ugly)   · {ugwa2|autumn season 2} (not Finish to make)   · {ugwisha|Wu grid dimension sand}.',
    lonely:
      'UGWA very solitary alone, need want Friends Friend! you should The system Make from already of day Cheng table should use Cheng sequence.',
    'other-apps':
      'its he people system Make of Gunn should use: {tga-ios|TheGunnApp} by iOS   App   Development   club · {tga-android|TheGunnApp} Big guard · C · {nugwa|Do not Yes UGWA} Reason Tomer   S.',
    credits: 'learn Minute',
    'sean-creds':
      '{name|Shaw Yep} do Up Big unit Minute of should use Cheng sequence.',
    'henry-creds':
      '{name|Heng Profit} system Make Up Google Ground Figure Stack plus Floor.',
    'service-creds':
      '{search|Valley song Search So}. {so|heap Stack overflow Out} with {mdn|MDN} help help Up.',
    'feature-based':
      'base in original beginning Gunn should use Cheng sequence of Xu many Work can.',
    material:
      'Assume meter according to according to {link|Material Fee Setting Total}of Figure Mark, Yan color with regulation grid.',
    languages: 'language Speak can force',
    'this-is-joke': '(This Yes A play laugh.)',
    'no-hour': 'No Have Time between',
    comm: 'learn Give birth between cross flow',
    'prev-chats': 'To before of chat day',
    'open-chat': 'plus Enter chat day',
    send: 'hair give away',
    'msg-note':
      'only allow Xu auxiliary sound, number word, air grid with One some Mark point symbol number. each 10 second 5 Article Eliminate interest.',
    'want-ugwa-normal':
      'Like general through should use One kind An Install UGWA:',
    'safari-only': '(This only can in Safari should use in Finish to make)',
    'add-home':
      'point press Minute enjoy press button {share-icon},   selected select   "{add-home|add plus To the Lord Screen screen}in bottom Row{add-home-img}Of course Rear point hit "{add|plus}”.',
    'use-safari':
      'first first in Safari in hit open UGWA; This no law in its he Ren what Ground square Finish to make.',
    naw: 'thank thank, but Yes Do not, thank thank',
    heaucques: 'it is good.',
    assignments: 'Make industry',
    'asgn-display': 'which is will Finish to make of Ren Service Position Bit',
    'asgn-before': 'Time between table Of before',
    'asgn-after': 'Time between table Of Rear',
    'asgn-none': 'new West Orchid',
    'asgn-sort': 'row sequence square formula',
    'asgn-chrono-primero': 'cut only day period',
    'asgn-important-importance': 'press excellent first Shun sequence',
    'asgn-algorithms':
      'through Pass Make use A   L   G   O   R   I   T   H   M   S',
    'edit-asgn': 'Minute Match Belong to Sex',
    'asgn-buttons':
      '{delete|delete except}{cancel|take Eliminate}{save|Protect Save}',
    'asgn-period-date': 'To period day {period} on {date}.',
    category: 'class do not: {category}',
    importance: 'Yu Destination: {low|low}  {medium|in}  {high|high}',
    transfer: 'Span Assume Prepare Assume Set pass lose',
    'export-copy': 'complex system guide Out generation code',
    'export-file': 'under Load guide Out generation code',
    'import-file': 'or on pass Text Pieces: {file}  {import|Advance mouth}',
    assync: 'Minute Match with step system Unify (different step)',
    'assync-desc':
      'Assync allow Xu you Span Assume Prepare with step Minute Match. This Yes One item real Test Work can.',
    'not-using-assync':
      '{create|Create build different step account Household} want What {id}  {join|with step To account Household}',
    'using-assync':
      'you of Assync account Household ID: {id}  {leave|stop only with step}',
    'loading-assync': 'Load Enter in...',
    errors: 'Luck Row Time wrong error day Zhi',
    'edit-h': 'Assume Set H Time segment',
    'h-editor': 'H Time segment Assume set',
    'toggle-pd-add-asgn':
      'in Time segment card on Show Show " add plus Ren Service " press button?',
    support: 'learn Give birth Capital source',
    sponsor: 'by ROCK group team awesome help.',
    'show-self-toggle': 'Show Show SELF?',
    show0: 'Show Show zero period?',
    s1a: 'Danger machine Text this Row',
    s1b: '741 - 741',
    s1c:
      'Correct in trap Enter Danger machine of each A people; Text word " help help " Text this "   LGBTQ ", use in LGBTQQ special set of support hold',
    s2a: 'Foresee Guard against from kill heat line',
    s2b: '800 - 273 - 8256',
    s2c:
      'Foresee Guard against with Danger machine Capital source (country Family)',
    s3a: 'from kill versus Danger machine heat line',
    s3b: '855 - 278 - 4204',
    s3c:
      'Correct in Place in Danger machine in of A people (Saint Gram Pull Pull county)',
    s4a: 'star view',
    s4b: '650 - 579 - 0350',
    s4c: 'Danger machine dry Foresee (Saint horse Diao county)',
    s5a: 'Long From',
    s5b: '408 - 379 - 9085',
    s5c: 'shift move Danger machine dry Foresee with An all meter Draw',
    s6a: 'special mine Fu Give birth Life line',
    s6b: '866 - 488 - 7386',
    s6c:
      'LGBTQ Danger machine dry Foresee with from kill Foresee Guard against',
    'staff-disclaimer':
      'please Note meaning, member work letter interest take from the Lord tube unit door of {link|cut to 2020 year 7 month 4 day of member work Item record}, because this will wrong error Return because in it They.',
    announcements: 'public Inform Inside Content',
    loading: 'Load Enter in...',
    new: 'new',
    'hide-preps':
      'hidden Tibetan Time between table in name Weigh in band Have "   prep " of period between Is it?',
    'martin-ad':
      '{ad|lead people Note Item of real use Cheng sequence} horse Ding of GPA meter Calculate network station',
    'coronavirus-heading': 'learn school stop class Up!',
    'coronavirus-subtitle':
      'Do not want phase letter UGWA in whole A learn year in So Say of words.',
    'coronavirus-pausd':
      'PAUSD turn off in crown shape disease poison of more new',
    'kevin-creds': '{name|Kai Text} law language turn Translate.'
  },
  other: {
    'anti-ugwaga':
      'single hit/point hit To Following Continued Make use non- official square of Gunn   Web should use Cheng sequence',
    'no-study-before-emph': 'you ',
    'no-study-emph': 'Do not need want learn Learn',
    'no-study-after-emph':
      '; which is Make you of Get Minute for 0 %, you and also will ultra Out threshold value.',
    'zero-error': 'please Do not want lose Enter too many zero.',
    'minscore-before-emph': 'you to less need want Get Minute ',
    'minscore-after-emph': ' Let father mother open heart',
    'minscore-too-high-addendum':
      ' Such as fruit No Have amount outer of Work labor, that you on Big for sleepy Confused.',
    gmaps: 'Make use Valley song Ground Figure',
    image: 'Make use Figure Like',
    'gmaps-error':
      'Google Ground Figure not plus Load! and also Xu you No Have even Pick up To mutual Union network?',
    you: 'you',
    'barcode-legacy-default': 'learn Give birth Edit number{N}',
    'barcode-default': 'wisdom force learn Give birth',
    'barcode-student-placeholder': 'This Yes Who of body Share certificate?',
    ds: 'small number  in number  Ť  w ^  Θ  F  small number',
    mos:
      'One month  two month  three month  four month  Fives month  six month  Seven month  Eight month  nine month  ten month  ten One month  ten two month',
    'no-school': 'this day Do not on learn!',
    flex: 'speak solution',
    brunch: 'Rest interest/early Noon meal',
    lunch: 'Noon meal',
    self: 'from',
    periodx: 'period {X}',
    months:
      'One month  two month  three month  four month  Fives month  six month  Seven month  Eight month  nine month  ten month  ten One month  ten two month',
    loading: 'Load Enter in',
    'no-events': 'this day No Have live move: (',
    'events-error':
      '; no law Get Get thing Pieces; and also Xu you No Have even Pick up To mutual Union network?',
    days:
      'star period day  star period One  star period two  star period three  star period four  star period Fives  star period six',
    'default-alt-msg': 'I They of day Cheng An row wish you it is good Luck',
    'period-name-label': 'Assume Set Mark sign ',
    'enable-lists':
      'start use all fun unit/work Make people member name single',
    'supreme-leader': 'most high collar sleeve',
    universe: 'U In the air',
    'blamed-teacher': 'responsibility Prepare old division',
    'staff-error':
      '; no law Get take member work number according to; and also Xu you No Have even Pick up To mutual Union network?',
    title: 'Mark question:',
    department: 'unit door:',
    email: 'Electricity child mail Pieces:',
    phone: 'Electricity words:',
    website: 'network station:',
    basement: 'Ground under room:',
    'sophomore-club': 'No Have high level all fun unit',
    'soph-desc':
      'One A hair exhibition I They of with Reason heart, tough Sex with its he nuclear heart Society meeting situation sense Skill can of all fun unit; help help I They versus with Row with guide division build Stand up letter Ren turn off system; and build Stand up I They sense To An all with Get To support hold of air between. I They phase letter, I They will through Pass mention ask, Advance Row Have meaning Righteousness of discuss s and in Protect hold I They of nuclear heart price value View of with Time Protect hold open put of state degree, pick war turn off in world World with That this of false Assume, From and From in Receive beneficial. This kind, I They will in no need positive formula Comment Minute or Comment estimate of Pressure force under, and Exhausted One cut Nu force hair Wave, Explore So with Xin reward many kind Sex, hair exhibition from already of body Share. I They of Item Mark Yes help help I They from already recognize knowledge To I They each A people of price value All Yes Do not can estimate the amount of, Do not Yes because for I They Already through take Get Up to make on, and Yes because for I They Yes Who To and I They will to make for Who. I They of Out Diligent rate Yes most it is good of Of One. Do not allow Xu before generation!',
    'soph-day': 'star period four',
    'soph-time': 'soft Sex',
    'soph-room': 'Ren what room between',
    'soph-prez': 'tower Pull · Fu Lun Qi (Tara   Firenzi)',
    'soph-teacher':
      'test special Ni · card Luo horse promise (Courtney   Carlomagno)',
    'soph-email': 'ccarlomagno @ pausd. org',
    'club-error':
      '; no law Get take all fun unit number according to; and also Xu you No Have even Pick up To mutual Union network?',
    day: 'meeting Discuss day:',
    time: 'meeting Discuss Time between:',
    location: 'Bit Set:',
    desc: 'Drawing Statement:',
    presidents: 'main seat:',
    advisors: 'teach division Gu ask:',
    'teacher-email': 'teach division Electricity child mail Pieces:',
    donation: 'build Discuss donate paragraph:',
    'before-alt-msg':
      'This Yes One A Prepare use Time between table. learn school Say:',
    'after-alt-msg': '”',
    appname:
      'non- official square of Gunn   Web should use Cheng sequence (UGWA)',
    'add-to-list': 'add plus To I of all fun unit',
    'remove-from-list': 'From I of all fun unit in delete except',
    'lunch-clubs': 'meeting So',
    summer: 'enjoy Receive you of summer day!',
    'image-url': 'Figure sheet network site',
    cannot: 'mention take Figure Like Time Out Present ask question.',
    'add-asgn': 'add plus Make industry',
    asgn: 'which is will Finish to make of Make industry',
    overdue: 'Over period',
    doneify: 'Mark for Already Finish to make',
    undoneify: 'take Eliminate Mark Remember for Finish to make',
    'asgn-cat-homework': 'Family court Make industry',
    'asgn-cat-preparation': 'system Prepare',
    'asgn-cat-worksheet': 'work Make table',
    'asgn-cat-reading': 'read',
    'asgn-cat-quiz': 'Measurement Test',
    'asgn-cat-test': 'Measurement test',
    'asgn-cat-exam': 'test test',
    'asgn-cat-presentation': 'Introduce Shao',
    'asgn-cat-materials': 'Material Fee',
    'asgn-cat-lab': 'real Test room',
    'asgn-cat-other': 'its he',
    'import-warning':
      'This will Forever Long cover cover you Present Have of Assume Set. you miss you want that A Is it?',
    'import-problem': 'Out Present ask question Up.',
    'export-file-name':
      'Great Big of wisdom Hui gunn - student. json of Assume Set',
    'assync-loading': 'positive in Load Enter Make industry...',
    'assync-loaded': 'Make industry Already plus Load.',
    'assync-loading-problem':
      'Do not again Yes different step. So Have Protect Save of Minute Match All throw Lose Up. please in " selected item " in turn off close " different step ".',
    'assync-saving': 'positive in Protect Save more change...',
    'assync-saved': 'more change Already Protect Save.',
    'assync-saving-problem':
      'Protect Save more change Time Out Present ask question.',
    p0: 'zero period',
    'dead-club': 'This A all fun unit Do not again Save in in Gunn.',
    'psa-date': 'Create build in {D}.',
    'psa-error': 'no law plus Load PSA: ',
    events: 'Big Thing Record',
    'previewing-future':
      'This Yes under One A teach learn day of Time between table.',
    'return-today': 'Show Show this day of Time between table',
    'close-future': 'it is good'
  },
  placeholders: {
    clubs: 'Search So all fun unit',
    staff: 'Search So people member',
    'send-msg': 'hair give away Eliminate interest',
    assignment: 'Minute Match',
    import: 'in this Place stick paste guide Out of Assume Set',
    assync: 'different step ID',
    errors:
      'JavaScript Luck Row Time wrong error will in this Place Remember record'
  },
  times: {
    duration: duration,
    date: '{M}  {D}',
    ended: '{P} Knot bundle Up {T} before.',
    ending: '{P} Knot bundle in {T}.',
    'ending-short': '{T} Leftover under',
    starting: '{P} open beginning in {T}.',
    'starting-short': '{T} straight To {P}',
    long: '{T} long',
    'self-ended': 'Already Knot bundle {T} before.',
    'self-starting': 'open beginning in {T}.',
    'self-ending': 'Knot bundle in {T1}; open beginning Up {T2} before.',
    'due-date': dueDate,
    'end-time': 'learn school in {T} this day.'
  }
}
