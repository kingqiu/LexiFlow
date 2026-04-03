#!/usr/bin/env python3
"""
邀请码使用统计查看工具
运行方式：python view_usage_stats.py
"""
import json
from pathlib import Path
from datetime import datetime, date, timedelta
from collections import defaultdict

DATA_DIR = Path(__file__).parent / "data"
INVITE_CODES_FILE = DATA_DIR / "invite_codes.json"
HISTORY_FILE = DATA_DIR / "history.jsonl"

# 邀请码分配记录（手动维护）
CODE_OWNERS = {
    "G-NR2UZA": "Lu",
    "06GE5AGU": "FK",
    "FUKYJG8E": "Jing",
}


def load_invite_codes():
    """加载邀请码数据"""
    if not INVITE_CODES_FILE.exists():
        return {}
    with open(INVITE_CODES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f).get("codes", {})


def load_history():
    """加载生成历史记录"""
    if not HISTORY_FILE.exists():
        return []

    history = []
    with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                history.append(json.loads(line))
    return history


def analyze_usage():
    """分析使用情况"""
    codes = load_invite_codes()
    history = load_history()

    # 按邀请码分组历史记录
    history_by_code = defaultdict(list)
    for record in history:
        code = record.get("invite_code", "")
        if code:
            history_by_code[code].append(record)

    print("=" * 80)
    print("LexiFlow 邀请码使用统计")
    print("=" * 80)
    print()

    # 统计每个邀请码
    for code, info in sorted(codes.items()):
        owner = CODE_OWNERS.get(code, "未分配")
        print(f"📋 邀请码: {code} ({owner})")
        print("-" * 80)

        # 基本信息
        created_at = info.get("created_at", "未知")
        bound_device = info.get("bound_device", "未绑定")
        bound_at = info.get("bound_at", "")
        total_usage = info.get("total_usage", 0)
        last_used = info.get("last_used")

        print(f"  创建时间: {created_at}")
        print(f"  绑定设备: {bound_device[:20]}..." if len(bound_device) > 20 else f"  绑定设备: {bound_device}")
        if bound_at:
            bound_time = datetime.fromisoformat(bound_at).strftime("%Y-%m-%d %H:%M")
            print(f"  绑定时间: {bound_time}")
        print(f"  累计使用: {total_usage} 个单词")

        if last_used:
            last_time = datetime.fromisoformat(last_used).strftime("%Y-%m-%d %H:%M")
            print(f"  最后使用: {last_time}")
        else:
            print(f"  最后使用: 从未使用")

        # 每日使用统计
        daily_usage = info.get("daily_usage", {})
        if daily_usage:
            print(f"\n  📊 每日使用明细:")
            for day in sorted(daily_usage.keys(), reverse=True)[:7]:  # 最近7天
                count = daily_usage[day]
                print(f"    {day}: {count} 个单词")

        # 生成历史统计
        code_history = history_by_code.get(code, [])
        if code_history:
            print(f"\n  📝 生成记录: 共 {len(code_history)} 次")

            # 统计失败情况
            failed_records = [r for r in code_history if r.get("failed_count", 0) > 0]
            if failed_records:
                print(f"  ⚠️  失败记录: {len(failed_records)} 次")
                for record in failed_records[-3:]:  # 最近3次失败
                    timestamp = record.get("timestamp", "")
                    if timestamp:
                        time_str = datetime.fromisoformat(timestamp).strftime("%Y-%m-%d %H:%M")
                    else:
                        time_str = "未知时间"
                    failed_count = record.get("failed_count", 0)
                    failed_words = record.get("failed_words", [])
                    print(f"      {time_str}: {failed_count} 个单词失败")
                    if failed_words:
                        print(f"        失败单词: {', '.join(failed_words[:5])}")

        print()

    # 总体统计
    print("=" * 80)
    print("📈 总体统计")
    print("-" * 80)

    total_codes = len(codes)
    used_codes = sum(1 for info in codes.values() if info.get("total_usage", 0) > 0)
    bound_codes = sum(1 for info in codes.values() if info.get("bound_device"))
    total_words = sum(info.get("total_usage", 0) for info in codes.values())
    total_generations = len(history)

    print(f"  总邀请码数: {total_codes}")
    print(f"  已使用: {used_codes}")
    print(f"  已绑定设备: {bound_codes}")
    print(f"  累计生成单词: {total_words}")
    print(f"  累计生成次数: {total_generations}")

    # 今日统计
    today = str(date.today())
    today_usage = sum(info.get("daily_usage", {}).get(today, 0) for info in codes.values())
    print(f"  今日使用: {today_usage} 个单词")

    print()


if __name__ == "__main__":
    analyze_usage()
