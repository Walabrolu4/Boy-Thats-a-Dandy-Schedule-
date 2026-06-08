// ── Mutable UI state ───────────────────────────────────────────────────────
// All variables here are shared across modules via the global scope.
// Scripts are loaded in order, so any file loaded after this one can read
// and write these variables directly.

var editMode    = false;   // whether Edit schedule mode is active
var activeAddDay = null;   // day key currently showing the add-session form, or null
var pendingType  = 'anchor'; // type selected in the add-session form
var pendingMicro = false;    // whether the micro toggle is on in the add-session form

var editingSession = null;   // { dayKey, sessionId } of the session currently being edited
var editingType    = 'anchor';
var editingMicro   = false;
var dragState    = null;   // { fromDay, sessionId, el } while a drag is in progress
var _reviewTimer    = null;   // debounce timer handle for auto-saving review text
var taskFormOpen    = false;  // whether the add-task form is visible
