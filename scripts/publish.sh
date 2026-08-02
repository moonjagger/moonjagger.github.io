#!/usr/bin/env bash
# 用法: bash scripts/publish.sh "提交说明"
# 提交全部改动并推送 main（自动用本地 access_token.txt 认证），
# push 后 GitHub Actions 自动部署到 GitHub Pages 和 Cloudflare Pages
set -e

cd "$(dirname "$0")/.."

MSG="${1:-$(date +%Y-%m-%d) 发布文章}"

# 检查是否有改动
if [ -z "$(git status --porcelain)" ]; then
  echo "没有待提交的改动"
  exit 0
fi

git add -A
git commit -m "$MSG"

TOKEN_FILE="../access_token.txt"
if [ -f "$TOKEN_FILE" ]; then
  TOKEN=$(grep -oE 'github_pat_[A-Za-z0-9_]+' "$TOKEN_FILE" | head -1 || true)
fi

if [ -n "$TOKEN" ]; then
  git push "https://oauth2:$TOKEN@github.com/moonjagger/moonjagger.github.io.git" main
else
  git push origin main
fi

echo ""
echo "✅ 已推送。GitHub Actions 正在自动部署："
echo "   - GitHub Pages: https://moonjagger.github.io/"
echo "   - Cloudflare  : https://moonjagger-blog.pages.dev/  (以及 littlefun.cc)"
echo "   约 2-3 分钟后生效"
