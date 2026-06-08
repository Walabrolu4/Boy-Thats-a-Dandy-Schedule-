// ── Default schedule data ──────────────────────────────────────────────────
// This is the factory-reset state. User changes are stored in localStorage
// under 'ls-schedule' and overwrite this at runtime.

export const DEFAULT_DAYS = [
  { key:'fri', label:'Fri', jsDay:5, sessions:[
    { id:'stretch',   label:'Stretch',     type:'anchor', note:'morning' },
    { id:'drawing',   label:'Drawing',     type:'draw',   note:'full session' },
    { id:'meditate',  label:'Meditate',    type:'anchor', note:'night' },
  ]},
  { key:'sat', label:'Sat', jsDay:6, sessions:[
    { id:'stretch',   label:'Stretch',     type:'anchor', note:'morning' },
    { id:'prog1',     label:'Programming', type:'prog',   note:'session 1' },
    { id:'keyboard',  label:'Keyboard',    type:'keys',   note:'+ music prod' },
    { id:'meditate',  label:'Meditate',    type:'anchor', note:'night' },
  ]},
  { key:'sun', label:'Sun', jsDay:0, sessions:[
    { id:'stretch',   label:'Stretch',     type:'anchor', note:'morning' },
    { id:'prog2',     label:'Programming', type:'prog',   note:'session 2' },
    { id:'exercise1', label:'Exercise',    type:'exer',   note:'session 1' },
    { id:'meditate',  label:'Meditate',    type:'anchor', note:'night' },
  ]},
  { key:'mon', label:'Mon', jsDay:1, sessions:[
    { id:'stretch',   label:'Stretch',     type:'anchor', note:'morning' },
    { id:'drawmicro', label:'Drawing',     type:'draw',   note:'micro', micro:true },
    { id:'exercise2', label:'Exercise',    type:'exer',   note:'session 2' },
    { id:'meditate',  label:'Meditate',    type:'anchor', note:'night' },
  ]},
  { key:'tue', label:'Tue', jsDay:2, sessions:[
    { id:'stretch',   label:'Stretch',     type:'anchor', note:'morning' },
    { id:'keysmicro', label:'Keyboard',    type:'keys',   note:'micro', micro:true },
    { id:'exercise3', label:'Exercise',    type:'exer',   note:'session 3' },
    { id:'meditate',  label:'Meditate',    type:'anchor', note:'night' },
  ]},
  { key:'wed', label:'Wed', jsDay:3, sessions:[
    { id:'stretch',   label:'Stretch',     type:'anchor', note:'morning' },
    { id:'meditate',  label:'Meditate',    type:'anchor', note:'night' },
  ]},
  { key:'thu', label:'Thu', jsDay:4, sessions:[
    { id:'stretch',   label:'Stretch',     type:'anchor', note:'morning' },
    { id:'review',    label:'Week Review', type:'review', note:'evening · 5 min' },
    { id:'meditate',  label:'Meditate',    type:'anchor', note:'night' },
  ]},
];

// Default non-scheduled tasks
export const DEFAULT_TASKS = [
  { id: 'reading', label: 'Reading', note: 'opened the book at least once this week' },
];

// Session type identifiers used in the add-session type picker
export const TYPES = ['anchor', 'prog', 'draw', 'keys', 'exer'];

// Legend entries shown below the grid
export const LEGEND_ITEMS = [
  { type:'prog',   label:'Programming' },
  { type:'draw',   label:'Drawing' },
  { type:'keys',   label:'Keyboard / Music' },
  { type:'exer',   label:'Exercise' },
  { type:'anchor', label:'Daily anchor' },
];
