#!/bin/bash

# LexiFlow 服务管理脚本
# 用法: ./start.sh [选项]
#   无参数    - 启动服务
#   -restart  - 重启服务
#   -stop     - 停止服务

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# PID 文件路径
PID_DIR="$SCRIPT_DIR/.pids"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

# 创建 PID 目录
mkdir -p "$PID_DIR"

# 显示帮助信息
show_help() {
    echo "LexiFlow 服务管理脚本"
    echo ""
    echo "用法: ./start.sh [选项]"
    echo ""
    echo "选项:"
    echo "  (无参数)    启动前端和后端服务"
    echo "  -restart    重启所有服务"
    echo "  -stop       停止所有服务"
    echo "  -status     查看服务状态"
    echo "  -help       显示此帮助信息"
}

# 停止服务函数
stop_services() {
    echo "🛑 正在停止 LexiFlow 服务..."
    
    local stopped=false
    
    # 停止后端
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID 2>/dev/null || true
            echo "   ✅ 后端服务已停止 (PID: $BACKEND_PID)"
            stopped=true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # 停止前端
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID 2>/dev/null || true
            echo "   ✅ 前端服务已停止 (PID: $FRONTEND_PID)"
            stopped=true
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # 额外清理：查找并停止可能的残留进程
    pkill -f "uvicorn main:app" 2>/dev/null || true
    pkill -f "vite.*--host" 2>/dev/null || true
    
    if [ "$stopped" = true ]; then
        echo "✅ 所有服务已停止"
    else
        echo "ℹ️  没有运行中的服务"
    fi
}

# 启动服务函数
start_services() {
    echo "🚀 启动 LexiFlow 服务..."
    echo "================================"
    
    # 检查是否已有服务在运行
    if [ -f "$BACKEND_PID_FILE" ] && kill -0 $(cat "$BACKEND_PID_FILE") 2>/dev/null; then
        echo "⚠️  后端服务已在运行中"
    else
        # 启动后端服务
        echo "📦 启动后端服务 (FastAPI)..."
        cd "$SCRIPT_DIR/backend"
        python main.py &
        BACKEND_PID=$!
        echo $BACKEND_PID > "$BACKEND_PID_FILE"
        echo "   后端 PID: $BACKEND_PID"
        echo "   后端地址: http://localhost:8000"
    fi
    
    # 等待后端启动
    sleep 2
    
    if [ -f "$FRONTEND_PID_FILE" ] && kill -0 $(cat "$FRONTEND_PID_FILE") 2>/dev/null; then
        echo "⚠️  前端服务已在运行中"
    else
        # 启动前端服务
        echo "🎨 启动前端服务 (Vite)..."
        cd "$SCRIPT_DIR/frontend"
        npm run dev &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
        echo "   前端 PID: $FRONTEND_PID"
        echo "   前端地址: http://localhost:5173"
    fi
    
    echo ""
    echo "================================"
    echo "✅ LexiFlow 服务启动完成！"
    echo ""
    echo "📍 访问地址:"
    echo "   前端: http://localhost:5173"
    echo "   后端 API: http://localhost:8000"
    echo "   API 文档: http://localhost:8000/docs"
    echo ""
    echo "💡 提示:"
    echo "   停止服务: ./start.sh -stop"
    echo "   重启服务: ./start.sh -restart"
    echo "   查看状态: ./start.sh -status"
    echo "================================"
}

# 查看服务状态
check_status() {
    echo "📊 LexiFlow 服务状态"
    echo "================================"
    
    # 检查后端
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo "📦 后端: ✅ 运行中 (PID: $BACKEND_PID)"
            echo "   地址: http://localhost:8000"
        else
            echo "📦 后端: ❌ 已停止"
            rm -f "$BACKEND_PID_FILE"
        fi
    else
        echo "📦 后端: ❌ 未启动"
    fi
    
    # 检查前端
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo "🎨 前端: ✅ 运行中 (PID: $FRONTEND_PID)"
            echo "   地址: http://localhost:5173"
        else
            echo "🎨 前端: ❌ 已停止"
            rm -f "$FRONTEND_PID_FILE"
        fi
    else
        echo "🎨 前端: ❌ 未启动"
    fi
    
    echo "================================"
}

# 定义清理函数 (用于前台运行时的 Ctrl+C)
cleanup() {
    echo ""
    stop_services
    exit 0
}

# 主逻辑
case "$1" in
    -stop)
        stop_services
        ;;
    -restart)
        echo "🔄 重启 LexiFlow 服务..."
        stop_services
        sleep 2
        start_services
        # 设置信号处理
        trap cleanup SIGINT SIGTERM
        # 等待子进程
        wait
        ;;
    -status)
        check_status
        ;;
    -help|--help|-h)
        show_help
        ;;
    "")
        start_services
        # 设置信号处理
        trap cleanup SIGINT SIGTERM
        # 等待子进程
        wait
        ;;
    *)
        echo "❌ 未知选项: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
