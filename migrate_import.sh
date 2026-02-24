#!/bin/bash

# ============================================================
# LexiFlow 一键导入脚本
# 从导出包还原用户数据、环境配置、音频文件，并安装依赖
# 用法: ./migrate_import.sh <导出包路径>
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

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     📥 LexiFlow 一键导入工具             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# 0. 参数检查
# ============================================================
if [ -z "$1" ]; then
    echo -e "${RED}❌ 错误: 请指定导出包路径${NC}"
    echo ""
    echo -e "用法: ${CYAN}./migrate_import.sh <导出包路径>${NC}"
    echo -e "示例: ${CYAN}./migrate_import.sh ~/Downloads/lexiflow_migrate_20260224_143000.tar.gz${NC}"
    exit 1
fi

IMPORT_FILE="$1"

if [ ! -f "$IMPORT_FILE" ]; then
    echo -e "${RED}❌ 错误: 文件不存在 - ${IMPORT_FILE}${NC}"
    exit 1
fi

# ============================================================
# 1. 检查系统依赖
# ============================================================
echo -e "${BLUE}[1/7]${NC} 🔍 检查系统依赖..."

DEPS_OK=true

# 检查 Python
if command -v python3 &> /dev/null; then
    PY_VER=$(python3 --version 2>&1 | awk '{print $2}')
    PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
    PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
    if [ "$PY_MAJOR" -ge 3 ] && [ "$PY_MINOR" -ge 9 ]; then
        echo -e "  ${GREEN}✓${NC} Python ${PY_VER}"
    else
        echo -e "  ${RED}✗${NC} Python ${PY_VER} (需要 3.9+)"
        DEPS_OK=false
    fi
else
    echo -e "  ${RED}✗${NC} Python 未安装"
    DEPS_OK=false
fi

# 检查 Node.js
if command -v node &> /dev/null; then
    NODE_VER=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo -e "  ${GREEN}✓${NC} Node.js v${NODE_VER}"
    else
        echo -e "  ${RED}✗${NC} Node.js v${NODE_VER} (需要 18+)"
        DEPS_OK=false
    fi
else
    echo -e "  ${RED}✗${NC} Node.js 未安装"
    DEPS_OK=false
fi

# 检查 npm
if command -v npm &> /dev/null; then
    NPM_VER=$(npm --version)
    echo -e "  ${GREEN}✓${NC} npm v${NPM_VER}"
else
    echo -e "  ${RED}✗${NC} npm 未安装"
    DEPS_OK=false
fi

# 检查 FFmpeg
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VER=$(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')
    echo -e "  ${GREEN}✓${NC} FFmpeg ${FFMPEG_VER}"
else
    echo -e "  ${YELLOW}⚠${NC} FFmpeg 未安装 (音频处理需要)"
    echo -e "    安装方法: ${CYAN}brew install ffmpeg${NC}"
    DEPS_OK=false
fi

if [ "$DEPS_OK" = false ]; then
    echo ""
    echo -e "${RED}❌ 依赖检查未通过，请先安装缺少的依赖后重试${NC}"
    echo -e "  推荐安装方式:"
    echo -e "    Python:  ${CYAN}brew install python@3.12${NC}"
    echo -e "    Node.js: ${CYAN}brew install node${NC}"
    echo -e "    FFmpeg:  ${CYAN}brew install ffmpeg${NC}"
    exit 1
fi

echo -e "  ${GREEN}✓${NC} 所有依赖检查通过"

# ============================================================
# 2. 解压导出包
# ============================================================
echo -e "${BLUE}[2/7]${NC} 📦 解压导出包..."

TEMP_DIR="/tmp/lexiflow_import_$$"
mkdir -p "$TEMP_DIR"
tar -xzf "$IMPORT_FILE" -C "$TEMP_DIR"

# 找到解压后的目录（可能名称不同）
EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "lexiflow_migrate_*" | head -1)

if [ -z "$EXTRACTED_DIR" ]; then
    echo -e "${RED}❌ 错误: 无法识别导出包结构${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 显示元信息
