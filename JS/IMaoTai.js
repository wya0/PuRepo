/******************************************
 * @name i茅台预约
 * @channel https://t.me/yqc_123/
 * @feedback https://t.me/yqc_777/
 * @author 𝒀𝒖𝒉𝒆𝒏𝒈
 * @update 20231002
 * @version 1.0.0
******************************************/
var $ = new Env('i茅台'),service = $.http
// 开发方便兼容node
$.isNode() && (($request = null), ($response = null))
var CryptoJS = loadCryptoJS()
var maotai = new Maotai()
// -----------------------------------------------------------------------------------------
// 配置项
var isClearShopDir = $.getdata('imaotai__config__clearshopdir') || false // 是否清理店铺字典
var province = $.getdata('imaotai__config__province') || '' // 省份
var city = $.getdata('imaotai__config__city') || '' // 城市
var itemCode = $.getdata('imaotai__config__itemcode') || '10213' // 预约项
var location = $.getdata('imaotai__config__location') || '' // 地址经纬度
var address = $.getdata('imaotai__config__address') || '' // 详细地址
var shopid = $.getdata('imaotai__config__shopid') || '' // 商铺id
var imaotaiParams = JSON.parse($.getdata('imaotai_params') || '{}') // 抓包参数
var Message = '' // 消息内容
// -----------------------------------------------------------------------------------------
// TODO: 后续支持多品预约
var itemMap = {
    10213: '贵州茅台酒（癸卯兔年）',
    2478: '贵州茅台酒（珍品）',
    10214: '贵州茅台酒（癸卯兔年）x2',
    10056: '53%vol 500ml 茅台1935'
}
!(async () => {
    // 抓包
    if ($request && typeof $request === 'object') {
        if ($request.method === 'OPTIONS') return false
        // console.log(JSON.stringify($request.headers))
        var userId = JSON.parse($response.body).data.userId
        $.setdata(
            JSON.stringify({
                headers: $request.headers,
                userId
            }),
            'imaotai_params'
        )
        Message = `抓取数据成功🎉\nuserId:${userId}`
        return false
    }
    if (JSON.stringify(imaotaiParams) === '{}') throw `请先开启代理工具对必要参数进行抓包`
    if (!imaotaiParams.userId || !imaotaiParams.headers['MT-Token']) throw '请先开启代理工具进行抓包相关操作!'
    if (!province) throw '请在BoxJs中配置省份'
    if (!city) throw '请在BoxJs中配置城市'
    if (!itemCode) throw '请在BoxJs中配置预约项'
    if (!address) throw '请在BoxJs中配置详细地址'
    if (!location) await queryAddress()
    $.log(`获取到经纬度：${location}`)
    if (shopid) maotai.shopId = shopid
    // 当前时间段如果不是9点 - 10点，不允许预约
    var _hour = new Date().getHours()
    if (_hour < 9 || _hour > 10) throw '不在有效的预约时间内'
    var { headers, userId } = imaotaiParams
    maotai.headers = Object.assign(maotai.headers, headers)
    maotai.userId = userId
    if (!maotai.version) {
        var version = await maotai.getLatestVersion()
        maotai.version = version
    }
    $.log(`当前版本号：${maotai.version}`)
    if (!maotai.sessionId) {
        var sessionId = await maotai.getSessionId()
        maotai.sessionId = sessionId
    }
    $.log(`获取到sessionId：${maotai.sessionId}`)
    isClearShopDir && $.setdata(JSON.stringify([]), `imaotai_${province}_${city}_dictionary`)
    var dictionary = JSON.parse($.getdata(`imaotai_${province}_${city}_dictionary`) || '[]')
    if (dictionary.length === 0) {
        dictionary = await maotai.getStoreMap()
        $.log(`获取到商铺地图数据`)
        $.setdata(JSON.stringify(dictionary), `imaotai_${province}_${city}_dictionary`)
    } else {
        $.log(`从缓存中获取到商铺地图数据`)
    }
    // $.log(JSON.stringify(dictionary))
    maotai.dictionary = dictionary
    if (!maotai.shopId) {
        var shopId = await maotai.getNearbyStore()
        maotai.shopId = shopId
    }
    $.log(`获取到最近店铺id：${maotai.shopId}`)
    await maotai.doReserve()
    await maotai.getAward()
})()
    .catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
        Message += `❌ 失败! 原因: ${e}!`
    })
    .finally(async () => {
        const notify = async (msg) => $.msg($.name, '', msg)
        await notify(Message)
        $.done()
    })
/**
 * 根据详细地址查询经纬度
 */
