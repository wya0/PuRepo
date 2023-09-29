const reg2 = /^https:\/\/testflight\.apple\.com\/v3\/accounts\/081efe0c-0aaf-4b61-8379-160acc236fd7\/ru\/(.*)/;
let appId = $persistentStore.read("APP_ID");
if (!appId) {
  appId = "";
}
let arr = appId.split(",");
const idMatch = reg2.exec($request.url);
if (idMatch) {
  const id = idMatch[1];
  $notification.post(${id}`);
  $done({});
  arr.push(id);
  arr = [...new Set(arr)].filter((a) => a); // 使用Set去重
  if (arr.length > 0) {
    appId = arr.join(",");
  }
  $persistentStore.write(appId, "APP_ID");
  $notification.post("TestFlight自动加入", `已添加APP_ID: ${id}`, `当前ID: ${appId}`);
  $done({});
} else {
  // 处理没有匹配的情况
  // 可以根据具体需求进行适当的处理
}
$done({});