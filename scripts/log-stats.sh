#!/bin/bash
# 查看用户活动统计摘要
# 用法: ./log-stats.sh
# 显示每个邀请码的登录次数、生成次数、设备类型、最近活动时间等

LOG_FILE="/opt/lexiflow/backend/data/user_activity.jsonl"

if [ ! -f "$LOG_FILE" ]; then
    echo "日志文件不存在: $LOG_FILE"
    exit 1
fi

echo "=== LexiFlow 用户活动统计 ==="
echo ""

python3 -c "
import json
from collections import defaultdict

stats = defaultdict(lambda: {
    'login': 0, 'generate': 0, 'playback': 0, 'download': 0,
    'devices': set(), 'locations': set(), 'browsers': set(),
    'first_seen': '', 'last_seen': '', 'total_words': 0
})

with open('$LOG_FILE', 'r') as f:
    for line in f:
        r = json.loads(line.strip())
        code = r['code']
        s = stats[code]
        event = r.get('event', '')
        if event in s:
            s[event] += 1
        s['devices'].add(r.get('device_type', ''))
        s['locations'].add(r.get('location', ''))
        s['browsers'].add(r.get('browser', ''))
        ts = r.get('timestamp', '')
        if not s['first_seen'] or ts < s['first_seen']:
            s['first_seen'] = ts
        if not s['last_seen'] or ts > s['last_seen']:
            s['last_seen'] = ts
        details = r.get('details', {})
        if isinstance(details, dict):
            s['total_words'] += details.get('word_count', 0)

for code in sorted(stats.keys()):
    s = stats[code]
    print(f'邀请码: {code}')
    print(f'  首次登录: {s[\"first_seen\"][:19]}')
    print(f'  最近活动: {s[\"last_seen\"][:19]}')
    print(f'  登录: {s[\"login\"]}次 | 生成: {s[\"generate\"]}次 | 播放: {s[\"playback\"]}次 | 下载: {s[\"download\"]}次')
    print(f'  生成单词数: {s[\"total_words\"]}')
    print(f'  设备: {\", \".join(d for d in s[\"devices\"] if d)}')
    print(f'  浏览器: {\", \".join(b for b in s[\"browsers\"] if b)}')
    print(f'  地点: {\", \".join(l for l in s[\"locations\"] if l)}')
    print()

print(f'--- 共 {len(stats)} 个活跃邀请码 ---')
"
