// Renders formulas from the lecture notes into chalkboard SVGs.
const fs = require('fs');
const {mathjax} = require('mathjax-full/js/mathjax.js');
const {TeX} = require('mathjax-full/js/input/tex.js');
const {SVG} = require('mathjax-full/js/output/svg.js');
const {liteAdaptor} = require('mathjax-full/js/adaptors/liteAdaptor.js');
require('mathjax-full/js/input/tex/AllPackages.js');
const {RegisterHTMLHandler} = require('mathjax-full/js/handlers/html.js');
const adaptor = liteAdaptor(); RegisterHTMLHandler(adaptor);
const doc = mathjax.document('', {InputJax: new TeX({packages: ['base','ams','newcommand']}), OutputJax: new SVG({fontCache: 'none'})});
const CHALK = '#ece6d6';

function tex(src, x, y, exPx, rot = 0, op = .5) {
  const node = doc.convert(src, {display: true});
  let svg = adaptor.innerHTML(node);              // <svg ...>...</svg>
  const w = parseFloat(svg.match(/width="([\d.]+)ex"/)[1]) * exPx;
  const h = parseFloat(svg.match(/height="([\d.]+)ex"/)[1]) * exPx;
  svg = svg.replace(/width="[\d.]+ex"/, `width="${w.toFixed(1)}"`).replace(/height="[\d.]+ex"/, `height="${h.toFixed(1)}"`)
           .replace(/style="[^"]*"/, '').replace('<svg ', `<svg x="0" y="0" `);
  return `<g transform="translate(${x} ${y}) rotate(${rot})" opacity="${Math.min(.95, op*1.8).toFixed(2)}" color="${CHALK}" fill="${CHALK}" stroke-width="0">${svg}</g>`;
}
function eqno(n, x, y, exPx, op) { return tex(`(${n})`, x, y, exPx, 0, op); }
// hand-drawn line: jittered polyline
function chalkLine(pts, op = .45, w = 2.2) {
  let r = 3, d = '';
  pts.forEach(([x, y], i) => { d += (i ? ' L' : 'M') + (x + Math.sin(i * 7.1) * .8).toFixed(1) + ',' + (y + Math.cos(i * 5.3) * .8).toFixed(1); });
  return `<path d="${d}" fill="none" stroke="${CHALK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${Math.min(.9, op*1.6).toFixed(2)}"/>`;
}
function seg(x1, y1, x2, y2, n = 12) { const p = []; for (let i = 0; i <= n; i++) p.push([x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]); return p; }
function arrowHead(x, y, ang, op) { const L = 11; const a = ang * Math.PI / 180;
  return chalkLine([[x - L * Math.cos(a - .45), y - L * Math.sin(a - .45)], [x, y], [x - L * Math.cos(a + .45), y - L * Math.sin(a + .45)]], op); }
// Kan(2,1) horn: two solid edges, dashed filler
function horn(x, y, s, op) {
  const A = [x, y + s], B = [x + s / 2, y], C = [x + s, y + s];
  let g = chalkLine(seg(...A, ...B), op) + chalkLine(seg(...B, ...C), op);
  for (let i = 0; i < 8; i += 2) g += chalkLine(seg(A[0] + s * i / 8, A[1], A[0] + s * (i + 1) / 8, A[1], 3), op * .8);
  [A, B, C].forEach(([px, py]) => g += `<circle cx="${px}" cy="${py}" r="4" fill="${CHALK}" opacity="${op}"/>`);
  g += arrowHead(x + s / 4 + 4, y + s / 2 - 8, -63, op) + arrowHead(x + 3 * s / 4 + 4, y + s / 2 + 8, 63, op);
  g += tex('a', x + s / 8 - 26, y + s / 2 - 34, 9, 0, op) + tex('b', x + 7 * s / 8 + 6, y + s / 2 - 34, 9, 0, op);
  g += tex('\\exists\\, ab', x + s / 2 - 28, y + s + 8, 9, 0, op);
  return g;
}
const filter = `<defs>
 <filter id="chalk" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="3" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="9" result="g"/>
  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.4" result="mask"/>
  <feComposite in="d" in2="mask" operator="in"/>
 </filter></defs>`;
