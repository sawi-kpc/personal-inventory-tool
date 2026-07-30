/**
 * StockKeeper backend — turns a Google Sheet into a tiny REST API.
 *
 * Setup:
 * 1. Create a new Google Sheet (any name).
 * 2. Extensions > Apps Script. Delete the placeholder code and paste this whole file in.
 * 3. Click Deploy > New deployment > select type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL it gives you (ends in /exec) and paste it into
 *    the app's Settings screen.
 * 5. First request will auto-create an "Items" sheet with headers.
 *
 * Data model: one row per item, columns = HEADERS below.
 * Photos are stored as compressed base64 strings directly in the sheet
 * (the app already compresses images to ~15–40KB before sending them,
 * well under the ~50,000 character per-cell limit).
 *
 * A second sheet, MasterData, holds the managed lists (storage locations,
 * categories, sub-categories) edited from the app's Settings screen.
 * Columns = MASTER_HEADERS below; `parent` holds a category's id for
 * sub-category rows, and is blank for locations/categories.
 */

const SHEET_NAME = 'Items';
const HEADERS = [
  'id','name','category','location','pack_size','storage_qty','shelf_qty',
  'tracking_mode','usage_rate_per_day','expiry_date','note','photo',
  'unassigned','opened_date','open_qty_at_open','created_at'
];

const MASTER_SHEET_NAME = 'MasterData';
const MASTER_HEADERS = ['id','type','value','parent'];

function getSheet_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if(!sheet){
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getMasterSheet_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if(!sheet){
    sheet = ss.insertSheet(MASTER_SHEET_NAME);
    sheet.appendRow(MASTER_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e){
  const action = e.parameter.action || 'list';
  if(action === 'list'){
    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    if(lastRow < 2) return jsonOutput_({ok:true, items:[]});
    const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    const items = values.filter(r => r[0] !== '').map(rowToItem_);
    return jsonOutput_({ok:true, items});
  }
  if(action === 'list_master'){
    const sheet = getMasterSheet_();
    const lastRow = sheet.getLastRow();
    if(lastRow < 2) return jsonOutput_({ok:true, master:[]});
    const values = sheet.getRange(2, 1, lastRow - 1, MASTER_HEADERS.length).getValues();
    const master = values.filter(r => r[0] !== '').map(rowToMaster_);
    return jsonOutput_({ok:true, master});
  }
  return jsonOutput_({ok:false, error:'Unknown action'});
}

function doPost(e){
  let body;
  try{
    body = JSON.parse(e.postData.contents);
  }catch(err){
    return jsonOutput_({ok:false, error:'Invalid JSON body'});
  }

  if(body.action === 'save' && body.item && body.item.id){
    upsertItem_(getSheet_(), body.item);
    return jsonOutput_({ok:true});
  }
  if(body.action === 'delete' && body.id){
    deleteRowById_(getSheet_(), body.id);
    return jsonOutput_({ok:true});
  }
  if(body.action === 'save_master' && body.entry && body.entry.id){
    upsertMaster_(getMasterSheet_(), body.entry);
    return jsonOutput_({ok:true});
  }
  if(body.action === 'delete_master' && body.id){
    deleteRowById_(getMasterSheet_(), body.id);
    return jsonOutput_({ok:true});
  }
  return jsonOutput_({ok:false, error:'Unknown action or missing fields'});
}

function rowToItem_(row){
  const obj = {};
  HEADERS.forEach((h, i) => { obj[h] = row[i]; });
  obj.pack_size = Number(obj.pack_size) || 1;
  obj.storage_qty = Number(obj.storage_qty) || 0;
  obj.shelf_qty = Number(obj.shelf_qty) || 0;
  obj.usage_rate_per_day = Number(obj.usage_rate_per_day) || 0;
  obj.open_qty_at_open = (obj.open_qty_at_open === '' || obj.open_qty_at_open === null) ? null : Number(obj.open_qty_at_open);
  obj.unassigned = (obj.unassigned === true || obj.unassigned === 'true' || obj.unassigned === 'TRUE');
  obj.created_at = Number(obj.created_at) || 0;
  obj.expiry_date = obj.expiry_date === '' ? null : obj.expiry_date;
  obj.opened_date = obj.opened_date === '' ? null : obj.opened_date;
  obj.photo = obj.photo === '' ? null : obj.photo;
  return obj;
}

function rowToMaster_(row){
  const obj = {};
  MASTER_HEADERS.forEach((h, i) => { obj[h] = row[i]; });
  obj.parent = obj.parent === '' ? null : obj.parent;
  return obj;
}

function findRowIndexById_(sheet, id){
  const lastRow = sheet.getLastRow();
  if(lastRow < 2) return -1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for(let i = 0; i < ids.length; i++){
    if(ids[i][0] === id) return i + 2; // +2: 1-indexed + header row
  }
  return -1;
}

function upsertItem_(sheet, item){
  const rowValues = HEADERS.map(h => {
    const v = item[h];
    return (v === undefined || v === null) ? '' : v;
  });
  const rowIdx = findRowIndexById_(sheet, item.id);
  if(rowIdx > 0){
    sheet.getRange(rowIdx, 1, 1, HEADERS.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function upsertMaster_(sheet, entry){
  const rowValues = MASTER_HEADERS.map(h => {
    const v = entry[h];
    return (v === undefined || v === null) ? '' : v;
  });
  const rowIdx = findRowIndexById_(sheet, entry.id);
  if(rowIdx > 0){
    sheet.getRange(rowIdx, 1, 1, MASTER_HEADERS.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteRowById_(sheet, id){
  const rowIdx = findRowIndexById_(sheet, id);
  if(rowIdx > 0) sheet.deleteRow(rowIdx);
}

function jsonOutput_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
