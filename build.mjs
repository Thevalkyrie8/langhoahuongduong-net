import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { articles, categories } from './src/content.mjs';

const cfg = JSON.parse(readFileSync('site.config.json', 'utf8'));
const out = 'dist';
const base = `https://${cfg.domain}`;
const today = new Date().toISOString().slice(0, 10);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const hasNap = !!(cfg.address.street && cfg.phone);
rmSync(out, { recursive: true, force: true });
const write = (p, c) => { const f = join(out, p); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, c); };

const css = `:root{--g:#1f7a4d;--y:#f6b800;--bg:#fbfaf5;--t:#1d2b22;--m:#5a6b60;--l:#e6eadf}
*{box-sizing:border-box}body{margin:0;font:17px/1.7 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--t)}
a{color:var(--g)}header{background:#fff;border-bottom:1px solid var(--l)}
.w{max-width:860px;margin:0 auto;padding:0 20px}.bar{display:flex;gap:20px;align-items:center;justify-content:space-between;padding:14px 0;flex-wrap:wrap}
.logo{font-weight:800;color:var(--g);text-decoration:none;font-size:20px}nav a{margin-right:16px;text-decoration:none;font-weight:600}
h1{font-size:2rem;line-height:1.25;margin:28px 0 12px}h2{margin-top:32px}
.ans{background:#fff8e1;border-left:5px solid var(--y);padding:14px 18px;border-radius:8px;margin:18px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;padding:0;list-style:none}
.card{background:#fff;border:1px solid var(--l);border-radius:12px;padding:16px}.card a{font-weight:700;text-decoration:none}.tag{font-size:13px;color:var(--m)}
.cta{background:var(--g);color:#fff;border-radius:12px;padding:20px;margin:36px 0}.cta a{color:#ffe38a;font-weight:700}
details{background:#fff;border:1px solid var(--l);border-radius:8px;padding:10px 14px;margin:8px 0}summary{cursor:pointer;font-weight:600}
footer{border-top:1px solid var(--l);margin-top:40px;padding:24px 0;color:var(--m);font-size:15px}
.crumb{font-size:14px;color:var(--m);margin-top:16px}`;
write('style.css', css);

const org = { '@type': 'Organization', '@id': `${base}/#org`, name: cfg.brand, url: base, logo: `${base}/logo.svg`, sameAs: [cfg.shopUrl, cfg.shopUrlAlt, ...cfg.sameAs] };
if (cfg.email) org.email = cfg.email;
if (cfg.phone) org.telephone = cfg.phone;
const local = hasNap ? { '@type': 'Florist', '@id': `${base}/#local`, name: cfg.brand, url: base, telephone: cfg.phone, openingHours: 'Mo-Su 07:00-21:00',
  address: { '@type': 'PostalAddress', streetAddress: cfg.address.street, addressLocality: cfg.address.locality, addressRegion: cfg.address.region, addressCountry: 'VN' },
  ...(cfg.geo.lat && { geo: { '@type': 'GeoCoordinates', latitude: cfg.geo.lat, longitude: cfg.geo.lng } }), ...(cfg.mapUrl && { hasMap: cfg.mapUrl }) } : null;

const ga = cfg.gaId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${cfg.gaId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${cfg.gaId}')</script>` : '';

function page({ path, title, desc, body, graph = [], type = 'website', crumbs = [] }) {
  const url = `${base}${path}`;
  const bc = { '@type': 'BreadcrumbList', itemListElement: [{ name: 'Trang chủ', url: base + '/' }, ...crumbs.map((c) => ({ name: c[0], url: base + c[1] }))].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) };
  const ld = { '@context': 'https://schema.org', '@graph': [org, ...(local ? [local] : []), { '@type': 'WebSite', '@id': `${base}/#site`, url: base, name: `${cfg.brand} – Cẩm nang`, inLanguage: 'vi', publisher: { '@id': `${base}/#org` } }, bc, ...graph] };
  write(path + 'index.html', `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"><meta name="theme-color" content="#1f7a4d">
<meta property="og:type" content="${type}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="vi_VN"><meta property="og:site_name" content="${cfg.brand}"><meta property="og:image" content="${base}/og.svg">
<link rel="icon" href="/logo.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>${ga}</head><body>
<header><div class="w bar"><a class="logo" href="/">🌻 ${cfg.brand}</a><nav><a href="/cam-nang/">Cẩm nang</a><a href="/hoi-dap/">Hỏi đáp</a><a href="/gioi-thieu/">Giới thiệu</a><a href="/lien-he/">Liên hệ</a></nav></div></header>
<main class="w">${body}</main>
<footer><div class="w"><p><strong>${cfg.brand}</strong> · Mở cửa ${cfg.hours}.<br>Mua cây &amp; hoa: <a href="${cfg.shopUrl}">${cfg.shopUrl.replace('https://', '')}</a> · <a href="${cfg.shopUrlAlt}">${cfg.shopUrlAlt.replace('https://', '')}</a></p><p>© ${new Date().getFullYear()} ${cfg.brand}. Nội dung mang tính tham khảo.</p></div></footer></body></html>`);
}

