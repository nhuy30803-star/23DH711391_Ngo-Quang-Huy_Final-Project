#!/usr/bin/env node
/**
 * generate-icon.js
 * Generates icon.png (48x48) for Smart Dictionary & Translator.
 * Writes a valid PNG file using only Node.js built-in modules (zlib + fs).
 *
 * Usage:  node generate-icon.js
 * Output: icon.png  (48x48, RGBA)
 */

const fs   = require('fs');
const zlib = require('zlib');
const path = require('path');

const W = 48, H = 48;

/* ---- colour helpers ---- */
function rgba(r, g, b, a) { return [r, g, b, a]; }
const BG       = rgba(74, 144, 217, 255);   // #4a90d9  circle
const BOOK     = rgba(255, 255, 255, 242);  // white ~95%
const LINE     = rgba(74, 144, 217, 255);   // #4a90d9  lines
const SPINE    = rgba(74, 144, 217, 76);    // 30% opacity spine
const TRANS    = rgba(0, 0, 0, 0);

/* ---- circle test ---- */
function inCircle(x, y, cx, cy, r) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2;
}

/* ---- simple book shape (approximate filled region) ---- */
function inBook(x, y) {
  // Simplified book shape: rounded rectangle
  const left = 12, right = 36, top = 9, bottom = 37;
  const curveIndent = 2;
  // Main body
  if (x < left || x > right || y < top || y > bottom) return false;
  // Top curve area — skip the top corners slightly
  if (y <= top + 2) {
    if (x < left + curveIndent || x > right - curveIndent) return false;
  }
  // Bottom curve area — taper inward
  if (y >= bottom - 1) {
    if (x < left + 1 || x > right - 1) return false;
  }
  return true;
}

/* ---- line helpers ---- */
function onLine(x, y, x1, y1, x2, y2, thickness) {
  // Horizontal line
  if (y1 === y2) {
    return y >= y1 - thickness && y <= y1 + thickness && x >= x1 && x <= x2;
  }
  // Vertical line
  if (x1 === x2) {
    return x >= x1 - thickness && x <= x1 + thickness && y >= y1 && y <= y2;
  }
  return false;
}

/* ---- build pixel buffer ---- */
const pixels = Buffer.alloc(W * H * 4);

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    let color = TRANS;

    if (inCircle(x, y, 24, 24, 21)) {
      color = BG;
    }

    if (inBook(x, y) && inCircle(x, y, 24, 24, 21)) {
      color = BOOK;
    }

    // Text lines on book
    if ((onLine(x, y, 16, 16, 32, 16, 1) ||
         onLine(x, y, 16, 20, 32, 20, 1) ||
         onLine(x, y, 16, 24, 26, 24, 1)) && inBook(x, y)) {
      color = LINE;
    }

    // Spine
    if (onLine(x, y, 24, 9, 24, 36, 0) && inBook(x, y)) {
      color = SPINE;
    }

    pixels[i]     = color[0];
    pixels[i + 1] = color[1];
    pixels[i + 2] = color[2];
    pixels[i + 3] = color[3];
  }
}

/* ---- build PNG ---- */
function buildPng(width, height, rgbaData) {
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crcData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData));
    return Buffer.concat([len, Buffer.from(type), data, crc]);
  }

  function crc32(buf) {
    let c = 0xffffffff;
    const table = crc32Table();
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function crc32Table() {
    if (crc32Table._cache) return crc32Table._cache;
    const t = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[n] = c >>> 0;
    }
    crc32Table._cache = t;
    return t;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT — deflate scanlines (each row prefixed with filter byte 0 = None)
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(width * 4 + 1);
    row[0] = 0; // filter: None
    rgbaData.copy(row, 1, y * width * 4, (y + 1) * width * 4);
    rows.push(row);
  }
  const scanlines = Buffer.concat(rows);
  const idatData = zlib.deflateSync(scanlines);

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', iend)
  ]);
}

const png = buildPng(W, H, pixels);
const out = path.join(__dirname, 'icon.png');
fs.writeFileSync(out, png);

// Verify file size
const stat = fs.statSync(out);
console.log(`✅ icon.png generated: ${stat.size} bytes (${W}x${H} RGBA PNG)`);
console.log(`   Location: ${out}`);
