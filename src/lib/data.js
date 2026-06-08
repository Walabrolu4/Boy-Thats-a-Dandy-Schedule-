// ── Default schedule data ──────────────────────────────────────────────────
// This is the factory-reset state. User changes are stored in localStorage
// under 'ls-schedule' and overwrite this at runtime.

export const DEFAULT_TAGS = [
  { id: 'stretch',  label: 'Stretch',          color: '#A4C2AD', mvwTarget: 5, mvwOutOf: 7 },
  { id: 'meditate', label: 'Meditate',         color: '#A4C2AD', mvwTarget: 5, mvwOutOf: 7 },
  { id: 'prog',     label: 'Programming',      color: '#73B887', mvwTarget: 1 },
  { id: 'draw',     label: 'Drawing',          color: '#D97746', mvwTarget: 1 },
  { id: 'keys',     label: 'Keyboard / Music', color: '#A4C2AD', mvwTarget: 1 },
  { id: 'exer',     label: 'Exercise',         color: '#3DD68C', mvwTarget: 2, mvwOutOf: 3 },
  { id: 'review',   label: 'Week Review',      color: '#A4C2AD', mvwTarget: 0 },
  { id: 'reading',  label: 'Reading',          color: '#D9A05B', mvwTarget: 1 },
];

export const DEFAULT_DAYS = [
  { key:'fri', label:'Fri', jsDay:5, sessions:[
    { id:'stretch',   label:'Stretch',     tagId:'stretch',  note:'morning' },
    { id:'drawing',   label:'Drawing',     tagId:'draw',     note:'full session' },
    { id:'meditate',  label:'Meditate',    tagId:'meditate', note:'night' },
  ]},
  { key:'sat', label:'Sat', jsDay:6, sessions:[
    { id:'stretch',   label:'Stretch',     tagId:'stretch',  note:'morning' },
    { id:'prog1',     label:'Programming', tagId:'prog',     note:'session 1' },
    { id:'keyboard',  label:'Keyboard',    tagId:'keys',     note:'+ music prod' },
    { id:'meditate',  label:'Meditate',    tagId:'meditate', note:'night' },
  ]},
  { key:'sun', label:'Sun', jsDay:0, sessions:[
    { id:'stretch',   label:'Stretch',     tagId:'stretch',  note:'morning' },
    { id:'prog2',     label:'Programming', tagId:'prog',     note:'session 2' },
    { id:'exercise1', label:'Exercise',    tagId:'exer',     note:'session 1' },
    { id:'meditate',  label:'Meditate',    tagId:'meditate', note:'night' },
  ]},
  { key:'mon', label:'Mon', jsDay:1, sessions:[
    { id:'stretch',   label:'Stretch',     tagId:'stretch',  note:'morning' },
    { id:'drawmicro', label:'Drawing',     tagId:'draw',     note:'micro', micro:true },
    { id:'exercise2', label:'Exercise',    tagId:'exer',     note:'session 2' },
    { id:'meditate',  label:'Meditate',    tagId:'meditate', note:'night' },
  ]},
  { key:'tue', label:'Tue', jsDay:2, sessions:[
    { id:'stretch',   label:'Stretch',     tagId:'stretch',  note:'morning' },
    { id:'keysmicro', label:'Keyboard',    tagId:'keys',     note:'micro', micro:true },
    { id:'exercise3', label:'Exercise',    tagId:'exer',     note:'session 3' },
    { id:'meditate',  label:'Meditate',    tagId:'meditate', note:'night' },
  ]},
  { key:'wed', label:'Wed', jsDay:3, sessions:[
    { id:'stretch',   label:'Stretch',     tagId:'stretch',  note:'morning' },
    { id:'meditate',  label:'Meditate',    tagId:'meditate', note:'night' },
  ]},
  { key:'thu', label:'Thu', jsDay:4, sessions:[
    { id:'stretch',   label:'Stretch',     tagId:'stretch',  note:'morning' },
    { id:'review',    label:'Week Review', tagId:'review',   note:'evening · 5 min' },
    { id:'meditate',  label:'Meditate',    tagId:'meditate', note:'night' },
  ]},
];

// Default non-scheduled tasks
export const DEFAULT_TASKS = [
  { id: 't-read', label: 'Reading', tagId: 'reading', note: 'opened the book at least once this week' },
];