if [ -f "${EXTRACTED_DIR}/metadata.json" ]; then
    echo -e "  ${GREEN}✓${NC} 导出包解压成功"
    EXPORT_TIME=$(python3 -c "import json; d=json.load(open('${EXTRACTED_DIR}/metadata.json')); print(d.get('export_time_local','unknown'))" 2>/dev/null || echo "unknown")
    SOURCE_MACHINE=$(python3 -c "import json; d=json.load(open('${EXTRACTED_DIR}/metadata.json')); print(d.get('source_machine','unknown'))" 2>/dev/null || echo "unknown")
    GIT_COMMIT=$(python3 -c "import json; d=json.load(open('${EXTRACTED_DIR}/metadata.json')); print(d.get('git_commit','unknown'))" 2>/dev/null || echo "unknown")
    echo -e "  📅 导出时间:   ${CYAN}${EXPORT_TIME}${NC}"
    echo -e "  💻 源机器:     ${CYAN}${SOURCE_MACHINE}${NC}"
    echo -e "  🔖 Git Commit: ${CYAN}${GIT_COMMIT}${NC}"
else
    echo -e "  ${YELLOW}⚠${NC} 未找到 metadata.json，继续导入"
fi

# ============================================================
# 3. 还原环境配置
# ============================================================
echo -e "${BLUE}[3/7]${NC} 🔑 还原环境配置..."

if [ -f "${EXTRACTED_DIR}/env_backup/.env" ]; then
    if [ -f "${SCRIPT_DIR}/backend/.env" ]; then
        echo -e "  ${YELLOW}⚠${NC} backend/.env 已存在"
        read -p "    是否覆盖？(y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp "${EXTRACTED_DIR}/env_backup/.env" "${SCRIPT_DIR}/backend/.env"
            echo -e "  ${GREEN}✓${NC} backend/.env 已覆盖"
        else
            echo -e "  ${YELLOW}⚠${NC} 跳过 .env，保留现有文件"
        fi
    else
        cp "${EXTRACTED_DIR}/env_backup/.env" "${SCRIPT_DIR}/backend/.env"
        echo -e "  ${GREEN}✓${NC} backend/.env 已还原"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} 导出包中无 .env 文件"
fi

# ============================================================
# 4. 还原用户数据
# ============================================================
echo -e "${BLUE}[4/7]${NC} 📊 还原用户数据..."

# 确保数据目录存在
mkdir -p "${SCRIPT_DIR}/backend/data"

# 检查是否有已有数据
HAS_EXISTING_DATA=false
for json_file in history.json wordbooks.json shares.json; do
    if [ -f "${SCRIPT_DIR}/backend/data/${json_file}" ]; then
        HAS_EXISTING_DATA=true
        break
    fi
done

if [ "$HAS_EXISTING_DATA" = true ]; then
    echo -e "  ${YELLOW}⚠${NC} 检测到已有用户数据"
    read -p "    是否覆盖所有用户数据？(y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "  ${YELLOW}⚠${NC} 跳过用户数据还原"
        SKIP_DATA=true
    fi
fi

