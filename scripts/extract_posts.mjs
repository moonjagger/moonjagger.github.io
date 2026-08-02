// 从 local-search.xml 无损还原 4 篇文章为 AstroPaper Markdown
import fs from "node:fs";
import path from "node:path";
import TurndownService from "turndown";

const REPO = "/home/larry/moonblog/moonjagger.github.io";
const OUT = "/tmp/extract/out";
const xml = fs.readFileSync(path.join(REPO, "local-search.xml"), "utf8");

// ---------- 解析 local-search.xml entries ----------
const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => m[1]);

const getTag = (block, re) => {
  const m = block.match(re);
  return m ? m[1] : null;
};
const getAllTags = (block, re) =>
  [...block.matchAll(re)].map(m => m[1]);

const posts = entries.map(block => ({
  title: getTag(block, /<title>([^<]*)<\/title>/),
  url: decodeURIComponent(getTag(block, /<url>([^<]*)<\/url>/) ?? ""),
  categories: getAllTags(block, /<category>([^<]*)<\/category>/g),
  tags: getAllTags(block, /<tag>([^<]*)<\/tag>/g),
  content: getTag(block, /<content type="html"><!\[CDATA\[([\s\S]*?)\]\]><\/content>/),
}));

// ---------- 从渲染页提取 日期 / 描述 ----------
// 手动打磨的 description（全部摘自原文，无改写）
const DESC_OVERRIDE = {
  "Hello World":
    "大家好，如果有幸您能看到我这个网页，真的是很有缘分！建立这个网站的初衷是能够对工作中学习到的知识，生活中的见识、感动，做一些分享。希望能在这个数字化AI的时代做一些信息留存。",
  "成长记录-过往（高中-大学-工作）日志汇总":
    "本篇文章主要汇总从高中到大学毕业阶段在QQ空间写作的日志，记录一下~",
};
for (const p of posts) {
  const htmlFile = path.join(REPO, p.url, "index.html");
  const html = fs.readFileSync(htmlFile, "utf8");
  const timeM = html.match(/<time datetime="([^"]+)"/);
  const descM = html.match(/name="description" content="([^"]*)"/);
  p.pubDatetime = timeM ? timeM[1] : null;
  let desc = DESC_OVERRIDE[p.title] ?? (descM ? descM[1] : "");
  if (!DESC_OVERRIDE[p.title]) {
    // 去掉开头的标题前缀，压缩空白，截 150 字
    desc = desc
      .replace(new RegExp("^" + p.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "")
      .trim();
    desc = desc.replace(/\s+/g, " ").slice(0, 150);
  }
  p.description = desc;
  p.html = html;
}

// ---------- HTML 预处理 ----------
function preprocess(html) {
  let h = html;
  // 剥离 headerlink 锚点 <a href="#..." class="headerlink" title="..."></a>
  h = h.replace(/<a[^>]*class="headerlink"[^>]*>\s*<\/a>/g, "");
  // 代码块语言: hljs 类 → language-text（turndown 据此输出 ```text）
  h = h.replace(/<code class="hljs">/g, '<code class="language-text">');
  return h;
}

// ---------- turndown 配置 ----------
const td = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
});
// <br> → Markdown 硬换行（行尾两空格）
td.addRule("lineBreak", {
  filter: "br",
  replacement: () => "  \n",
});

// ---------- YAML 转义 ----------
const yamlStr = s =>
  /[:#\[\]{}&*!|>'"%@`]/.test(s) || /^\s|\s$/.test(s)
    ? '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'
    : s;
const yamlList = arr => "[" + arr.map(yamlStr).join(", ") + "]";

// ---------- 生成 front-matter + 正文 ----------
// 文件名取自原 URL 路径（保留 URL 兼容），标题保留原站标题
const outFiles = [];
for (const p of posts) {
  const segs = p.url.split("/").filter(Boolean); // ["2024","08","26","CPU基础知识"]
  if (segs.length !== 4) throw new Error("URL 结构异常: " + p.url);
  const dateDir = segs.slice(0, 3).join("/");
  const fileName = segs[3];

  const fm = [
    "---",
    "title: " + yamlStr(p.title),
    "pubDatetime: " + yamlStr(p.pubDatetime + ":00"),
    "description: " + yamlStr(p.description),
  ];
  if (p.tags.length) fm.push("tags: " + yamlList(p.tags));
  if (p.categories.length) fm.push("categories: " + yamlList(p.categories));
  fm.push("---", "");

  const body = td.turndown(preprocess(p.content)).trim() + "\n";
  // 清理：空行前的尾随空格、纯缩进空行（列表项 p 结尾产生的噪音）
  const cleaned = body
    .replace(/  \n\n/g, "\n\n")
    .replace(/^ {2,}\n/gm, "\n");
  const md = fm.join("\n") + cleaned;

  const outPath = path.join(OUT, "src/content/posts", dateDir, fileName + ".md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, md, "utf8");
  outFiles.push({ p, outPath, md });
}

// ---------- 校对统计 ----------
const stats = (html, md) => {
  const strip = s => s.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ");
  const body = md.split("---\n")[2] ?? md;
  const mdBlocks = body.split(/\n\n+/).filter(b => b.trim() !== "");
  return {
    htmlP: (html.match(/<p[ >]/g) || []).length,
    mdP: mdBlocks.length,
    htmlImg: (html.match(/<img /g) || []).length,
    mdImg: (md.match(/!\[/g) || []).length,
    htmlPre: (html.match(/<pre>/g) || []).length,
    mdCode: (md.match(/^```/gm) || []).length / 2,
    htmlLink: (html.match(/<a [^>]*href="http/g) || []).length,
    mdLink: (md.match(/\]\(http/g) || []).length,
    htmlChar: strip(html).replace(/\s+/g, "").length,
    mdChar: body.replace(/[#*`>\-\[\]()!|]/g, "").replace(/\s+/g, "").length,
    htmlBr: (html.match(/<br\s*\/?>/g) || []).length,
    mdHardBr: (body.match(/  \n/g) || []).length,
  };
};

console.log("=== 提取完成 ===");
for (const { p, outPath, md } of outFiles) {
  const s = stats(p.content, md);
  console.log(`\n【${p.title}】`);
  console.log(`  输出: ${outPath}`);
  console.log(`  front-matter: 时间=${p.pubDatetime} 分类=[${p.categories}] 标签=[${p.tags}]`);
  console.log(`  描述: ${p.description.slice(0, 50)}...`);
  console.log(`  校对: 段落 ${s.htmlP}/${s.mdP} | 图片 ${s.htmlImg}/${s.mdImg} | 代码块 ${s.htmlPre}/${s.mdCode} | 外链 ${s.htmlLink}/${s.mdLink} | 字数 ${s.htmlChar}/${s.mdChar} | <br> ${s.htmlBr}/${s.mdHardBr}`);
}
