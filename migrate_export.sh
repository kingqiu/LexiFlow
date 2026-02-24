#!/bin/bash

# ============================================================
# LexiFlow 一键导出脚本
# 将用户数据、环境配置、音频文件打包为可迁移的压缩包
# 用法: ./migrate_export.sh
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 导出文件命名
DATE_STAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_NAME="lexiflow_migrate_${DATE_STAMP}"
EXPORT_DIR="/tmp/${EXPORT_NAME}"
EXPORT_FILE="${SCRIPT_DIR}/${EXPORT_NAME}.tar.gz"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     📦 LexiFlow 一键导出工具             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# 1. 创建临时导出目录结构
# ============================================================
echo -e "${BLUE}[1/5]${NC} 🗂️  创建导出目录结构..."
mkdir -p "${EXPORT_DIR}/env_backup"
mkdir -p "${EXPORT_DIR}/user_data"
mkdir -p "${EXPORT_DIR}/input_docs"
echo -e "  ${GREEN}✓${NC} 目录结构已创建"

# ============================================================
# 2. 导出环境配置
# ============================================================
echo -e "${BLUE}[2/5]${NC} 🔑 导出环境配置..."
ENV_COUNT=0
if [ -f "${SCRIPT_DIR}/backend/.env" ]; then
    cp "${SCRIPT_DIR}/backend/.env" "${EXPORT_DIR}/env_backup/.env"
    ENV_COUNT=$((ENV_COUNT + 1))
    echo -e "  ${GREEN}✓${NC} backend/.env"
else
    echo -e "  ${YELLOW}⚠${NC} backend/.env 不存在，跳过"
fi
echo -e "  ${GREEN}✓${NC} 环境配置导出完成 (${ENV_COUNT} 个文件)"

# ============================================================
# 3. 导出用户数据
# ============================================================
echo -e "${BLUE}[3/5]${NC} 📊 导出用户数据..."
DATA_DIR="${SCRIPT_DIR}/backend/data"
DATA_COUNT=0

# 导出 JSON 数据文件
for json_file in history.json wordbooks.json shares.json; do
    if [ -f "${DATA_DIR}/${json_file}" ]; then
        cp "${DATA_DIR}/${json_file}" "${EXPORT_DIR}/user_data/${json_file}"
        SIZE=$(du -h "${DATA_DIR}/${json_file}" | cut -f1 | xargs)
        echo -e "  ${GREEN}✓${NC} ${json_file} (${SIZE})"
        DATA_COUNT=$((DATA_COUNT + 1))
    else
        echo -e "  ${YELLOW}⚠${NC} ${json_file} 不存在，跳过"
    fi
done

# 导出输入文档
INPUT_COUNT=0
if [ -d "${SCRIPT_DIR}/InputDocs" ]; then
    for doc_file in "${SCRIPT_DIR}/InputDocs"/*; do
        if [ -f "$doc_file" ] && [ "$(basename "$doc_file")" != ".DS_Store" ]; then
            cp "$doc_file" "${EXPORT_DIR}/input_docs/"
            INPUT_COUNT=$((INPUT_COUNT + 1))
        fi
    done
fi
echo -e "  ${GREEN}✓${NC} 输入文档: ${INPUT_COUNT} 个文件"

DATA_COUNT=$((DATA_COUNT + INPUT_COUNT))
echo -e "  ${GREEN}✓${NC} 用户数据导出完成 (共 ${DATA_COUNT} 个文件)"
echo -e "  ${YELLOW}ℹ${NC}  音频缓存和输出音频可重新生成，已跳过"

# ============================================================
# 4. 生成元信息
# ============================================================
echo -e "${BLUE}[4/5]${NC} 📝 生成元信息..."

# 获取 Git 信息
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
GIT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "unknown")
HOSTNAME=$(hostname)
OS_VERSION=$(sw_vers -productVersion 2>/dev/null || echo "unknown")

cat > "${EXPORT_DIR}/metadata.json" << EOF
{
    "export_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "export_time_local": "$(date +%Y-%m-%dT%H:%M:%S%z)",
    "source_machine": "${HOSTNAME}",
    "os_version": "macOS ${OS_VERSION}",
    "project_path": "${SCRIPT_DIR}",
    "git_remote": "${GIT_REMOTE}",
    "git_branch": "${GIT_BRANCH}",
    "git_commit": "${GIT_COMMIT}",
    "files": {
        "env_files": ${ENV_COUNT},
        "data_json_files": $((DATA_COUNT - INPUT_COUNT)),
        "input_doc_files": ${INPUT_COUNT},
        "total_files": ${DATA_COUNT}
    },
    "python_version": "$(python3 --version 2>/dev/null | awk '{print $2}' || echo 'unknown')",
    "node_version": "$(node --version 2>/dev/null || echo 'unknown')"
}
EOF
echo -e "  ${GREEN}✓${NC} metadata.json 已生成"

# ============================================================
# 5. 打包压缩
# ============================================================
echo -e "${BLUE}[5/5]${NC} 📦 打包压缩..."
cd /tmp
tar -czf "${EXPORT_FILE}" "${EXPORT_NAME}"
cd "$SCRIPT_DIR"

# 清理临时文件
rm -rf "${EXPORT_DIR}"

# 获取包大小
PACK_SIZE=$(du -h "${EXPORT_FILE}" | cut -f1 | xargs)

echo -e "  ${GREEN}✓${NC} 打包完成"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            ✅ 导出成功！                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  📁 导出文件: ${CYAN}${EXPORT_FILE}${NC}"
echo -e "  📏 文件大小: ${CYAN}${PACK_SIZE}${NC}"
echo ""
echo -e "${YELLOW}📋 下一步操作:${NC}"
echo -e "  1. 将导出文件传输到新电脑（AirDrop / USB / 云盘）"
echo -e "  2. 在新电脑上执行:"
echo -e "     ${CYAN}git clone ${GIT_REMOTE}${NC}"
echo -e "     ${CYAN}cd LexiFlow${NC}"
echo -e "     ${CYAN}./migrate_import.sh /path/to/${EXPORT_NAME}.tar.gz${NC}"
echo ""
