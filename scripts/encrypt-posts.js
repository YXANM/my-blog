// scripts/encrypt-posts.js
// 构建前运行：读取 src/content/private-src/ 里的明文 markdown，
// 渲染成 HTML → AES-GCM 加密 → 输出到 src/content/posts/<同名>.md。
//
// 设计要点：
// 1. 明文源码只存在于 private-src（已被 .gitignore 排除），不会进仓库；
// 2. posts 里只有密文，可以安全提交，CI 上没有 private-src 时也能正常构建；
// 3. private-src 不存在（如在 CI / 新机器）时直接跳过，保留已提交的密文产物；
// 4. 源文件被删除时，同步清理 posts 中对应的密文，避免内容残留泄露。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '../src/content/private-src');
const OUT_DIR = path.join(__dirname, '../src/content/posts');

// 渲染器（GFM + task list，与 Astro 的 remark 渲染风格对齐）
const md = new MarkdownIt({ html: true, linkify: true }).use(taskLists);

// AES-GCM 参数（与前端 PasswordProtection.astro 一致）
const ALGO = 'AES-GCM';
const KEY_LEN = 256;
const IV_LEN = 12;
const SALT_LEN = 16;
const ITERATIONS = 100000;

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return webcrypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGO, length: KEY_LEN },
    false,
    ['encrypt']
  );
}

async function encryptText(plainText, password) {
  const enc = new TextEncoder();
  const salt = webcrypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = webcrypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt);

  const ciphertext = await webcrypto.subtle.encrypt(
    { name: ALGO, iv }, key, enc.encode(plainText)
  );

  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * 提取 frontmatter 里的 password（兼容 "xxx" / 'xxx' / xxx 三种写法）
 */
function extractPassword(frontmatter) {
  const m = frontmatter.match(/^password:\s*(.+)$/m);
  if (!m) return null;
  let v = m[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

/**
 * 确保输出的 frontmatter 带 encrypted: true（页面据此渲染密码门）
 */
function ensureEncryptedFlag(frontmatter) {
  if (/^encrypted:/m.test(frontmatter)) {
    return frontmatter.replace(/^encrypted:.*$/m, 'encrypted: true');
  }
  return `${frontmatter}\nencrypted: true`;
}

/**
 * 移除 password 行：密码只用于本地加密，绝不写进可提交的密文 frontmatter
 */
function stripPassword(frontmatter) {
  return frontmatter.replace(/^password:.*\n?/gm, '').trimEnd();
}

async function main() {
  // private-src 不存在 → CI / 新设备场景，保留 posts 里已提交的密文
  if (!fs.existsSync(SRC_DIR)) {
    console.log('📂 未找到 src/content/private-src，跳过加密（使用 posts 中已提交的密文）');
    return;
  }

  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.md'));
  // 源文件名 = 该文章密文产物的所有者；即使解析失败也不清理，避免误删
  const owned = new Set(files);

  for (const file of files) {
    // 统一换行为 LF（Windows 下编辑器常写成 CRLF）
    const raw = fs.readFileSync(path.join(SRC_DIR, file), 'utf-8').replace(/\r\n/g, '\n');
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!fmMatch) {
      console.warn(`⚠️  ${file} 缺少 frontmatter，跳过`);
      continue;
    }

    const frontmatter = fmMatch[1];
    const body = fmMatch[2].trim();
    if (!body) {
      console.warn(`⚠️  ${file} 正文为空，跳过`);
      continue;
    }

    const password = extractPassword(frontmatter) ?? process.env.BLOG_ENCRYPT_PASSWORD;
    if (!password) {
      console.warn(`⚠️  ${file} 未配置密码，跳过`);
      continue;
    }

    // ★ 渲染 markdown → HTML，再加密 HTML ★
    const html = md.render(body);
    const encryptedBase64 = await encryptText(html, password);

    // 输出用 frontmatter：带 encrypted: true，但剔除 password
    const outputFrontmatter = stripPassword(ensureEncryptedFlag(frontmatter));
    const output = `---\n${outputFrontmatter}\n---\n\n<!-- ENCRYPTED -->\n${encryptedBase64}\n`;
    fs.writeFileSync(path.join(OUT_DIR, file), output, 'utf-8');
    console.log(`🔒 已加密: private-src/${file} → posts/${file}`);
  }

  // 清理：源目录仍有文章，但 posts 里存在已无源文件的旧密文 → 删除
  if (owned.size === 0) return;
  for (const f of fs.readdirSync(OUT_DIR).filter((x) => x.endsWith('.md'))) {
    if (owned.has(f)) continue;
    const p = path.join(OUT_DIR, f);
    if (!fs.readFileSync(p, 'utf-8').includes('<!-- ENCRYPTED -->')) continue;
    fs.unlinkSync(p);
    console.log(`源文件已移除，删除旧密文: posts/${f}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