async function queryAddress() {
    var amapApi = '0a7f4baae0a5e37e6f90e4dc88e3a10d'
    var url = `https://restapi.amap.com/v3/geocode/geo?key=${amapApi}&output=json&address=${encodeURIComponent(
        address
    )}`
    var { body: resp } = await service.get(url)
    var { status, info, geocodes } = JSON.parse(resp)
    if (status !== '1') throw `获取经纬度失败, ${info}`
    var { location: _location } = geocodes[0]
    $.setdata(_location, 'imaotai__config__location')
    location = _location
}
/**
 * 工具类
 */
function Maotai() {
    return new (class {
        constructor() {
            this.headers = {
                'MT-Info': `028e7f96f6369cafe1d105579c5b9377`,
                'Accept-Encoding': `gzip, deflate, br`,
                Host: `app.moutai519.com.cn`,
                'MT-User-Tag': `0`,
                'MT-Token': ``, // 抓
                Connection: `keep-alive`,
                'MT-Device-ID': ``, // 抓
                'Accept-Language': `zh-Hans-CN;q=1`,
                'MT-Team-ID': ``,
                'Content-Type': `application/json`,
                'MT-Request-ID': `${Date.now()}${Math.floor(Math.random() * 90000 + 10000)}`,
                'MT-APP-Version': `1.4.9`,
                'User-Agent': `iOS;14.3;Apple;iPhone 12`, // 抓
                'MT-K': Date.now(),
                'MT-R': `clips_OlU6TmFRag5rCXwbNAQ/Tz1SKlN8THcecBp/HGhHdg==`,
                'MT-Bundle-ID': `com.moutai.mall`,
                'MT-Network-Type': `WIFI`,
                Accept: `*/*`,
                'BS-DVID': ``,
                'MT-Lat': ``, // 填
                'MT-Lng': `` // 填
            }
            this.version = ''
            this.sessionId = ''
            this.dictionary = []
            this.shopId = ''
            this.userId = '' // 抓
        }
        // 获取最新版本号
        async getLatestVersion() {
            return (await service.get('https://apps.apple.com/cn/app/i%E8%8C%85%E5%8F%B0/id1600482450')).body
                .match(/new__latest__version">(.*?)<\/p>/)[1]
                .replace('版本 ', '')
        }
        // 获取今日sessionId
        async getSessionId() {
            var _ts = new Date().setHours(0, 0, 0, 0)
            var { body: response } = await service.get(
                `https://static.moutai519.com.cn/mt-backend/xhr/front/mall/index/session/get/${_ts}`
            )
            var { code, data, message } = JSON.parse(response)
            if (code !== 2000) throw `获取sessionId失败, ${message}`
            var { sessionId } = data
            return sessionId
        }
        // 获取商铺地图信息
        async getStoreMap() {
            var { body: response } = await service.get(
                'https://static.moutai519.com.cn/mt-backend/xhr/front/mall/resource/get'
            )
            var { code, data, message } = JSON.parse(response)
            if (code !== 2000) throw `获取商铺地图信息失败, ${message}`
            var {
                mtshops_pc: { url: mapUrl }
            } = data
            var _json = (await service.get(mapUrl)).body
            var arr = []
            Object.values(JSON.parse(_json)).map((item) => {
                if (item.provinceName === province && item.cityName === city) arr.push(item)
            })
            return arr
        }
        // TODO:后续是否加入当地投放量最大的店铺
        // 获取最近店铺
        async getNearbyStore() {
            var _ts = new Date().setHours(0, 0, 0, 0)
            var url = `https://static.moutai519.com.cn/mt-backend/xhr/front/mall/shop/list/slim/v3/${
                this.sessionId
            }/${encodeURIComponent(province)}/${itemCode}/${_ts}`
            var { body: response } = await service.get({ url })
            var { code, data, message } = JSON.parse(response)
            if (code !== 2000) throw `获取店铺列表失败, ${message}`
            var { shops } = data
            // 查找最近店铺
            const findBest = (shops) => {
                var { dictionary } = this
                var _lnt = location.split(',')[0]
                var _lat = location.split(',')[1]
                // 计算距离
                const getDistance = (lnt1, lat1, lnt2, lat2) => {
                    var radLat1 = (lat1 * Math.PI) / 180.0
                    var radLat2 = (lat2 * Math.PI) / 180.0
                    var a = radLat1 - radLat2
                    var b = (lnt1 * Math.PI) / 180.0 - (lnt2 * Math.PI) / 180.0
                    var s =
                        2 *
                        Math.asin(
                            Math.sqrt(
                                Math.pow(Math.sin(a / 2), 2) +
                                    Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
                            )
                        )
                    s = s * 6378.137
                    s = Math.round(s * 10000) / 10000
                    return s
                }
                // 获取离填写经纬度距离
                var nearestShop = dictionary.map((item) => ({
                    ...item,
                    distance: getDistance(_lnt, _lat, item.lng, item.lat)
                }))
                // 过滤出包含预约项的店铺列表
                var _shops = shops.reduce((acc, item) => {
                    var _item = item.items.find((i) => i.itemId === itemCode)
                    if (_item) {
                        acc.push({
                            shopId: item.shopId,
                            items: _item
                        })
                    }
                    return acc
                }, [])
                // 寻找最佳最近且包含预约项的店铺
                var bestReserveShop = nearestShop
                    .filter((item) => _shops.find((_item) => _item.shopId === item.shopId))
                    .sort((a, b) => a.distance - b.distance)[0]
                $.log(`获取到最近店铺：${JSON.stringify(bestReserveShop)}`)
                if (!bestReserveShop)
                    throw '获取最佳店铺失败, 可能的原因是本地无预约项的投放, 请切换预约项或手动填入商店ID'
                return bestReserveShop.shopId
            }
            return findBest(shops)
        }
        // 预约
        async doReserve() {
            var params = {
                itemInfoList: [{ count: 1, itemId: itemCode }],
                sessionId: parseInt(this.sessionId),
                userId: this.userId,
                shopId: this.shopId
            }
            var helper = new DecryptHelper()
            var actParam = helper.Encrypt(JSON.stringify(params))
            var options = {
                url: `https://app.moutai519.com.cn/xhr/front/mall/reservation/add`,
                headers: this.headers,
                body: JSON.stringify({
                    actParam: actParam,
                    ...params
                })
            }
            var { body: resp } = await service.post(options)
            var { code, data, message } = JSON.parse(resp)
            if (code === 401) {
                Message = `预约失败\ntoken失效, 请重新抓包获取`
                return false
            }
            if (code !== 2000) throw `预约失败, ${message}`
            Message += `${JSON.stringify(data)}`
        }
        // 领取耐力和小茅运
        async getAward() {
            var cookies = {
                'MT-Device-ID-Wap': this.headers['MT-Device-ID'],
                'MT-Token-Wap': this.headers['MT-Token'],
                YX_SUPPORT_WEBP: '1'
            }

            var options = {
                url: 'https://h5.moutai519.com.cn/game/isolationPage/getUserEnergyAward',
                headers: {
                    ...this.headers,
                    Cookie: Object.entries(cookies)
                        .map(([key, value]) => `${key}=${value}`)
                        .join('; ')
                },
                body: JSON.stringify({})
            }
            var { body: resp } = await service.post(options)
            // {"code":200,"message":null,"data":{"continueReserveRate":null,"awardRule":[{"goodId":20001,"goodName":"耐力","goodCode":null,"goodType":null,"goodUrl":null,"count":30}]},"error":null}
            var { code, data, message } = JSON.parse(resp)
            if (code !== 200) throw `领取耐力失败, ${message}`
            $.log(`领取耐力成功`)
            Message += `${JSON.stringigy(data)}`
        }
    })()
}
/**
 * 加密类
 */
function DecryptHelper() {
    return new (class {
        constructor(key, iv) {
            this.key = CryptoJS.enc.Utf8.parse(key || 'qbhajinldepmucsonaaaccgypwuvcjaa')
            this.iv = CryptoJS.enc.Utf8.parse(iv || '2018534749963515')
        }
        pkcs7padding(text) {
            const bs = 16
            const length = text.length
            const padding_size = bs - (length % bs)
            const padding = String.fromCharCode(padding_size).repeat(padding_size)
            return text + padding
        }
        Encrypt(content) {
            const contentPadding = this.pkcs7padding(content)
            const encryptBytes = CryptoJS.AES.encrypt(contentPadding, this.key, {
                iv: this.iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.NoPadding
            })
            return encryptBytes.toString()
        }
        Decrypt(content) {
            const decryptBytes = CryptoJS.AES.decrypt(content, this.key, {
                iv: this.iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.NoPadding
            })
            const result = decryptBytes.toString(CryptoJS.enc.Utf8)
            return result.replace(/[\x00-\x1f]*$/g, '')
        }
    })()
}
/***************** Env *****************/
// prettier-ignore
// https://github.com/chavyleung/scripts/blob/master/Env.min.js

function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),n=this.getval(a),o=a?"null"===n?null:n||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const n={};this.lodash_set(n,r,t),s=this.setval(JSON.stringify(n),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);default:return this.data&&this.data[e]||null}}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:n,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:n,bodyBytes:o},n,o)},t=>e(t&&t.error||"UndefinedError"))}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:n,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:n,bodyBytes:o},n,o)},t=>e(t&&t.error||"UndefinedError"))}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const n=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t}}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,n(r));break;case"Quantumult X":$notify(e,s,a,n(r))}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e=""){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,e,t)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t)}}}(t,e)}