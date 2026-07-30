function getStatus(item){
  const today = new Date(); today.setHours(0,0,0,0);
  let level='ok', label='OK', sortKey=99999;
  if(item.expiry_date){
    const exp = new Date(item.expiry_date);
    const diff = Math.round((exp-today)/86400000);
    if(diff<0){ level='expired'; label=`Expired ${Math.abs(diff)} day(s) ago`; sortKey=diff; }
    else if(diff<=7){ level='urgent'; label=`Expires in ${diff} day(s)`; sortKey=diff; }
    else { sortKey=Math.min(sortKey,diff); }
  }
  if(item.tracking_mode==='estimate' && item.opened_date && item.usage_rate_per_day>0){
    const opened = new Date(item.opened_date);
    const finishDate = new Date(opened.getTime() + (item.open_qty_at_open/item.usage_rate_per_day)*86400000);
    const diff = Math.round((finishDate-today)/86400000);
    if(level==='ok'){
      if(diff<=0){ level='urgent'; label='Likely used up — check the real stock'; sortKey=-1; }
      else if(diff<=5){ level='urgent'; label=`Estimated to run out in ${diff} day(s)`; sortKey=diff; }
      else { sortKey=Math.min(sortKey,diff); }
    }
  }
  if(item.tracking_mode==='exact' && level==='ok' && item.shelf_qty<=1){
    level='warn';
    label = item.shelf_qty<=0 ? 'Out of stock on the shelf' : 'Running low on the shelf';
    sortKey = Math.min(sortKey, item.shelf_qty<=0?-1:0);
  }
  return {level,label,sortKey};
}
const LEVEL_ORDER = {expired:0, urgent:1, warn:2, ok:3};
