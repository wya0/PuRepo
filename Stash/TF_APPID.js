let appId = $prefs.valueForKey("APP_ID");
if (!appId) {
  appId = "";
}
let arr = appId.split(",");
const id = reg2.exec($request.url)[1];
arr.push(id);
arr = unique(arr).filter((a) => a);
if (arr.length > 0) {
  appId = arr.join(",");
}
$prefs.setValueForKey(appId, "APP_ID");
$notify("TestFlight自动加入", `已添加APP_ID: ${id}`, `当前ID: ${appId}`);
$done({});