const wrap = (W, H, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${filter}<g filter="url(#chalk)">${body}</g></svg>`;

// ---- hero board: definitions of shifted symplectic structures ----
let b = '';
b += tex('\\textit{Definition.}\\quad (X_\\bullet,\\alpha_\\bullet)\\ \\textit{is an } m\\textit{-shifted symplectic Lie } n\\textit{-groupoid}', 60, 40, 9, -.6, .42);
b += tex('\\alpha_\\bullet=\\sum_{i=0}^{m}\\alpha_i,\\qquad \\alpha_i\\in\\widehat\\Omega^{\\,k+m-i}(X_i)', 90, 110, 11, -.4, .5) + eqno(19, 760, 128, 10, .35);
b += tex('\\delta=\\sum_{i=0}^{p}(-1)^i d_i^{*},\\qquad D=\\delta+(-1)^p d,\\qquad D\\alpha_\\bullet=0', 70, 230, 10, .3, .42);
b += tex('\\lambda^{\\alpha_\\bullet}(\\partial u,w)+(-1)^{k+1}\\lambda^{\\alpha_\\bullet}(u,\\partial w)=0', 980, 60, 10, .5, .45) + eqno(21, 1530, 70, 10, .35);
b += tex('\\lambda^{\\alpha_\\bullet,\\sharp}\\colon(\\mathcal T_\\bullet X,\\partial)\\xrightarrow{\\ \\simeq\\ }(\\mathcal T^{*}_\\bullet X[-m],\\partial^{t})', 1000, 150, 10, -.4, .45);
b += horn(1300, 330, 150, .4);
b += tex('p^l_j\\colon X_l=\\hom(\\Delta[l],X_\\bullet)\\twoheadrightarrow\\hom(\\Lambda[l,j],X_\\bullet)', 60, 380, 9.5, -.3, .38) + eqno(3, 700, 392, 9.5, .3);
b += tex('\\Omega=\\langle d_2^{*}\\theta^{l},d_0^{*}\\theta^{r}\\rangle,\\qquad \\Theta=\\tfrac16\\langle\\theta^{l},[\\theta^{l},\\theta^{l}]\\rangle', 60, 560, 10, .4, .4) + eqno(23, 760, 575, 10, .3);
b += tex('\\omega_\\tau(a,b)=\\int_{S^1}\\langle\\widehat a\\,{}\'(t),\\widehat b(t)\\rangle\\,dt', 960, 600, 10, -.5, .42) + eqno(24, 1460, 615, 10, .3);
b += tex('\\delta\\omega=0,\\quad d\\omega=\\delta H,\\quad dH=0', 980, 760, 10, .3, .38);
b += tex('\\{\\text{symplectic manifolds}\\}\\rightleftharpoons\\{0\\text{-shifted symplectic Lie }0\\text{-groupoids}\\}', 60, 760, 8.5, -.2, .34);
b += chalkLine(seg(80, 196, 720, 192, 30), .3, 1.8);           // underline under (19)
b += chalkLine([[950, 40], [945, 260], [948, 470], [944, 880]], .18, 2.4); // board division line
fs.writeFileSync(process.argv[2] + '/hero-bg.svg', wrap(1600, 900, b));

// ---- section board: lighter, margin notes ----
let s = '';
s += tex('(\\Delta[l])_k=\\{f\\colon[k]\\to[l]\\mid f(i)\\le f(j),\\ \\forall\\, i\\le j\\}', 1060, 80, 8, -.4, .26);
s += tex('H_k(\\mathcal TX)\\times H_{m-k}(\\mathcal TX)\\to\\mathbb R_{X_0}', 1080, 330, 8.5, .5, .26) + eqno(22, 1450, 340, 8, .2);
s += tex('\\mathbb G_\\bullet=\\ \\cdots\\ \\Omega G\\;\\Rrightarrow\\;P_eG\\rightrightarrows pt', 20, 520, 8.5, -.6, .24);
s += tex('d_0(\\tau)(t)=\\tau(\\tfrac t3),\\quad d_1(\\tau)(t)=\\tau(1-\\tfrac t3)', 1060, 700, 8, .3, .24);
s += tex('\\hom(\\Lambda[2,1],X_\\bullet)=X_1\\times_{d_1,X_0,d_0}X_1', 20, 860, 8, .4, .22);
fs.writeFileSync(process.argv[2] + '/section-bg.svg', wrap(1600, 980, '<g opacity="0.5">' + s + '</g>'));
console.log('ok');