const cta = `<div class="cta"><strong>Cần chọn cây hoặc hoa?</strong> Xem sản phẩm và đặt hàng tại <a href="${cfg.shopUrl}">${cfg.shopUrl.replace('https://', '')}</a> — shop tư vấn miễn phí, mở cửa ${cfg.hours}.</div>`;
const crumbHtml = (items) => `<div class="crumb"><a href="/">Trang chủ</a>${items.map((i) => ` › ${i[1] ? `<a href="${i[1]}">${i[0]}</a>` : i[0]}`).join('')}</div>`;
const card = (a) => `<li class="card"><span class="tag">${a.cat}</span><br><a href="/cam-nang/${a.slug}/">${a.title}</a><p>${a.desc}</p></li>`;

// Home
page({ path: '/', title: `${cfg.brand} – Cẩm nang cây cảnh, hoa tươi & quà tặng xanh`,
  desc: 'Cẩm nang chăm cây cảnh, giữ hoa tươi, chọn quà tặng và mùa hoa Đà Lạt – hướng dẫn dễ hiểu từ Làng Hoa Hướng Dương.',
  body: `<h1>Cẩm nang cây cảnh, hoa tươi và quà tặng xanh</h1><p>Hướng dẫn thực tế để chăm cây khỏe, giữ hoa lâu và chọn đúng món quà — từ đội ngũ ${cfg.brand}.</p>
<h2>Bài mới nhất</h2><ul class="grid">${articles.map(card).join('')}</ul>
<h2>Chủ đề</h2><p>${categories.map((c) => `<span class="tag">#${c}</span>`).join(' · ')}</p>${cta}` });

// Guide index
page({ path: '/cam-nang/', title: `Cẩm nang cây cảnh & hoa tươi | ${cfg.brand}`, desc: 'Tất cả hướng dẫn chăm cây, cắm hoa, chọn quà tặng và cẩm nang Đà Lạt.', crumbs: [['Cẩm nang', '/cam-nang/']],
  body: `${crumbHtml([['Cẩm nang']])}<h1>Cẩm nang cây cảnh &amp; hoa tươi</h1><ul class="grid">${articles.map(card).join('')}</ul>${cta}` });

// Articles
for (const a of articles) {
  const url = `${base}/cam-nang/${a.slug}/`;
  const related = articles.filter((x) => x.slug !== a.slug && x.cat === a.cat).concat(articles.filter((x) => x.slug !== a.slug && x.cat !== a.cat)).slice(0, 3);
  page({ path: `/cam-nang/${a.slug}/`, title: `${a.title} | ${cfg.brand}`, desc: a.desc, type: 'article', crumbs: [['Cẩm nang', '/cam-nang/'], [a.title, `/cam-nang/${a.slug}/`]],
    graph: [
      { '@type': 'Article', '@id': url + '#article', headline: a.title, description: a.desc, inLanguage: 'vi', datePublished: today, dateModified: today, mainEntityOfPage: url, image: `${base}/og.svg`, author: { '@id': `${base}/#org` }, publisher: { '@id': `${base}/#org` } },
      { '@type': 'FAQPage', mainEntity: a.faq.map(([q, an]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: an } })) }],
    body: `${crumbHtml([['Cẩm nang', '/cam-nang/'], [a.cat]])}<article><h1>${a.title}</h1><p class="tag">${a.cat} · Cập nhật ${today} · ${cfg.brand}</p>
<div class="ans"><strong>Trả lời nhanh:</strong> ${a.answer}</div>
${a.sections.map(([h, b]) => `<h2>${h}</h2>${b}`).join('')}
<h2>Câu hỏi thường gặp</h2>${a.faq.map(([q, an]) => `<details><summary>${q}</summary><p>${an}</p></details>`).join('')}</article>
${cta}<h2>Đọc thêm</h2><ul class="grid">${related.map(card).join('')}</ul>` });
}

// FAQ hub
const allFaq = articles.flatMap((a) => a.faq.map((f) => [...f, a]));
page({ path: '/hoi-dap/', title: `Hỏi đáp về cây cảnh, hoa tươi, quà tặng | ${cfg.brand}`, desc: 'Tổng hợp câu hỏi thường gặp về chăm cây, giữ hoa tươi, chọn hoa tặng và cây phong thủy – trả lời ngắn gọn, dễ hiểu.', crumbs: [['Hỏi đáp', '/hoi-dap/']],
  graph: [{ '@type': 'FAQPage', mainEntity: allFaq.map(([q, an]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: an } })) }],
  body: `${crumbHtml([['Hỏi đáp']])}<h1>Hỏi đáp về cây cảnh &amp; hoa tươi</h1>${allFaq.map(([q, an, a]) => `<details><summary>${q}</summary><p>${an} <a href="/cam-nang/${a.slug}/">Xem hướng dẫn chi tiết →</a></p></details>`).join('')}${cta}` });

