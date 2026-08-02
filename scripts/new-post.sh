#!/usr/bin/env bash
# 用法: bash scripts/new-post.sh "文章标题"
# 在当前日期目录下生成带 front-matter 的 Markdown 文章模板
set -e

TITLE="${1:?用法: bash scripts/new-post.sh \"文章标题\"}"

# 生成 slug：全角标点转半角，非法字符转连字符，保留中文
SLUG=$(echo "$TITLE" \
  | sed 's/[（）]/()/g; s/：/:/g; s/，/,/g; s/。/./g' \
  | tr '[:upper:]' '[:lower:]' \
  | sed 's/[\/\\:*?"<>|]/-/g; s/  */ /g; s/ /-/g; s/--*/-/g; s/^-//; s/-$//')

YEAR=$(date +%Y)
MONTH=$(date +%m)
DAY=$(date +%d)
TIME=$(date +%H:%M)
DIR="src/content/posts/$YEAR/$MONTH/$DAY"
FILE="$DIR/$SLUG.md"

if [ -e "$FILE" ]; then
  echo "文件已存在: $FILE" >&2
  exit 1
fi

mkdir -p "$DIR"
cat > "$FILE" <<EOF
---
title: $TITLE
pubDatetime: ${YEAR}-${MONTH}-${DAY}T${TIME}:00+08:00
description: 文章摘要（150 字以内）
tags: []
categories: []
---

在这里开始写作...
EOF

echo "✅ 已创建: $FILE"
echo "   预览: npm run dev"
