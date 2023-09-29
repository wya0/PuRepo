const reg2 = /^https:\/\/testflight\.apple\.com\/join\/(.*)/;
let appId = $persistentStore.read("APP_ID");
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
$persistentStore.write(appId, "APP_ID");
$notification.post("TestFlight自动加入", `已添加APP_ID: ${id}`, `当前ID: ${appId}`);
$done({});