// About
page({ path: '/gioi-thieu/', title: `Giới thiệu ${cfg.brand}`, desc: `${cfg.brand} – cây cảnh, hoa tươi và quà tặng xanh. Tìm hiểu cách chúng tôi biên soạn cẩm nang và tư vấn.`, crumbs: [['Giới thiệu', '/gioi-thieu/']],
  body: `${crumbHtml([['Giới thiệu']])}<h1>Giới thiệu ${cfg.brand}</h1><p>${cfg.brand} là thương hiệu cây cảnh, hoa tươi và quà tặng xanh, phục vụ nhà ở, văn phòng và các dịp đặc biệt. Website này là nơi chúng tôi chia sẻ kiến thức: cách chăm cây, giữ hoa tươi, chọn quà tặng và cẩm nang mùa hoa Đà Lạt.</p>
<h2>Nguyên tắc biên soạn</h2><ul><li>Trả lời thẳng vào câu hỏi, có số liệu và bước làm cụ thể.</li><li>Nói rõ khi nội dung là quan niệm văn hóa (như phong thủy) hay khoa học.</li><li>Cập nhật khi có thông tin mới.</li></ul>
<h2>Cửa hàng trực tuyến</h2><p>Để xem sản phẩm và đặt hàng, vào <a href="${cfg.shopUrl}">${cfg.shopUrl.replace('https://', '')}</a>. Giờ làm việc: ${cfg.hours}.</p>${cta}` });

// Contact
const napHtml = hasNap ? `<p><strong>Địa chỉ:</strong> ${cfg.address.street}, ${cfg.address.locality}, ${cfg.address.region}<br><strong>Điện thoại:</strong> <a href="tel:${cfg.phone}">${cfg.phone}</a>${cfg.email ? `<br><strong>Email:</strong> ${cfg.email}` : ''}<br><strong>Giờ mở cửa:</strong> ${cfg.hours}</p>${cfg.mapUrl ? `<p><a href="${cfg.mapUrl}">Xem bản đồ Google Maps</a></p>` : ''}`
  : `<p>Cửa hàng đang chuẩn bị cơ sở tại Đà Lạt, Lâm Đồng. Hiện bạn có thể liên hệ và đặt hàng qua <a href="${cfg.shopUrl}/lien-he/">${cfg.shopUrl.replace('https://', '')}/lien-he</a> (Zalo, chat, form tư vấn). Giờ làm việc: ${cfg.hours}.</p>`;
page({ path: '/lien-he/', title: `Liên hệ ${cfg.brand}`, desc: `Liên hệ ${cfg.brand} để được tư vấn chọn cây, hoa và quà tặng.`, crumbs: [['Liên hệ', '/lien-he/']],
  body: `${crumbHtml([['Liên hệ']])}<h1>Liên hệ ${cfg.brand}</h1>${napHtml}${cta}` });

write('404.html', `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Không tìm thấy trang</title><link rel="stylesheet" href="/style.css"></head><body><main class="w"><h1>Không tìm thấy trang</h1><p><a href="/">Về trang chủ</a> hoặc xem <a href="/cam-nang/">cẩm nang</a>.</p></main></body></html>`);

const urls = ['/', '/cam-nang/', '/hoi-dap/', '/gioi-thieu/', '/lien-he/', ...articles.map((a) => `/cam-nang/${a.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${base}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
// Cho phép cả bot tìm kiếm lẫn bot AI (GEO)
const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'Bingbot'];
write('robots.txt', `User-agent: *\nAllow: /\n\n${bots.map((b) => `User-agent: ${b}\nAllow: /\n`).join('\n')}\nSitemap: ${base}/sitemap.xml\n`);
write('llms.txt', `# ${cfg.brand} – Cẩm nang\n\n> Cẩm nang tiếng Việt về chăm cây cảnh, giữ hoa tươi, chọn hoa/quà tặng và mùa hoa Đà Lạt. Cửa hàng bán lẻ: ${cfg.shopUrl}\n\n## Bài viết\n${articles.map((a) => `- [${a.title}](${base}/cam-nang/${a.slug}/): ${a.desc}`).join('\n')}\n\n## Khác\n- [Hỏi đáp](${base}/hoi-dap/)\n- [Giới thiệu](${base}/gioi-thieu/)\n- [Liên hệ](${base}/lien-he/)\n`);
write('CNAME', cfg.domain + '\n');
write('.nojekyll', '');
write('logo.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#1f7a4d"/><text x="32" y="43" font-size="34" text-anchor="middle">🌻</text></svg>`);
write('og.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#1f7a4d"/><text x="600" y="300" font-size="72" fill="#fff" text-anchor="middle" font-family="sans-serif" font-weight="700">Làng Hoa Hướng Dương</text><text x="600" y="380" font-size="36" fill="#ffe38a" text-anchor="middle" font-family="sans-serif">Cẩm nang cây cảnh &amp; hoa tươi</text></svg>`);
console.log(`Built ${urls.length} pages → ${out}/`);