if [ "${SKIP_DATA}" != "true" ]; then
    RESTORED_COUNT=0

    # 还原 JSON 数据
    for json_file in history.json wordbooks.json shares.json; do
        if [ -f "${EXTRACTED_DIR}/user_data/${json_file}" ]; then
            cp "${EXTRACTED_DIR}/user_data/${json_file}" "${SCRIPT_DIR}/backend/data/${json_file}"
            echo -e "  ${GREEN}✓${NC} ${json_file}"
            RESTORED_COUNT=$((RESTORED_COUNT + 1))
        fi
    done

    # 还原输入文档
    INPUT_RESTORED=0
    mkdir -p "${SCRIPT_DIR}/InputDocs"
    if [ -d "${EXTRACTED_DIR}/input_docs" ]; then
        for doc_file in "${EXTRACTED_DIR}/input_docs"/*; do
            if [ -f "$doc_file" ]; then
                cp "$doc_file" "${SCRIPT_DIR}/InputDocs/"
                INPUT_RESTORED=$((INPUT_RESTORED + 1))
            fi
        done
    fi
    echo -e "  ${GREEN}✓${NC} 输入文档: ${INPUT_RESTORED} 个文件"

    TOTAL_RESTORED=$((RESTORED_COUNT + INPUT_RESTORED))
    echo -e "  ${GREEN}✓${NC} 用户数据还原完成 (共 ${TOTAL_RESTORED} 个文件)"
    echo -e "  ${YELLOW}ℹ${NC}  音频缓存和输出音频可在使用时重新生成"
fi

# ============================================================
# 5. 安装后端依赖 (使用 venv)
# ============================================================
echo -e "${BLUE}[5/7]${NC} 🐍 安装后端依赖..."

cd "${SCRIPT_DIR}/backend"

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo -e "  📦 创建 Python 虚拟环境..."
    python3 -m venv venv
    echo -e "  ${GREEN}✓${NC} 虚拟环境已创建"
fi

# 激活虚拟环境并安装依赖
source venv/bin/activate
echo -e "  📦 安装 Python 依赖..."
pip install -r requirements.txt --quiet 2>&1 | tail -1
echo -e "  ${GREEN}✓${NC} 后端依赖安装完成"
deactivate

# ============================================================
# 6. 安装前端依赖
# ============================================================
echo -e "${BLUE}[6/7]${NC} 🎨 安装前端依赖..."

cd "${SCRIPT_DIR}/frontend"
echo -e "  📦 安装 Node.js 依赖..."
npm install --silent 2>&1 | tail -3
echo -e "  ${GREEN}✓${NC} 前端依赖安装完成"

# ============================================================
# 7. 验证还原完整性
# ============================================================
echo -e "${BLUE}[7/7]${NC} ✅ 验证还原完整性..."

cd "$SCRIPT_DIR"
VERIFY_OK=true

# 检查关键文件
declare -a CHECK_FILES=(
    "backend/.env:环境配置"
    "backend/requirements.txt:后端依赖清单"
    "frontend/package.json:前端依赖清单"
    "frontend/node_modules/.package-lock.json:前端依赖安装"
    "start.sh:启动脚本"
)

for item in "${CHECK_FILES[@]}"; do
    FILE_PATH=$(echo "$item" | cut -d: -f1)
    FILE_DESC=$(echo "$item" | cut -d: -f2)
    if [ -f "$FILE_PATH" ]; then
        echo -e "  ${GREEN}✓${NC} ${FILE_DESC}"
    else
        echo -e "  ${RED}✗${NC} ${FILE_DESC} (${FILE_PATH})"
        VERIFY_OK=false
    fi
done

# 与元信息对比
if [ -f "${EXTRACTED_DIR}/metadata.json" ] && [ "${SKIP_DATA}" != "true" ]; then
    EXPECTED_TOTAL=$(python3 -c "import json; d=json.load(open('${EXTRACTED_DIR}/metadata.json')); print(d.get('files',{}).get('total_files',0))" 2>/dev/null || echo "0")
    echo -e "  📊 元信息中记录的文件总数: ${EXPECTED_TOTAL}, 已还原: ${TOTAL_RESTORED:-0}"
fi

# 清理临时文件
rm -rf "$TEMP_DIR"

echo ""
if [ "$VERIFY_OK" = true ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║            ✅ 导入成功！                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${YELLOW}📋 启动服务:${NC}"
    echo -e "     ${CYAN}./start.sh${NC}"
    echo ""
    echo -e "  ${YELLOW}📍 访问地址:${NC}"
    echo -e "     前端: ${CYAN}http://localhost:5173${NC}"
    echo -e "     后端: ${CYAN}http://localhost:8000${NC}"
    echo ""
    echo -e "  ${YELLOW}💡 注意事项:${NC}"
    echo -e "     • 如果使用了 venv，请先激活: ${CYAN}source backend/venv/bin/activate${NC}"
    echo -e "     • 或修改 start.sh 中的 python 路径为 venv 中的 python"
else
    echo -e "${RED}╔══════════════════════════════════════════╗${NC}"
    echo -e "${RED}║         ⚠️  导入完成但有警告              ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  请检查上方标记为 ${RED}✗${NC} 的项目"
fi
echo ""
