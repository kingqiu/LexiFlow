#!/bin/bash
# 查看指定邀请码的活动日志
# 用法: ./log-user.sh <邀请码>
# 示例: ./log-user.sh MUHNYVRC

LOG_FILE="/opt/lexiflow/backend/data/user_activity.jsonl"

if [ -z "$1" ]; then
    echo "用法: ./log-user.sh <邀请码>"
    echo "示例: ./log-user.sh MUHNYVRC"
    echo ""
    echo "当前所有邀请码:"
    grep -oP '"code":\s*"\K[^"]+' "$LOG_FILE" | sort -u
    exit 1
fi

if [ ! -f "$LOG_FILE" ]; then
    echo "日志文件不存在: $LOG_FILE"
    exit 1
fi

CODE=$(echo "$1" | tr '[:lower:]' '[:upper:]')

echo "=== 邀请码 $CODE 的活动日志 ==="
grep "\"$CODE\"" "$LOG_FILE" | python3 -c "
import sys, json
for line in sys.stdin:
    r = json.loads(line.strip())
    print(f\"[{r['timestamp'][:19]}] {r['event']:10s} | {r['device_type']} {r['browser']} | {r['location']} | {r['ip']}\")
    if r.get('details'):
        print(f\"  └─ {r['details']}\")
"

count=$(grep -c "\"$CODE\"" "$LOG_FILE")
echo ""
echo "--- $CODE 共 $count 条记录 ---"
