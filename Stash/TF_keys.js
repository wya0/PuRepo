const reg1 = /^https:\/\/testflight\.apple\.com\/v3\/accounts\/(.*)\/apps$/;
const reg2 = /^https:\/\/testflight\.apple\.com\/v3\/accounts\/(.*)\/ru\/(\w)+/;

if (reg1.test($request.url)) {
  $persistentStore.write(null, "request_id");
  let url = $request.url;
  let key = url.replace(/(.*accounts\/)(.*)(\/apps)/, "$2");
  const headers = Object.keys($request.headers).reduce((t, i) => ((t[i.toLowerCase()] = $request.headers[i]), t), {});

  let session_id = headers["x-session-id"];
  let session_digest = headers["x-session-digest"];
  let request_id = headers["x-request-id"];
  $persistentStore.write(key, "key");
  $persistentStore.write(session_id, "session_id");
  $persistentStore.write(session_digest, "session_digest");
  $persistentStore.write(request_id, "request_id");
  if ($persistentStore.read("request_id") !== null) {
    $notify("TestFlight自动加入", "信息获取成功", "");
  } else {
    $notify("TestFlight自动加入", "信息获取失败", "请添加testflight.apple.com");
  }
  $done({});
}

if (reg2.test($request.url)) {
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
  $notify("TestFlight自动加入", `已添加APP_ID: ${id}`, `当前ID: ${appId}`);
  $done({});
}

function unique(arr) {
  return Array.from(new Set(arr));
}
