// Shared in-memory app state
let items = [];
let masterData = []; // {id, type: 'location'|'category'|'subcategory', value, parent} — managed from Settings
let currentTab = 'dashboard';
let addMode = 'hub'; // 'hub' | 'form'
let formReturnTo = 'hub'; // 'hub' | 'detail'
let searchTerm = '';
let editingId = null;
let capturedPhoto = null;
let scanStream = null, scanRAF = null;
