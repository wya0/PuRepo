// lp_plugin_pandalive_5721004_full_dynamic_1.0.1_index.js
// 处理 list.m3u 动态更新 + 全房间覆盖

(function () {
  const BASE_URL = 'https://5721004.xyz/player';
  const T_PARAM = '20240701';

  // 解析 list.m3u → Map<userId, m3u8Url>
  async function getM3uMap() {
    try {
      const res = await fetch(`${BASE_URL}/list.m3u`, { cache: 'no-cache' });
      if (!res.ok) return new Map();
      const text = await res.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const map = new Map();
      let i = 0;
      while (i < lines.length) {
        if (lines[i].startsWith('#EXTINF:-1')) {
          const inf = lines[i].replace(/^#EXTINF:-1\s*,\s*/, '');
          const parts = inf.split(',').map(p => p.trim());
          const userId = parts[0] || '';
          // 跳到下一非#行作为 URL
          i++;
          while (i < lines.length && lines[i].startsWith('#')) i++;
          if (i < lines.length && lines[i].startsWith('https://') && lines[i].endsWith('.m3u8')) {
            map.set(userId, lines[i]);
          }
        }
        i++;
      }
      return map;
    } catch {
      return new Map();
    }
  }

  const matcher = {
    match: (url) => /5721004\.xyz\/player\/pandalive/.test(url) || url.includes('pandalive0418.html'),
    priority: 10,

    async extract(url, html) {
      try {
        const m3uMap = await getM3uMap();  // 每次都刷新，应对更新

        const listRes = await fetch(`${BASE_URL}/list.json`, { cache: 'no-cache' });
        if (!listRes.ok) throw new Error('list.json 失败');
        const data = await listRes.json();
        const liveRooms = (data.list || []).filter(r => r.isLive === true);

        if (liveRooms.length === 0) return { error: '无直播房间' };

        const streams = liveRooms.map(room => {
          const userId = room.userId;
          if (!userId) return null;

          const directUrl = m3uMap.get(userId);

          return {
            name: `${room.userNick || userId} - ${room.title || '无标题'}`,
            type: 'hls',
            url: directUrl || '',  // m3u 有就直接用，否则动态加载
            quality: room.sizeWidth ? `${room.sizeWidth}p` : '原画',
            platform: 'pandalive_5721004',
            owner: room.userNick || userId,
            title: room.title,
            viewers: room.user || 0,
            thumbnail: room.thumbUrl || room.ivsThumbnail || room.userImg,
            roomId: userId,
            source: directUrl ? 'list.m3u (pre-loaded)' : 'api.php (on-demand)'
          };
        }).filter(Boolean);

        return {
          title: `PandaLive 全镜像 (${liveRooms.length} 个直播) • m3u覆盖 ${m3uMap.size} 个`,
          platform: 'pandalive',
          streams,
          description: `list.json 提供全量房间，list.m3u 动态加速部分（当前${m3uMap.size}个，更新时间约 ${new Date().toLocaleTimeString()}）。未覆盖的选定时自动 fetch api.php。`
        };

      } catch (err) {
        console.error('[pandalive_full] 错误:', err);
        return { error: err.message || '加载失败，检查网络/站点' };
      }
    }

    // 如果 LiveParse 支持 stream-level loader，添加此方法（推荐）
    // async getStreamUrl(stream) {
    //   if (stream.url) return stream.url;
    //   if (!stream.roomId) throw new Error('无标识');
    //   const api = `${BASE_URL}/api.php?id=${encodeURIComponent(stream.roomId)}&t=${T_PARAM}`;
    //   const res = await fetch(api);
    //   const json = await res.json();
    //   if (json.code === 200 && json.url?.endsWith('.m3u8')) return json.url;
    //   throw new Error('无有效流');
    // }
  };

  if (window.lpRegisterPlugin) window.lpRegisterPlugin(matcher);
  else {
    window.lp_plugins = window.lp_plugins || [];
    window.lp_plugins.push(matcher);
  }
})();