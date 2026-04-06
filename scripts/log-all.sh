#!/bin/bash
# 查看所有用户活动日志
# 用法: ./log-all.sh [行数]
# 示例: ./log-all.sh       (显示全部)
#       ./log-all.sh 20    (显示最近20条)

LOG_FILE="/opt/lexiflow/backend/data/user_activity.jsonl"

if [ ! -f "$LOG_FILE" ]; then
    echo "日志文件不存在: $LOG_FILE"
    exit 1
fi

if [ -n "$1" ]; then
    echo "=== 最近 $1 条活动日志 ==="
    tail -"$1" "$LOG_FILE" | python3 -c "
import sys, json
for line in sys.stdin:
    r = json.loads(line.strip())
    print(f\"[{r['timestamp'][:19]}] {r['code']} | {r['event']:10s} | {r['device_type']} {r['browser']} | {r['location']} | {r['ip']}\")
    if r.get('details'):
        print(f\"  └─ {r['details']}\")
"
else
    echo "=== 全部活动日志 ==="
    cat "$LOG_FILE" | python3 -c "
import sys, json
for line in sys.stdin:
    r = json.loads(line.strip())
    print(f\"[{r['timestamp'][:19]}] {r['code']} | {r['event']:10s} | {r['device_type']} {r['browser']} | {r['location']} | {r['ip']}\")
    if r.get('details'):
        print(f\"  └─ {r['details']}\")
"
fi

total=$(wc -l < "$LOG_FILE")
echo ""
echo "--- 共 $total 条记录 ---"
