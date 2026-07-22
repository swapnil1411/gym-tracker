// Generates static HTML snapshots of the gym-tracker pages for design handoff.
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "/Users/dholubeech/Documents/gym-tracker/design/snapshots";
mkdirSync(OUT, { recursive: true });

/* ----------------------------- shared CSS ------------------------------ */
const CSS = `
:root,[data-theme="dark"]{
  --bg:21 24 30;--surface:28 32 41;--surface2:36 41 53;--surface3:44 49 61;
  --border:47 53 66;--text:243 245 248;--dim:162 171 187;--mute:107 115 133;
  --accent:78 120 220;--accent2:39 52 82;--accent-ghost:25 33 49;--on-accent:255 255 255;
  --success:48 187 126;--success2:20 51 40;--on-success:255 255 255;
  --pr:210 160 68;--pr2:36 31 17;
  --tag-alpha:.14;
  --lift-strong:0 14px 30px -12px rgb(var(--accent) / .42);
  color-scheme:dark;
}
[data-theme="light"]{
  --bg:244 246 250;--surface:255 255 255;--surface2:238 241 246;--surface3:226 231 240;
  --border:226 231 240;--text:26 32 48;--dim:90 100 120;--mute:138 147 166;
  --accent:61 99 221;--accent2:196 209 247;--accent-ghost:238 242 253;--on-accent:255 255 255;
  --success:26 157 106;--success2:223 243 233;--on-success:255 255 255;
  --pr:200 138 26;--pr2:248 239 219;
  --tag-alpha:.16;
  --lift-strong:0 14px 30px -14px rgb(var(--accent) / .45);
  color-scheme:light;
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;background:rgb(var(--bg));color:rgb(var(--text))}
body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(120% 90% at 50% 0%, rgb(var(--surface3)) 0%, rgb(var(--bg)) 60%, rgb(16 18 22) 100%)}
[data-theme="light"] body::before{
  background:radial-gradient(120% 90% at 50% 0%, rgb(255 255 255) 0%, rgb(var(--bg)) 58%, rgb(var(--surface3)) 100%)}
body{font-family:'Hanken Grotesk',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  display:flex;justify-content:center;min-height:100dvh;padding:24px 0;
  transition:background-color .2s ease,color .2s ease}
.display{font-family:'Space Grotesk',system-ui,sans-serif}
button{font:inherit;color:inherit;cursor:pointer}
input{font-size:16px}
.no-scrollbar{scrollbar-width:none}.no-scrollbar::-webkit-scrollbar{display:none}
.tabular{font-variant-numeric:tabular-nums}
.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ------ phone frame ------ */
.phone{position:relative;display:flex;flex-direction:column;width:100%;max-width:460px;height:812px;
  border-radius:42px;overflow:hidden;background:rgb(var(--bg));
  box-shadow:0 40px 90px -20px rgba(0,0,0,.55),0 0 0 1px rgb(var(--border))}
@media(max-width:480px){body{padding:0}.phone{height:100dvh;max-width:none;border-radius:0}}

/* ------ top bar ------ */
.topbar{display:flex;height:56px;flex:none;align-items:center;justify-content:space-between;
  border-bottom:1px solid rgb(var(--border));background:rgb(var(--bg));padding:0 20px}
.brand{display:flex;align-items:center;gap:10px}
.brand .mark{width:26px;height:26px;border-radius:8px;background:rgb(var(--accent));
  color:rgb(var(--on-accent));display:flex;align-items:center;justify-content:center}
.brand .word{font-family:'Space Grotesk';font-size:15px;font-weight:800;letter-spacing:.09em}
.topbar .actions{display:flex;align-items:center;gap:8px}
.iconbtn{width:40px;height:40px;border-radius:12px;border:1px solid rgb(var(--border));
  background:rgb(var(--surface));color:rgb(var(--dim));display:flex;align-items:center;justify-content:center}
.iconbtn.on{border-color:rgb(var(--accent));background:rgb(var(--accent));color:rgb(var(--on-accent))}

/* ------ scroll area & bottom nav ------ */
main.page{min-height:0;flex:1;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column}
.nav{flex:none;border-top:1px solid rgb(var(--border));background:rgb(var(--bg))}
.nav .tabs{display:flex;align-items:stretch;padding:10px 8px 12px}
.navbtn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  padding:6px 0;background:none;border:0;border-radius:16px;color:rgb(var(--mute))}
.navbtn .lbl{font-size:10.5px;letter-spacing:.04em;font-weight:600}
.navbtn.on{color:rgb(var(--accent))}
.navbtn.on .lbl{font-weight:800}

/* ------ page headers ------ */
.kick{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:rgb(var(--accent))}
h1.pagetitle{margin:4px 0 0;font-family:'Space Grotesk';font-size:28px;font-weight:800;letter-spacing:-.02em}
.sub{margin:8px 0 0;font-size:13px;line-height:1.5;color:rgb(var(--dim))}

/* ------ cards ------ */
.card{border-radius:18px;border:1px solid rgb(var(--border));background:rgb(var(--surface));padding:16px}
.cardtitle{margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgb(var(--mute))}
.cardbody{margin-top:12px}
.note{margin:12px 0 0;font-size:11.5px;line-height:1.5;color:rgb(var(--dim))}
.footnote{font-size:11px;line-height:1.55;color:rgb(var(--mute))}

/* ------ shared controls ------ */
.cta{height:56px;width:100%;border:0;border-radius:16px;background:rgb(var(--accent));
  color:rgb(var(--on-accent));font-size:16px;font-weight:800;display:flex;align-items:center;
  justify-content:center;gap:10px;box-shadow:var(--lift-strong)}
.stickyfoot{position:sticky;bottom:0;z-index:8;margin-top:auto;
  background:linear-gradient(to top, rgb(var(--bg)) 55%, transparent);padding:28px 20px 12px}
.pager{display:flex;align-items:center;justify-content:space-between;gap:8px}
.pagerbtn{width:36px;height:36px;flex:none;display:flex;align-items:center;justify-content:center;
  border-radius:12px;border:1px solid rgb(var(--border));background:rgb(var(--surface));color:rgb(var(--dim))}
.pagerbtn[disabled]{opacity:.3}
.pagerlbl{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgb(var(--mute))}
.tag{display:inline-block;border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;
  text-transform:uppercase;letter-spacing:.06em}
.seg{display:flex;flex-wrap:wrap;gap:6px}
.segbtn{flex:1;border-radius:12px;border:1px solid rgb(var(--border));background:rgb(var(--surface2));
  color:rgb(var(--dim));padding:8px 12px;text-align:center}
.segbtn.on{border-color:rgb(var(--accent));background:rgb(var(--accent));color:rgb(var(--on-accent))}
.segbtn .l{display:block;white-space:nowrap;font-size:13px;font-weight:700}
.segbtn .h{display:block;margin-top:2px;font-size:10px;font-weight:600;opacity:.7}

/* ------ Today ------ */
.sessionhead{padding:12px 20px 16px}
.sessionrow{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.sessiontitle{font-family:'Space Grotesk';font-size:clamp(28px,8vw,34px);font-weight:700;
  line-height:1.05;letter-spacing:-.02em;display:flex;align-items:center;gap:8px}
.dateline{margin-top:6px;font-size:14px;font-weight:500;letter-spacing:.01em;color:rgb(var(--dim))}
.countline{margin-top:4px;font-size:12.5px;font-weight:500;color:rgb(var(--mute))}
.sliderlabel{display:flex;align-items:center;justify-content:space-between;margin:20px 2px 6px}
.sliderlabel .t{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:rgb(var(--mute))}
.sliderlabel .rest{font-size:11px;font-weight:600;color:rgb(var(--dim));background:none;border:0}
.slider{display:flex;align-items:stretch;gap:8px}
.slidertrack{display:flex;flex:1;gap:12px;overflow-x:auto;border-radius:16px;scroll-snap-type:x mandatory}
.slidecard{display:flex;height:58px;width:100%;flex:none;scroll-snap-align:center;flex-direction:column;
  align-items:center;justify-content:center;border-radius:16px;border:1px solid rgb(var(--border));
  background:rgb(var(--surface));color:rgb(var(--dim))}
.slidecard.on{border-color:rgb(var(--accent));background:rgb(var(--accent));
  color:rgb(var(--on-accent));box-shadow:var(--lift-strong)}
.slidecard .n{display:flex;max-width:100%;align-items:center;gap:6px;padding:0 20px;
  font-size:17px;font-weight:900;letter-spacing:-.01em}
.slidecard .s{font-size:11px;font-weight:600;opacity:.75}
.slideadd{width:58px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:16px;
  border:1px solid rgb(var(--border));background:rgb(var(--surface));color:rgb(var(--dim));font-size:24px;line-height:1}
.dots{margin-top:8px;display:flex;align-items:center;justify-content:center;gap:6px}
.dots i{display:block;height:6px;width:6px;border-radius:99px;background:rgb(var(--border))}
.dots i.live{width:20px;background:rgb(var(--accent))}
.dots i.sel{background:rgb(var(--accent) / .5)}
.daypills{display:flex;gap:8px;overflow-x:auto;padding:10px 20px 6px}
.daypill{position:relative;min-width:104px;flex:none;border-radius:14px;border:1px solid rgb(var(--border));
  background:rgb(var(--surface));color:rgb(var(--text));padding:12px 14px;text-align:left;
  font-family:'Space Grotesk';font-size:13px;font-weight:700;letter-spacing:.04em}
.daypill.on{border-color:rgb(var(--accent));background:rgb(var(--accent-ghost));color:rgb(var(--accent))}
.daypill small{display:block;margin-top:4px;max-width:78px;overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap;font-family:'Hanken Grotesk';font-size:11px;font-weight:500;letter-spacing:0;
  text-transform:capitalize;color:rgb(var(--mute))}
.daypill.on small{color:rgb(var(--accent))}
.daypill .todaydot{position:absolute;right:-4px;top:-4px;height:12px;width:12px;border-radius:99px;
  border:2px solid rgb(var(--bg));background:rgb(var(--success))}
.editlink{padding:6px 0;font-size:12.5px;font-weight:600;color:rgb(var(--dim));background:none;border:0}
.listhead{display:flex;align-items:center;justify-content:space-between;padding-top:4px}
.listhead .t{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:rgb(var(--mute))}
.listhead .c{font-size:12.5px;font-weight:700;color:rgb(var(--accent))}
.exlist{display:flex;flex:1;flex-direction:column;gap:12px;padding:10px 20px 16px}
.exrow{position:relative;display:flex;align-items:center;gap:12px;overflow:hidden;border-radius:16px;
  border:1px solid rgb(var(--border));background:rgb(var(--surface));padding:14px;cursor:pointer}
.exrow.done{border-color:rgb(var(--success));background:rgb(var(--success2))}
.tick{width:44px;height:44px;flex:none;display:flex;align-items:center;justify-content:center;
  border-radius:13px;border:2px solid rgb(var(--surface3));background:transparent}
.tick.on{border-color:rgb(var(--success));background:rgb(var(--success))}
.exmain{min-width:0;flex:1}
.exname{font-size:15.5px;font-weight:600;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.exrow.done .exname{color:rgb(var(--dim));text-decoration:line-through;text-decoration-color:rgb(var(--success))}
.exmeta{margin-top:4px;display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.exnums{font-size:12.5px;font-weight:600;color:rgb(var(--dim))}
.exnums b{font-weight:600;color:rgb(var(--text))}
.exlast{margin-top:4px;font-size:11.5px;color:rgb(var(--mute))}
.exlast b{font-weight:600;color:rgb(var(--dim))}
.chev{flex:none;color:rgb(var(--mute))}
.addex{margin-top:4px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:16px;
  border:1.5px dashed rgb(var(--border));background:none;padding:15px 0;font-size:14px;font-weight:600;color:rgb(var(--dim))}
.prbanner{display:flex;align-items:center;gap:12px;border-radius:16px;
  border:1px solid rgb(var(--pr) / .25);background:rgb(var(--pr2));padding:14px 16px;text-align:left}
.prbanner .ic{width:36px;height:36px;flex:none;display:flex;align-items:center;justify-content:center;
  border-radius:11px;background:rgb(var(--pr));color:#1c1206}
.prbanner .t{font-size:13px;font-weight:800;color:rgb(var(--pr))}
.prbanner .d{margin-top:2px;font-size:12.5px;font-weight:500;color:rgb(var(--dim));
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.burnrow{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.burnrow .l{font-size:12.5px;font-weight:500;color:rgb(var(--dim));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.burnrow .v{flex:none;font-family:'Space Grotesk';font-size:12.5px;font-weight:700;color:rgb(var(--dim))}

/* ------ Stats ------ */
.statgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.statnum{margin-top:8px;font-family:'Space Grotesk';font-size:34px;font-weight:700;line-height:1}
.statnum small{margin-left:4px;font-size:13px;font-weight:600;color:rgb(var(--dim))}
.stattitle{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgb(var(--mute))}
.weekrings{display:flex;justify-content:space-between}
.weekrings .d{display:flex;flex-direction:column;align-items:center;gap:6px}
.weekrings .lbl{font-family:'Space Grotesk';font-size:10px;font-weight:700;letter-spacing:.08em;color:rgb(var(--dim))}
.weekrings .lbl.today{color:rgb(var(--accent))}
.monthhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.monthhead .m{font-family:'Space Grotesk';font-size:14px;font-weight:700}
.monthhead button{width:28px;height:28px;display:flex;align-items:center;justify-content:center;
  border-radius:12px;border:1px solid rgb(var(--border));background:none;color:rgb(var(--dim))}
.monthhead button[disabled]{opacity:.25}
.heat{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.heat .dow{text-align:center;font-family:'Space Grotesk';font-size:9px;font-weight:700;
  letter-spacing:.06em;color:rgb(var(--dim))}
.heat .cell{position:relative;aspect-ratio:1;border-radius:6px;border:1px solid transparent;text-align:center}
.heat .cell span{display:block;padding-top:15%;font-size:9px;font-weight:600}
.heat .cell .sport{position:absolute;bottom:13%;left:50%;height:3px;width:3px;
  transform:translateX(-50%);border-radius:99px;background:rgb(var(--accent))}
.sessrow{display:flex;align-items:center;justify-content:space-between;border-radius:12px;
  background:rgb(var(--surface2));padding:10px 12px}
.sessrow .l{font-size:13px;font-weight:600}
.sessrow .l i{font-style:normal;color:rgb(var(--dim))}
.sessrow .v{font-family:'Space Grotesk';font-size:12px;font-weight:700}
.sessrow .v.ok{color:rgb(var(--success))}
.sessrow .v.part{color:rgb(var(--dim))}
.allbtn{margin-top:8px;width:100%;border-radius:12px;border:1px solid rgb(var(--border));
  background:none;padding:10px 0;font-size:12.5px;font-weight:600;color:rgb(var(--accent))}

/* ------ Sports ------ */
.herokcal{margin-top:12px;border-radius:20px;background:rgb(var(--accent));color:rgb(var(--on-accent));padding:14px 16px}
.herokcal .t{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.75}
.herokcal .v{margin-top:4px;font-family:'Space Grotesk';font-size:36px;font-weight:700;line-height:1}
.herokcal .v small{margin-left:6px;font-size:13px;font-weight:600;opacity:.75}
.weekstrip{margin-top:12px;display:flex;gap:6px;padding:0 20px}
.wday{display:flex;flex:1;flex-direction:column;align-items:center;gap:4px;border-radius:12px;
  border:1px solid rgb(var(--border));background:rgb(var(--surface2));padding:8px 0}
.wday .l{font-size:9.5px;font-weight:700;color:rgb(var(--mute))}
.wday .n{font-family:'Space Grotesk';font-size:14px;font-weight:800}
.wday .dot{height:6px;width:6px;border-radius:99px;background:transparent}
.wday .dot.on{background:rgb(var(--accent))}
.wday.on{border-color:rgb(var(--accent));background:rgb(var(--accent));color:rgb(var(--on-accent))}
.wday.on .l{color:inherit;opacity:.75}
.wday.on .dot.on{background:rgb(var(--on-accent))}
.dayhead{display:flex;align-items:baseline;justify-content:space-between}
.dayhead .t{margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgb(var(--mute))}
.dayhead .v{font-family:'Space Grotesk';font-size:13px;font-weight:800;color:rgb(var(--accent))}
.actrow{display:flex;align-items:center;gap:12px;border-radius:20px;border:1px solid rgb(var(--border));
  background:rgb(var(--surface));padding:12px 14px;text-align:left}
.actrow.ghost{border-style:dashed;background:none}
.actrow .emoji{font-size:19px;line-height:1}
.actrow .main{min-width:0;flex:1}
.actrow .n{font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.actrow .d{font-size:11.5px;color:rgb(var(--dim));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.actrow .kcal{font-family:'Space Grotesk';font-size:15px;font-weight:800}
.actrow .kcal.accent{color:rgb(var(--accent))}

/* ------ Body ------ */
.measure{display:flex;align-items:center;justify-content:space-between;gap:12px}
.measure .l{font-size:14px;font-weight:600}
.measure .ctrls{display:flex;align-items:center;gap:12px}
.mbtn{width:40px;height:40px;flex:none;display:flex;align-items:center;justify-content:center;
  border-radius:11px;border:0;font-size:22px;line-height:1}
.mbtn.minus{border:1px solid rgb(var(--border));background:rgb(var(--surface2));color:rgb(var(--dim))}
.mbtn.plus{background:rgb(var(--accent));color:rgb(var(--on-accent))}
.mval{display:flex;min-width:74px;align-items:baseline;justify-content:center;gap:4px}
.mval b{font-family:'Space Grotesk';font-size:18px;font-weight:800}
.mval span{font-size:12px;font-weight:600;color:rgb(var(--mute))}
.bignum{display:flex;align-items:flex-end;justify-content:space-between}
.bignum .v{font-family:'Space Grotesk';font-size:40px;font-weight:700;line-height:1}
.bignum .v small{margin-left:6px;font-size:13px;font-weight:600;color:rgb(var(--dim))}
.bignum .side{padding-bottom:4px;text-align:right}
.bignum .side .a{font-size:14px;font-weight:700}
.bignum .side .b{font-size:11px;color:rgb(var(--dim))}
.bmiscale{position:relative;margin-top:16px}
.bmibar{display:flex;height:10px;overflow:hidden;border-radius:99px}
.bmimark{position:absolute;top:-4px;width:3px;height:18px;transform:translateX(-50%);
  border-radius:99px;background:rgb(var(--text))}
.bmilabels{margin-top:6px;display:flex;justify-content:space-between;
  font-size:9.5px;font-weight:600;color:rgb(var(--mute))}
.actpick{display:flex;flex-direction:column;gap:6px}
.actopt{display:flex;align-items:center;justify-content:space-between;border-radius:12px;
  border:1px solid rgb(var(--border));background:rgb(var(--surface2));padding:10px 14px;text-align:left}
.actopt.on{border-color:rgb(var(--accent));background:rgb(var(--accent));color:rgb(var(--on-accent))}
.actopt .a{display:block;font-size:13.5px;font-weight:700}
.actopt .b{display:block;font-size:11px;color:rgb(var(--dim))}
.actopt.on .b{color:inherit;opacity:.75}
.actopt .f{font-family:'Space Grotesk';font-size:12px;font-weight:700;opacity:.7}
.intakehero{border-radius:12px;background:rgb(var(--accent));color:rgb(var(--on-accent));padding:14px 16px}
.intakehero .t{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.75}
.intakehero .v{margin-top:4px;font-family:'Space Grotesk';font-size:36px;font-weight:700;line-height:1}
.intakehero .v small{margin-left:6px;font-size:13px;font-weight:600;opacity:.75}
.tiles{margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.tile{border-radius:12px;background:rgb(var(--surface2));padding:10px;text-align:center}
.tile .t{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgb(var(--mute))}
.tile .v{margin-top:4px;font-family:'Space Grotesk';font-size:17px;font-weight:700;line-height:1}
.tile .v small{margin-left:2px;font-size:10px;font-weight:600;color:rgb(var(--dim))}

/* ------ Rehab ------ */
.rehabrow{display:flex;align-items:center;gap:4px;border-radius:20px;border:1px solid rgb(var(--border));
  background:rgb(var(--surface));padding-right:6px}
.rehabrow .open{display:flex;min-width:0;flex:1;align-items:center;gap:12px;background:none;border:0;
  padding:12px 0 12px 14px;text-align:left}
.rehabrow .n{display:block;font-size:14.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rehabrow .t{display:block;margin-top:2px;font-size:11.5px;color:rgb(var(--dim));
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lvltag{flex:none;border-radius:6px;padding:2px 6px;font-size:10px;font-weight:700;
  text-transform:uppercase;letter-spacing:.06em}
.searchbox{display:flex;align-items:center;gap:10px;border-radius:14px;background:rgb(var(--surface2));padding:12px 16px}
.searchbox input{width:100%;min-width:0;background:none;border:0;outline:none;color:inherit;font-size:14px}
.searchbox input::placeholder{color:rgb(var(--dim))}
.searchbox svg{flex:none;color:rgb(var(--mute))}
.chips{display:flex;gap:8px;overflow-x:auto;padding:0 20px;
  mask-image:linear-gradient(to right,transparent,#000 14px,#000 calc(100% - 14px),transparent);
  -webkit-mask-image:linear-gradient(to right,transparent,#000 14px,#000 calc(100% - 14px),transparent)}
.chip{height:36px;flex:none;border-radius:99px;border:0;background:rgb(var(--surface2));
  color:rgb(var(--dim));padding:0 14px;font-size:13px;font-weight:600;white-space:nowrap}
.chip.on{background:rgb(var(--accent));color:rgb(var(--on-accent));box-shadow:var(--lift-strong)}
.listcard{display:flex;align-items:center;gap:12px;border-radius:20px;border:1px solid rgb(var(--border));
  background:rgb(var(--surface));padding:12px 14px;text-align:left}
.listcard .n{display:block;font-size:14.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.listcard .c{display:block;margin-top:2px;font-size:11.5px;color:rgb(var(--dim))}
.ghostbtn{width:100%;border-radius:12px;border:1px solid rgb(var(--accent) / .4);
  background:rgb(var(--accent) / .1);padding:10px 0;font-size:12.5px;font-weight:600;color:rgb(var(--accent))}
`;

/* ----------------------------- svg helpers ----------------------------- */
const svgBarbell = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.5 7v10M17.5 7v10M6.5 12h11M4 9.5v5M20 9.5v5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;
const svgBody = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 22v-6l-2-1 1.5-5A2 2 0 0 1 7.4 9h9.2a2 2 0 0 1 1.9 1l1.5 5-2 1v6"/></svg>`;
const svgLogout = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>`;
const svgTheme = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
const svgCheck = (on) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgb(var(--on-success))" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="opacity:${on ? 1 : 0}"><path d="M5 12.5 10 17l9-10"/></svg>`;
const svgChevron = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="chev"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const svgTrophy = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const svgSearch = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const svgPlay = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;

const NAV_ICONS = {
  today: (on) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}"><path d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-1.5.6-2.7 1.5-3.7C9 10 10 8.5 12 3z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>`,
  rehab: () => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 14h3l2-5 3 9 2-6 1.5 2H20" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  sports: () => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2M9.5 2h5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  stats: () => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

function ring(done, total, size, stroke, showText = true) {
  const r = size / 2 - stroke / 2 - 2;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? done / total : 0;
  const complete = total > 0 && done === total;
  const color = complete ? "rgb(var(--success))" : "rgb(var(--accent))";
  return `<div style="position:relative;flex:none;width:${size}px;height:${size}px" role="img" aria-label="${done} of ${total} exercises complete">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}" stroke="rgb(var(--border))"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}" stroke="${color}" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - frac)).toFixed(1)}"/>
    </svg>
    ${showText ? `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
      <b class="display" style="font-size:15px;font-weight:800;line-height:1${complete ? ";color:rgb(var(--success))" : ""}">${done}/${total}</b>
      <span style="margin-top:2px;font-size:9px;letter-spacing:.12em;color:rgb(var(--dim))">DONE</span>
    </div>` : ""}
  </div>`;
}

/* Muscle-group tags: Radix step-9 hue tinted via color-mix, step-11 ink via light-dark(). */
const GROUP_TAG = {
  chest: ["#e5484d", "#ce2c31", "#ff9592"],
  shoulders: ["#00a2c7", "#107d98", "#4ccce6"],
  triceps: ["#d6409f", "#c2298a", "#ff8dcc"],
  cardio: ["#46a758", "#2a7e3b", "#71d083"],
};
const tag = (group, label) => {
  const [c, inkL, inkD] = GROUP_TAG[group];
  return `<span class="tag" style="background:color-mix(in srgb, ${c} calc(var(--tag-alpha) * 100%), transparent);color:light-dark(${inkL}, ${inkD})">${label}</span>`;
};

const LEVEL_COLOR = { 1: "rgb(var(--success))", 2: "rgb(var(--accent))", 3: "rgb(var(--pr))" };
const LEVEL_LABEL = { 1: "Zero", 2: "Build", 3: "Strong" };
const lvl = (n) =>
  `<span class="lvltag" style="background:color-mix(in srgb, ${LEVEL_COLOR[n]} calc(var(--tag-alpha) * 100%), transparent);color:${LEVEL_COLOR[n]}">${LEVEL_LABEL[n]}</span>`;

/* ---------------------- sheet / overlay extra CSS ----------------------- */
const EXTRA = `
.scrim{position:absolute;inset:0;z-index:20;background:rgba(0,0,0,.6);backdrop-filter:blur(3px)}
.sheet{position:absolute;bottom:0;left:50%;transform:translateX(-50%);z-index:30;display:flex;
  max-height:82%;width:100%;flex-direction:column;border-radius:28px 28px 0 0;
  background:rgb(var(--surface));border:1px solid rgb(var(--border));border-bottom:0}
.sheet .grab{margin:10px auto 4px;height:4px;width:36px;border-radius:2px;background:rgb(var(--border))}
.sheet .close{position:absolute;right:8px;top:8px;width:44px;height:44px;display:flex;align-items:center;
  justify-content:center;border:0;background:none;border-radius:99px;font-size:19px;line-height:1;color:rgb(var(--dim))}
.sheet h3{margin:6px 20px 2px;padding-right:48px;font-family:'Space Grotesk';font-size:19px;font-weight:800}
.sheet .subt{margin:0 20px 12px;padding-right:48px;font-size:13px;color:rgb(var(--dim))}
.sheet .sbody{flex:1;overflow-y:auto;padding:0 16px 32px}
.panel{border-radius:20px;background:rgb(var(--surface2));padding:16px}
.paneltitle{margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgb(var(--dim))}
.ghostcard{border-radius:20px;border:1px solid rgb(var(--accent2));background:rgb(var(--accent-ghost));padding:14px 16px}
.ghostcard .t{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgb(var(--accent))}
.ghostcard p{margin:6px 0 0;font-size:13px;color:rgb(var(--dim))}
.ghostcard b{font-weight:700;color:rgb(var(--text))}
.steplg{display:flex;align-items:center;gap:14px}
.steplg .minus{width:44px;height:44px;flex:none;display:flex;align-items:center;justify-content:center;
  border-radius:12px;border:1px solid rgb(var(--border));background:rgb(var(--surface));
  color:rgb(var(--dim));font-size:24px;line-height:1}
.steplg .plus{width:44px;height:44px;flex:none;display:flex;align-items:center;justify-content:center;
  border-radius:12px;border:0;background:rgb(var(--accent));color:rgb(var(--on-accent));font-size:24px;line-height:1}
.steplg .val{min-width:4.6rem;text-align:center;font-family:'Space Grotesk';font-size:17px;font-weight:800}
.steplg .val span{color:rgb(var(--mute));font-weight:800}
.lrow{display:flex;align-items:center;justify-content:space-between;gap:12px}
.lrow>.l{font-size:14px;font-weight:600}
.dashbtn{width:100%;border-radius:12px;border:1px dashed rgb(var(--border));background:none;
  padding:10px 0;font-size:13px;font-weight:600;color:rgb(var(--dim))}
.sheetcta{margin-top:16px;height:56px;width:100%;border:0;border-radius:16px;background:rgb(var(--accent));
  color:rgb(var(--on-accent));font-size:16px;font-weight:800;box-shadow:var(--lift-strong)}
.sheetcta.done{background:rgb(var(--success));color:rgb(var(--on-success))}
.quietbtn{margin-top:8px;width:100%;border-radius:12px;border:1px solid rgb(var(--border));background:none;
  padding:10px 0;font-size:13px;font-weight:600;color:rgb(var(--dim))}
.thumb{flex:none;display:flex;align-items:center;justify-content:center;border-radius:14px;
  background:rgb(var(--surface3));font-size:20px;line-height:1}
.pickrow{display:flex;align-items:center;gap:12px;border-radius:20px;background:rgb(var(--surface2));padding:10px 12px}
.addbtn{flex:none;border-radius:12px;border:0;background:rgb(var(--accent));color:rgb(var(--on-accent));
  padding:8px 14px;font-size:13px;font-weight:700;box-shadow:var(--lift-strong)}
.addedbtn{flex:none;border-radius:12px;border:1px solid rgb(var(--success) / .4);
  background:rgb(var(--success) / .1);color:rgb(var(--success));padding:8px 14px;font-size:13px;font-weight:700}
.authinput{width:100%;border-radius:12px;border:0;background:rgb(var(--surface2));padding:14px 16px;
  font-size:15px;color:rgb(var(--text));outline:none}
.authinput::placeholder{color:rgb(var(--mute))}
`;

/* ------------------------------- shell --------------------------------- */
function shell({ title, active, bodyActive = false, content, overlay = "", bare = false }) {
  const navBtn = (id, label) => {
    const on = !bodyActive && id === active;
    return `<button class="navbtn${on ? " on" : ""}"${on ? ' aria-current="page"' : ""}>
      <span style="display:flex;line-height:0">${NAV_ICONS[id](on)}</span><span class="lbl">${label}</span></button>`;
  };
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${CSS}${EXTRA}</style>
</head>
<body>
<div class="phone">
${bare ? `  <main class="page">
${content}
  </main>` : `  <header class="topbar">
    <div class="brand"><div class="mark">${svgBarbell}</div><div class="word">GYMLOG</div></div>
    <div class="actions">
      <button class="iconbtn${bodyActive ? " on" : ""}" aria-label="Your body" title="Your body">${svgBody}</button>
      <button class="iconbtn" id="themeBtn" aria-label="Toggle theme" title="Toggle theme">${svgTheme}</button>
      <button class="iconbtn" aria-label="Log out" title="Log out">${svgLogout}</button>
    </div>
  </header>
  <main class="page">
${content}
  </main>
  <nav class="nav" aria-label="Main"><div class="tabs">
    ${navBtn("today", "Today")}
    ${navBtn("rehab", "Rehab")}
    ${navBtn("sports", "Sports")}
    ${navBtn("stats", "Stats")}
  </div></nav>`}
${overlay}
</div>
<script>
document.getElementById("themeBtn").addEventListener("click", () => {
  const el = document.documentElement;
  el.dataset.theme = el.dataset.theme === "dark" ? "light" : "dark";
});
</script>
</body>
</html>`;
}

/* ------------------------------- TODAY --------------------------------- */
function exRow({ done, name, group, glabel, nums, last, future = false }) {
  return `<div class="exrow${done ? " done" : ""}" role="button" tabindex="0">
    <button class="tick${done ? " on" : ""}" aria-pressed="${done}" aria-label="Mark ${name} ${done ? "not done" : "done"}"${future ? " disabled" : ""}>${svgCheck(done)}</button>
    <div class="exmain">
      <div class="exname">${name}</div>
      <div class="exmeta">${tag(group, glabel)}<span class="exnums">${nums}</span></div>
      ${last ? `<div class="exlast">${last}</div>` : ""}
    </div>
    ${svgChevron}
  </div>`;
}

const dayPills = [
  ["MON", 20, "Pull", false, false],
  ["TUE", 21, "Legs", false, false],
  ["WED", 22, "Push", true, true],
  ["THU", 23, "rest", false, false],
  ["FRI", 24, "Pull", false, false],
  ["SAT", 25, "Legs", false, false],
  ["SUN", 26, "rest", false, false],
]
  .map(
    ([d, n, w, on, today]) => `<button class="daypill${on ? " on" : ""}" aria-pressed="${on}">
      ${d} ${n}<small>${w}</small>${today ? '<span class="todaydot"></span>' : ""}</button>`
  )
  .join("\n");

const todayContent = `
    <header class="sessionhead">
      <div class="sessionrow">
        <div style="min-width:0">
          <div class="sessiontitle">Push
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top:4px;flex:none;color:rgb(var(--mute))" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/></svg>
          </div>
          <div class="dateline">Wednesday · 22 Jul · today</div>
          <div class="countline">5 exercises · 13 sets · 20 min cardio · ~65 min</div>
        </div>
        ${ring(2, 5, 56, 6)}
      </div>

      <div class="sliderlabel">
        <span class="t">Today's session</span>
        <button class="rest">Rest day</button>
      </div>
      <div class="slider">
        <div class="slidertrack no-scrollbar" role="listbox" aria-multiselectable="true" aria-label="Sessions for this day">
          <button class="slidecard on" role="option" aria-selected="true">
            <span class="n"><span aria-hidden="true">✓</span> Push</span>
            <span class="s">5 moves · tap to remove</span>
          </button>
          <button class="slidecard" role="option" aria-selected="false">
            <span class="n">Pull</span><span class="s">tap to add</span>
          </button>
          <button class="slidecard" role="option" aria-selected="false">
            <span class="n">Legs</span><span class="s">tap to add</span>
          </button>
        </div>
        <button class="slideadd" aria-label="Add a session">+</button>
      </div>
      <div class="dots"><i class="live"></i><i></i><i></i></div>
    </header>

    <div class="pager" style="padding:16px 20px 0">
      <button class="pagerbtn" style="width:32px;height:32px" aria-label="Previous week">‹</button>
      <span class="pagerlbl" style="font-size:11px">This week</span>
      <button class="pagerbtn" style="width:32px;height:32px" aria-label="Next week" disabled>›</button>
    </div>

    <div class="daypills no-scrollbar">
${dayPills}
    </div>

    <div style="padding:0 20px"><button class="editlink">Edit list</button></div>

    <div class="exlist">
      <div class="listhead">
        <span class="t">Exercises · tap to log</span>
        <span class="c">2/5</span>
      </div>

${exRow({ done: true, name: "Bench Press", group: "chest", glabel: "Chest", nums: "4 × 8 · <b>60kg</b>", last: "Last time <b>57.5kg</b> · Fri 17 Jul" })}
${exRow({ done: true, name: "Overhead Press", group: "shoulders", glabel: "Shoulders", nums: "3 × 10 · <b>40kg</b>", last: "Last time <b>40kg</b> · Fri 17 Jul" })}
${exRow({ done: false, name: "Incline Dumbbell Press", group: "chest", glabel: "Chest", nums: "3 × 10 · <b>22.5kg</b>", last: "Last time <b>22.5kg</b> · Fri 17 Jul · best 25kg" })}
${exRow({ done: false, name: "Triceps Pushdown", group: "triceps", glabel: "Triceps", nums: "3 × 12 · <b>25kg</b>", last: "Last time <b>25kg</b> · Fri 17 Jul" })}
${exRow({ done: false, name: "Treadmill Walking", group: "cardio", glabel: "Cardio", nums: "20 min · 5.5 km/h · 10% · <b>≈185 kcal</b>", last: "Last time <b>20 min · 5.5 km/h · 10%</b> · Mon 20 Jul" })}

      <button class="addex"><span style="font-size:18px;line-height:1">+</span> Add exercise to Push</button>

      <button class="prbanner">
        <div class="ic">${svgTrophy}</div>
        <div style="min-width:0">
          <div class="t">PR to beat today</div>
          <div class="d">Bench Press · best 60kg · Fri 17 Jul</div>
        </div>
      </button>
    </div>

    <div style="padding:16px 20px 0">
      <div class="card" style="border-radius:20px">
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <h2 class="cardtitle">Approx. burned today</h2>
          <span class="display tabular" style="font-size:19px;font-weight:800;color:rgb(var(--accent))">520<span style="margin-left:4px;font-size:11px;font-weight:600;color:rgb(var(--mute))">kcal</span></span>
        </div>
        <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
          <div class="burnrow"><span class="l">Push (lifting)</span><span class="v tabular">210</span></div>
          <div class="burnrow"><span class="l">Treadmill Walking</span><span class="v tabular">185</span></div>
          <div class="burnrow"><span class="l">Pickleball · 45 min</span><span class="v tabular">125</span></div>
        </div>
        <p class="footnote" style="margin:12px 0 0">Estimated from your bodyweight — expect it to be within about a fifth.</p>
      </div>
    </div>

    <div class="stickyfoot">
      <button class="cta">${svgPlay} Continue session</button>
    </div>`;

/* ------------------------------- STATS --------------------------------- */
// July 2026 starts on a Wednesday → two leading pads. Today = 22nd.
const trained = { 1: 1, 2: 0.6, 4: 1, 6: 1, 8: 0.75, 9: 1, 11: 1, 13: 0.4, 15: 1, 16: 1, 18: 1, 20: 1, 21: 0.8, 22: 0.4 };
const sportDays = new Set([3, 7, 11, 14, 18, 21, 22]);
let heatCells = `<div class="dow">M</div><div class="dow">T</div><div class="dow">W</div><div class="dow">T</div><div class="dow">F</div><div class="dow">S</div><div class="dow">S</div>\n<div></div><div></div>`;
for (let d = 1; d <= 31; d++) {
  const frac = trained[d] ?? 0;
  const future = d > 22;
  const bg = frac > 0 ? `rgb(var(--success) / ${(0.15 + frac * 0.75).toFixed(2)})` : "rgb(var(--surface2))";
  const border = d === 22 ? "rgb(var(--accent))" : "transparent";
  const ink = frac > 0.45 ? "rgb(var(--bg))" : "rgb(var(--dim))";
  heatCells += `\n<div class="cell" title="2026-07-${String(d).padStart(2, "0")} — ${Math.round(frac * 100)}% of plan" style="background:${bg};border-color:${border};${future ? "opacity:.35;" : ""}"><span style="color:${ink}">${d}</span>${sportDays.has(d) && !future ? '<span class="sport" aria-hidden="true"></span>' : ""}</div>`;
}

const weekRingData = [
  ["MON", 5, 5], ["TUE", 4, 5], ["WED", 2, 5], ["THU", 0, 0], ["FRI", 0, 5], ["SAT", 0, 5], ["SUN", 0, 0],
];
const weekRings = weekRingData
  .map(
    ([l, d, t], i) => `<div class="d">${ring(d, t || Math.max(d, 1), 38, 4, false)}<span class="lbl${i === 2 ? " today" : ""}">${l}</span></div>`
  )
  .join("\n");

const statsContent = `
    <header style="padding:16px 20px 4px">
      <div class="kick">Your · Progress</div>
      <h1 class="pagetitle">Dashboard</h1>
    </header>

    <div style="display:flex;flex-direction:column;gap:12px;padding:16px 20px">
      <div class="statgrid">
        <div class="card">
          <div class="stattitle">Current streak</div>
          <div class="statnum" style="color:rgb(var(--accent))">3<small>days</small></div>
        </div>
        <div class="card">
          <div class="stattitle">Longest streak</div>
          <div class="statnum" style="color:rgb(var(--success))">12<small>days</small></div>
        </div>
      </div>

      <div class="card">
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <div class="stattitle">Sport &amp; cardio this week</div>
          <span class="display tabular" style="font-size:20px;font-weight:800;line-height:1;color:rgb(var(--accent))">640<span style="margin-left:4px;font-size:11px;font-weight:600;color:rgb(var(--dim))">kcal</span></span>
        </div>
      </div>

      <section class="card">
        <h2 class="cardtitle">This week</h2>
        <div class="cardbody weekrings">
${weekRings}
        </div>
      </section>

      <section class="card">
        <h2 class="cardtitle">Consistency</h2>
        <div class="cardbody">
          <div class="monthhead">
            <button aria-label="Previous month">‹</button>
            <span class="m">July 2026</span>
            <button aria-label="Next month" disabled>›</button>
          </div>
          <div class="heat">
${heatCells}
          </div>
        </div>
      </section>

      <section class="card">
        <h2 class="cardtitle">Last session</h2>
        <div class="cardbody">
          <div class="sessrow">
            <span class="l">Tue 21 Jul <i>· Legs</i></span>
            <span class="v part tabular">4/5 done</span>
          </div>
          <button class="allbtn">All 23 sessions ›</button>
        </div>
      </section>
    </div>`;

/* ------------------------------- SPORTS -------------------------------- */
const weekStrip = [
  ["MON", 20, true], ["TUE", 21, true], ["WED", 22, true, true], ["THU", 23, false], ["FRI", 24, false], ["SAT", 25, false], ["SUN", 26, false],
]
  .map(
    ([l, n, dot, on]) => `<button class="wday${on ? " on" : ""}" aria-pressed="${!!on}">
      <span class="l">${l}</span><span class="n tabular">${n}</span><span class="dot${dot ? " on" : ""}"></span></button>`
  )
  .join("\n");

const sportsContent = `
    <header style="padding:16px 20px 8px">
      <div class="kick">Sports</div>
      <h1 class="pagetitle">Cardio &amp; sport</h1>
    </header>

    <div style="padding:8px 20px 0">
      <div class="pager">
        <button class="pagerbtn" aria-label="Previous week">‹</button>
        <span class="pagerlbl">This week</span>
        <button class="pagerbtn" aria-label="Next week" disabled>›</button>
      </div>

      <div class="herokcal">
        <div class="t">Burned this week · sport &amp; cardio</div>
        <div class="v tabular">640<small>kcal</small></div>
      </div>
    </div>

    <div class="weekstrip">
${weekStrip}
    </div>

    <div style="display:flex;flex:1;flex-direction:column;padding:20px 20px 8px">
      <div class="dayhead">
        <h2 class="t">Wednesday 22 Jul</h2>
        <span class="v tabular">520 kcal</span>
      </div>

      <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
        <div class="actrow ghost">
          <span class="emoji">🏋️</span>
          <div class="main"><div class="n">Push</div><div class="d">13 sets logged · from Today</div></div>
          <span class="kcal tabular">210</span>
        </div>
        <div class="actrow ghost">
          <span class="emoji">🏃</span>
          <div class="main"><div class="n">Treadmill Walking</div><div class="d">cardio · from Today</div></div>
          <span class="kcal tabular">185</span>
        </div>
        <button class="actrow">
          <span class="emoji">🎾</span>
          <div class="main"><div class="n">Pickleball</div><div class="d">45 min</div></div>
          <span class="kcal accent tabular">125</span>
        </button>
      </div>

      <div class="stickyfoot" style="padding-left:0;padding-right:0">
        <button class="cta">+ Log activity</button>
      </div>
    </div>`;

/* ------------------------------- REHAB --------------------------------- */
const rehabRow = (name, target, level) => `<div class="rehabrow">
  <button class="open"><span style="min-width:0;flex:1">
    <span class="n">${name}</span><span class="t">${target}</span>
  </span>${lvl(level)}</button>
</div>`;

const rehabContent = `
    <header style="padding:16px 20px 8px">
      <div class="kick">Knees Over Toes</div>
      <h1 class="pagetitle">Rehab</h1>
      <p class="sub">Knee rehab &amp; mobility on the ATG method — full range, ground up, always pain-free.</p>
    </header>

    <div style="display:flex;flex-direction:column;gap:8px;padding:16px 20px 0">
      <div style="display:flex;align-items:baseline;justify-content:space-between">
        <h2 class="cardtitle">My lists</h2>
        <button style="background:none;border:0;font-size:12px;font-weight:600;color:rgb(var(--accent))">+ New list</button>
      </div>
      <button class="listcard">
        <span style="min-width:0;flex:1">
          <span class="n">Knee cap rehab</span>
          <span class="c">6 moves</span>
        </span>
        <span aria-hidden="true" style="flex:none;font-size:15px;color:rgb(var(--mute))">›</span>
      </button>
    </div>

    <div style="margin-top:20px;border-top:1px solid rgb(var(--border));padding-top:16px">
      <div style="position:sticky;top:0;z-index:10;background:rgb(var(--bg));padding:0 20px 12px">
        <div class="searchbox">
          ${svgSearch}
          <input placeholder="Search all moves…" aria-label="Search rehab exercises">
        </div>
      </div>

      <div style="padding-bottom:12px">
        <div class="chips no-scrollbar">
          <button class="chip on" aria-pressed="true">Knee cap rehab</button>
          <button class="chip">Knees Zero — start here</button>
          <button class="chip">Bulletproof knees</button>
          <button class="chip">Ankles, shins &amp; calves</button>
          <button class="chip">Hips &amp; hamstrings</button>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;padding:0 20px 24px">
        <p style="margin:0;font-size:12.5px;line-height:1.55;color:rgb(var(--dim))">Pain at or under the knee cap — jumper's knee, runner's knee, patellar tendinopathy. Build tolerance at both ends of the range, starting with the shin and the VMO.</p>
        <button class="ghostbtn" style="margin-bottom:4px">Make a list from “Knee cap rehab”</button>

${rehabRow("Backward Walking", "Knee blood flow · VMO · quads", 1)}
${rehabRow("Tibialis Raise", "Tibialis anterior (front of shin)", 1)}
${rehabRow("KOT Calf Raise", "Calf · big toe · ankle range", 1)}
${rehabRow("ATG Split Squat", "VMO · quads · hip flexor stretch", 2)}
${rehabRow("Patrick Step", "VMO · terminal knee extension", 2)}
${rehabRow("Poliquin Step-Up", "VMO · quads", 2)}
${rehabRow("Reverse Step-Down", "Eccentric quad control", 2)}
${rehabRow("Slant Board Squat", "Quads at full knee flexion", 3)}
${rehabRow("Backward Sled Drag", "Loaded knee conditioning", 3)}

        <p class="footnote" style="margin-top:16px">16 movements, summarised in our own words from the publicly taught Knees Over Toes / ATG progressions by Ben Patrick. Not affiliated with him, and not medical advice — if a knee is painful, swollen or unstable, get it looked at before loading it. Nothing here should hurt while you do it.</p>
      </div>
    </div>`;

/* -------------------------------- BODY --------------------------------- */
const measureRow = (label, value, unit) => `<div class="measure">
  <span class="l">${label}</span>
  <div class="ctrls">
    <button class="mbtn minus" aria-label="Decrease ${label.toLowerCase()}">−</button>
    <span class="mval"><b class="tabular">${value}</b><span>${unit}</span></span>
    <button class="mbtn plus" aria-label="Increase ${label.toLowerCase()}">+</button>
  </div>
</div>`;

const actOpt = (label, hint, factor, on = false) => `<button class="actopt${on ? " on" : ""}" aria-pressed="${on}">
  <span><span class="a">${label}</span><span class="b">${hint}</span></span>
  <span class="f tabular">×${factor}</span>
</button>`;

// BMI 23.4 on the 15–40 scale → 33.5% along; band widths at real proportions.
const bodyContent = `
    <header style="padding:16px 20px 8px">
      <div class="kick">You</div>
      <h1 class="pagetitle">Your body</h1>
      <p class="sub">Weight and height, and what they mean for daily food and water.</p>
    </header>

    <div style="display:flex;flex-direction:column;gap:12px;padding:16px 20px">
      <section class="card">
        <h2 class="cardtitle">Measurements</h2>
        <div class="cardbody" style="display:flex;flex-direction:column;gap:10px">
${measureRow("Weight", "74", "kg")}
${measureRow("Height", "178", "cm")}
${measureRow("Age", "29", "yr")}
        </div>
        <div style="margin-top:16px" class="seg">
          <button class="segbtn on" aria-pressed="true"><span class="l">Male</span></button>
          <button class="segbtn" aria-pressed="false"><span class="l">Female</span></button>
        </div>
      </section>

      <section class="card">
        <h2 class="cardtitle">Body mass index</h2>
        <div class="cardbody">
          <div class="bignum">
            <div class="v tabular">23.4</div>
            <div class="side">
              <div class="a">Healthy</div>
              <div class="b">Healthy for you: 59–79 kg</div>
            </div>
          </div>
          <div class="bmiscale">
            <div class="bmibar">
              <div style="width:14%;background:rgb(var(--accent));opacity:.28"></div>
              <div style="width:26%;background:rgb(var(--success))"></div>
              <div style="width:20%;background:rgb(var(--pr));opacity:.28"></div>
              <div style="width:40%;background:#e5484d;opacity:.28"></div>
            </div>
            <div class="bmimark" style="left:33.5%" aria-hidden="true"></div>
            <div class="bmilabels"><span>Under</span><span>Healthy</span><span>Over</span><span>Obese</span></div>
          </div>
          <p class="note">BMI only compares weight to height — it counts muscle as excess. If you lift, treat it as a rough screen, not a verdict.</p>
        </div>
      </section>

      <section class="card">
        <h2 class="cardtitle">How active are you?</h2>
        <div class="cardbody actpick">
${actOpt("Sedentary", "Desk day, little walking", "1.2")}
${actOpt("Light", "1–3 sessions a week", "1.375")}
${actOpt("Moderate", "3–5 sessions a week", "1.55", true)}
${actOpt("Active", "6–7 sessions a week", "1.725")}
${actOpt("Athlete", "Twice a day, physical job", "1.9")}
        </div>
      </section>

      <section class="card">
        <h2 class="cardtitle">Goal</h2>
        <div class="cardbody seg">
          <button class="segbtn" aria-pressed="false"><span class="l">Lose</span><span class="h">−15% kcal</span></button>
          <button class="segbtn on" aria-pressed="true"><span class="l">Maintain</span><span class="h">hold weight</span></button>
          <button class="segbtn" aria-pressed="false"><span class="l">Gain</span><span class="h">+10% kcal</span></button>
        </div>
      </section>

      <section class="card">
        <h2 class="cardtitle">Daily intake</h2>
        <div class="cardbody">
          <div class="intakehero">
            <div class="t">Eat per day · maintain</div>
            <div class="v tabular">2620<small>kcal</small></div>
          </div>
          <div class="tiles">
            <div class="tile"><div class="t">Resting</div><div class="v tabular">1687<small>kcal</small></div></div>
            <div class="tile"><div class="t">Maintenance</div><div class="v tabular">2620<small>kcal</small></div></div>
            <div class="tile"><div class="t">Protein</div><div class="v tabular">118<small>g</small></div></div>
          </div>
          <p class="note">Mifflin-St Jeor, ×1.55 for activity. Maintenance is what you burn on an average day — eat that and your weight holds. It is an estimate: weigh yourself weekly and adjust if the trend isn't moving.</p>
        </div>
      </section>

      <section class="card">
        <h2 class="cardtitle">Burned today</h2>
        <div class="cardbody">
          <div class="bignum">
            <div class="v tabular">2540<small>kcal</small></div>
            <div class="side">
              <div class="a">−80 kcal</div>
              <div class="b">vs maintenance</div>
            </div>
          </div>
          <div style="margin-top:14px;display:flex;flex-direction:column;gap:6px">
            <div class="burnrow"><span class="l">Just being awake (×1.2)</span><span class="v tabular">2025</span></div>
            <div class="burnrow"><span class="l">Push (lifting)</span><span class="v tabular">210</span></div>
            <div class="burnrow"><span class="l">Treadmill Walking</span><span class="v tabular">185</span></div>
            <div class="burnrow"><span class="l">Pickleball</span><span class="v tabular">125</span></div>
          </div>
          <p class="note">Two routes to the same number, so don't add them together. Maintenance guesses your training from the activity setting above; this counts the sessions you actually logged. On a rest day it lands below maintenance, on a hard day above — which is the useful part.</p>
        </div>
      </section>

      <section class="card">
        <h2 class="cardtitle">Water</h2>
        <div class="cardbody">
          <div class="bignum">
            <div class="v tabular" style="color:rgb(var(--accent))">2.9<small>L / day</small></div>
            <div class="side"><div class="b">≈ 12 glasses</div></div>
          </div>
          <p class="note">35 ml per kg, plus what a session costs in sweat. Add more in heat, and drink to thirst around training rather than forcing it.</p>
        </div>
      </section>
    </div>`;

/* ------------------------------ sheet shell ----------------------------- */
const sheetWrap = (title, subtitle, body) => `
  <div class="scrim" aria-hidden="true"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${title}">
    <div class="grab"></div>
    <button type="button" class="close" aria-label="Close">✕</button>
    <h3>${title}</h3>
    ${subtitle ? `<p class="subt">${subtitle}</p>` : ""}
    <div class="sbody">
${body}
    </div>
  </div>`;

const stepLg = (label, value, suffix) => `<div class="steplg">
  <button class="minus" aria-label="Decrease ${label}">−</button>
  <span class="val tabular">${value}<span>${suffix}</span></span>
  <button class="plus" aria-label="Increase ${label}">+</button>
</div>`;

const lrow = (label, inner) => `<div class="lrow"><span class="l">${label}</span>${inner}</div>`;

/* --------------------- static ProgressChart (bench) --------------------- */
function progressChart() {
  const W = 300, H = 96, PAD = { l: 30, r: 10, t: 12, b: 20 };
  const pts = [
    ["2026-05-20", 50], ["2026-05-27", 52.5], ["2026-06-03", 52.5], ["2026-06-12", 55],
    ["2026-06-19", 55], ["2026-06-26", 57.5], ["2026-07-03", 57.5], ["2026-07-10", 57.5],
    ["2026-07-17", 57.5], ["2026-07-22", 60],
  ];
  const times = pts.map(([d]) => new Date(d + "T00:00:00").getTime());
  const tMin = times[0], span = times[times.length - 1] - tMin;
  const kgs = pts.map(([, k]) => k);
  let lo = Math.min(...kgs), hi = Math.max(...kgs);
  const head = (hi - lo) * 0.15; lo = Math.max(0, lo - head); hi += head;
  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
  const xy = pts.map(([, k], i) => [
    PAD.l + ((times[i] - tMin) / span) * plotW,
    PAD.t + (1 - (k - lo) / (hi - lo)) * plotH,
  ]);
  const line = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${xy[xy.length - 1][0].toFixed(1)} ${H - PAD.b} L${xy[0][0].toFixed(1)} ${H - PAD.b} Z`;
  const fmt = (v) => (Number.isInteger(v) ? v : v.toFixed(1));
  const dots = xy.map(([x, y], i) => {
    const on = i === xy.length - 1;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 4.5 : 2.5}" fill="${on ? "rgb(var(--accent))" : "rgb(var(--surface2))"}" stroke="rgb(var(--accent))" stroke-width="2"/>`;
  }).join("");
  return `<div class="panel">
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px">
      <span class="paneltitle">Working weight</span>
      <span style="font-size:11px;color:rgb(var(--dim))">10 sessions</span>
    </div>
    <div style="margin-top:6px;display:flex;align-items:baseline;gap:10px">
      <span class="display" style="font-size:32px;font-weight:900;line-height:1">60<span style="margin-left:4px;font-size:15px;font-weight:700;color:rgb(var(--dim))">kg</span></span>
      <span style="font-size:13px;font-weight:700;color:rgb(var(--success))">+2.5kg<span style="margin-left:4px;font-weight:500;color:rgb(var(--dim))">since last</span></span>
    </div>
    <div style="margin-top:4px;font-size:12px;color:rgb(var(--dim))">Wed 22 Jul · 4 × 8</div>
    <svg viewBox="0 0 ${W} ${H}" style="margin-top:8px;width:100%;height:auto" role="img" aria-label="Working weight over 10 sessions, from 50kg to 60kg">
      <defs><linearGradient id="pcFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgb(var(--accent))" stop-opacity=".22"/>
        <stop offset="100%" stop-color="rgb(var(--accent))" stop-opacity="0"/>
      </linearGradient></defs>
      <line x1="${PAD.l}" x2="${W - PAD.r}" y1="${PAD.t}" y2="${PAD.t}" stroke="rgb(var(--border))" stroke-width="1"/>
      <line x1="${PAD.l}" x2="${W - PAD.r}" y1="${H - PAD.b}" y2="${H - PAD.b}" stroke="rgb(var(--border))" stroke-width="1"/>
      <text x="${PAD.l - 6}" y="${PAD.t + 3}" text-anchor="end" fill="rgb(var(--dim))" style="font-size:9px">${fmt(hi)}</text>
      <text x="${PAD.l - 6}" y="${H - PAD.b + 3}" text-anchor="end" fill="rgb(var(--dim))" style="font-size:9px">${fmt(lo)}</text>
      <path d="${area}" fill="url(#pcFill)"/>
      <path d="${line}" fill="none" stroke="rgb(var(--accent))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
      <text x="${PAD.l}" y="${H - 6}" text-anchor="start" fill="rgb(var(--dim))" style="font-size:9px">Wed 20 May</text>
      <text x="${W - PAD.r}" y="${H - 6}" text-anchor="end" fill="rgb(var(--dim))" style="font-size:9px">Wed 22 Jul</text>
    </svg>
  </div>`;
}

/* ---------------------------- LogSheet (strength) ----------------------- */
const logExerciseSheet = sheetWrap("Log this exercise", "", `
      <div style="display:flex;align-items:center;gap:12px" class="panel">
        <button class="thumb" style="width:46px;height:46px" aria-label="See how to do Bench Press">🏋️</button>
        <div style="min-width:0;flex:1">
          <div class="truncate" style="font-size:15px;font-weight:700">Bench Press</div>
          <div style="margin-top:4px">${tag("chest", "Chest")}</div>
        </div>
      </div>

      <div class="ghostcard" style="margin-top:12px">
        <div class="t">Last time</div>
        <p>You logged <b>57.5kg</b> Fri 17 Jul — that's the number to beat.</p>
      </div>

      <div style="margin-top:12px">${progressChart()}</div>

      <div class="panel" style="margin-top:12px">
        <h4 class="paneltitle">Today</h4>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:12px">
${lrow("Sets", stepLg("sets", "4", " sets"))}
${lrow("Reps", stepLg("reps", "8", " reps"))}
${lrow("Weight", stepLg("weight", "60", " kg"))}
        </div>
        <button class="dashbtn" style="margin-top:12px">Match last time — 57.5kg</button>
        <button class="dashbtn" style="margin-top:8px">Add 2.5kg — 60kg</button>
      </div>

      <button class="sheetcta">Save &amp; mark done</button>
      <button class="quietbtn">Save without marking done</button>`);

/* ----------------------------- LogSheet (cardio) ------------------------ */
const logCardioSheet = sheetWrap("Log this cardio", "", `
      <div style="display:flex;align-items:center;gap:12px" class="panel">
        <button class="thumb" style="width:46px;height:46px" aria-label="See how to do Treadmill Walking">🏃</button>
        <div style="min-width:0;flex:1">
          <div class="truncate" style="font-size:15px;font-weight:700">Treadmill Walking</div>
          <div style="margin-top:4px">${tag("cardio", "Cardio")}</div>
        </div>
      </div>

      <div class="ghostcard" style="margin-top:12px">
        <div class="t">Last time</div>
        <p><b>20 min · 5.5 km/h · 10%</b> Mon 20 Jul — about 185 kcal.</p>
      </div>

      <div class="panel" style="margin-top:12px">
        <h4 class="paneltitle">Today</h4>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:12px">
${lrow("Time", stepLg("minutes", "20", " min"))}
${lrow("Speed", stepLg("speed", "5.5", " km/h"))}
${lrow("Incline", stepLg("incline", "10", "%"))}
        </div>
        <button class="dashbtn" style="margin-top:12px">Match last time — 20 min · 5.5 km/h · 10%</button>
      </div>

      <div class="ghostcard" style="margin-top:12px;text-align:center">
        <div class="t">Approx. burn</div>
        <div class="display tabular" style="margin-top:4px;font-size:38px;font-weight:700;line-height:1">185<span style="margin-left:6px;font-size:13px;font-weight:600;color:rgb(var(--dim))">kcal</span></div>
        <p style="margin:6px 0 0;font-size:11px;color:rgb(var(--mute))">5.5 km/h at 10% · ACSM walking equation</p>
      </div>

      <button class="sheetcta">Save &amp; mark done</button>
      <button class="quietbtn">Save without marking done</button>`);

/* ----------------------------- ExercisePicker --------------------------- */
const GROUP_CHIPS = [
  ["Chest", "#e5484d", true], ["Back", "#0090ff"], ["Legs", "#ffc53d"], ["Shoulders", "#00a2c7"],
  ["Biceps", "#f76b15"], ["Triceps", "#d6409f"], ["Core", "#bdee63"], ["Cardio", "#46a758"],
  ["Mobility", "#12a594"], ["Yoga", "#8e4ec6"],
];
const pickRow = (emoji, name, group, glabel, equipment, added) => `<div class="pickrow">
  <button class="thumb" style="width:42px;height:42px;border-radius:10px" aria-label="See how to do ${name}">${emoji}</button>
  <div style="min-width:0;flex:1">
    <div class="truncate" style="font-size:14.5px;font-weight:600">${name}</div>
    <div style="margin-top:2px;display:flex;align-items:center;gap:8px">${tag(group, glabel)}<span class="truncate" style="font-size:11px;color:rgb(var(--dim))">${equipment}</span></div>
  </div>
  <button class="${added ? "addedbtn" : "addbtn"}" aria-pressed="${added}">${added ? "✓ Added" : "Add"}</button>
</div>`;

const pickerSheet = sheetWrap("Add exercise", "Tap to add to Push. 873 moves available offline.", `
      <div style="margin:0 0 12px">
        <input class="authinput" placeholder="Search all exercises…" aria-label="Search all exercises">
      </div>
      <div style="border-bottom:1px solid rgb(var(--border));padding-bottom:12px;margin:0 -16px">
        <div class="chips no-scrollbar" style="padding:0 16px">
          ${GROUP_CHIPS.map(([n, c, on]) => `<button class="chip${on ? " on" : ""}" aria-pressed="${!!on}"><span style="display:inline-block;height:6px;width:6px;border-radius:99px;background:${on ? "rgb(var(--on-accent))" : c};margin-right:8px"></span>${n}</button>`).join("\n          ")}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;padding-top:12px">
${pickRow("🏋️", "Bench Press", "chest", "Chest", "barbell", true)}
${pickRow("🏋️", "Incline Dumbbell Press", "chest", "Chest", "dumbbell", true)}
${pickRow("🏋️", "Chest Dip", "chest", "Chest", "body only", false)}
${pickRow("🏋️", "Cable Crossover", "chest", "Chest", "cable", false)}
${pickRow("🏋️", "Push-Up", "chest", "Chest", "body only", false)}
${pickRow("🏋️", "Machine Chest Press", "chest", "Chest", "machine", false)}
      </div>`);

/* ----------------------------- ExerciseDetail --------------------------- */
const detailSheet = sheetWrap("Bench Press", "", `
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
        ${tag("chest", "Chest")}
        <span style="font-size:12px;color:rgb(var(--dim))">barbell</span>
        <span style="font-size:12px;color:rgb(var(--dim));text-transform:capitalize">· beginner</span>
      </div>
      <div style="margin-top:12px">
        <div style="position:relative;overflow:hidden;border-radius:20px;background:rgb(var(--surface2));aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;font-size:44px">🏋️
          <span style="position:absolute;left:8px;top:8px;border-radius:6px;background:rgba(0,0,0,.65);padding:4px 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#fff">Start</span>
        </div>
        <div style="margin-top:8px;display:flex;gap:8px">
          <button style="height:6px;flex:1;border:0;border-radius:99px;background:rgb(var(--accent))" aria-label="Show frame 1" aria-pressed="true"></button>
          <button style="height:6px;flex:1;border:0;border-radius:99px;background:rgb(var(--border))" aria-label="Show frame 2"></button>
        </div>
      </div>
      <ol style="margin:16px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:12px">
        ${[
          "Lie back on a flat bench holding a barbell with a medium-width grip.",
          "Lower the bar slowly until it touches your middle chest.",
          "Press the bar back up to the starting position, breathing out.",
          "Lock out at the top for a brief pause, then repeat.",
        ].map((s, i) => `<li style="display:flex;gap:12px"><span style="flex:none;display:flex;height:24px;width:24px;align-items:center;justify-content:center;border-radius:99px;background:rgb(var(--accent));font-size:12px;font-weight:700;color:rgb(var(--on-accent))">${i + 1}</span><span style="font-size:13.5px;line-height:1.6;color:rgb(var(--dim))">${s}</span></li>`).join("\n        ")}
      </ol>
      <a href="#" class="sheetcta" style="display:flex;align-items:center;justify-content:center;gap:8px;height:auto;padding:14px 0;font-size:15px;text-decoration:none;border-radius:12px"><span aria-hidden="true">▶</span> Watch form videos</a>
      <button class="quietbtn" style="padding:14px 0;font-size:15px;color:rgb(var(--text));background:rgb(var(--surface2));border:0">Close</button>`);

/* ---------------------------- LogActivitySheet -------------------------- */
const SPORTS = [
  ["🏃", "Running", true], ["🚶", "Walking"], ["⛰️", "Incline walk"], ["🚲", "Cycling"],
  ["🥒", "Pickleball"], ["🎾", "Tennis"], ["🏸", "Badminton"], ["🎯", "Squash"],
  ["⚽", "Football"], ["🏀", "Basketball"], ["🏏", "Cricket"], ["🏊", "Swimming"],
  ["🔥", "HIIT / circuits"], ["🪢", "Skipping"], ["🧘", "Yoga"], ["🤸", "Stretching"],
];
const activitySheet = sheetWrap("Log activity", "Calories are estimated from your bodyweight.", `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${SPORTS.map(([e, l, on]) => `<button style="display:flex;flex-direction:column;align-items:center;gap:4px;border-radius:12px;border:1px solid ${on ? "rgb(var(--accent))" : "rgb(var(--border))"};background:${on ? "rgb(var(--accent))" : "rgb(var(--surface2))"};color:${on ? "rgb(var(--on-accent))" : "inherit"};padding:10px 4px" aria-pressed="${!!on}"><span style="font-size:19px;line-height:1">${e}</span><span style="text-align:center;font-size:10px;font-weight:700;line-height:1.2;${on ? "" : "color:rgb(var(--dim))"}">${l}</span></button>`).join("\n        ")}
      </div>
      <div style="margin-top:16px;display:flex;gap:6px">
        <button class="segbtn">Easy</button>
        <button class="segbtn on" aria-pressed="true">Moderate</button>
        <button class="segbtn">Hard</button>
      </div>
      <div class="panel" style="margin-top:12px">
        <div style="display:flex;flex-direction:column;gap:12px">
${lrow("Duration", stepLg("minutes", "30", " min"))}
${lrow("Distance", stepLg("distance", "5", " km"))}
        </div>
        <p style="margin:12px 0 0;text-align:center;font-size:12px;font-weight:600;color:rgb(var(--mute))">6:00 /km</p>
      </div>
      <div class="ghostcard" style="margin-top:12px;text-align:center">
        <div class="t">Approx. burn</div>
        <div class="display tabular" style="margin-top:4px;font-size:38px;font-weight:700;line-height:1">380<span style="margin-left:6px;font-size:13px;font-weight:600;color:rgb(var(--dim))">kcal</span></div>
      </div>
      <button class="sheetcta">Save activity</button>
      <p style="margin:16px 0 0;text-align:center;font-size:11px;line-height:1.5;color:rgb(var(--mute))">Estimates from published MET values and the ACSM walking equation. Expect them to be within about a fifth of the truth — good enough for a weekly trend, not for balancing a diet to the calorie.</p>`);

/* ------------------------------ Rehab detail ---------------------------- */
const rehabDetailSheet = sheetWrap("ATG Split Squat", "VMO · quads · hip flexor stretch", `
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${lvl(2)}
        ${["Knee cap rehab", "Knees Zero — start here", "Bulletproof knees", "Hips &amp; hamstrings"].map((p) => `<span class="lvltag" style="background:rgb(var(--surface2));color:rgb(var(--dim))">${p}</span>`).join("\n        ")}
      </div>
      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="border-radius:12px;background:rgb(var(--surface2));padding:10px 12px">
          <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgb(var(--mute))">Dose</div>
          <div style="margin-top:4px;font-size:13px;font-weight:600">3 × 5–10 each side</div>
        </div>
        <div style="border-radius:12px;background:rgb(var(--surface2));padding:10px 12px">
          <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgb(var(--mute))">Equipment</div>
          <div style="margin-top:4px;font-size:13px;font-weight:600">A step or two, something to hold onto</div>
        </div>
      </div>
      <h4 class="paneltitle" style="margin-top:16px;color:rgb(var(--mute))">Why it's here</h4>
      <p style="margin:6px 0 0;font-size:13.5px;line-height:1.55;color:rgb(var(--dim))">The signature movement. The front knee travels well past the toes under control, which is precisely the position everyone is told to avoid — and precisely the position a knee needs to be strong in if it's going to survive stairs, hills and sport.</p>
      <h4 class="paneltitle" style="margin-top:16px;color:rgb(var(--mute))">Get it right</h4>
      <ul style="margin:6px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px">
        ${[
          "Front hamstring should touch the calf at the bottom. If it can't, elevate the front foot and work down.",
          "Back knee stays straight and the rear hip opens — that stretch is half the exercise.",
          "Hold a rail. Assisting it is how you earn the range, not cheating.",
        ].map((c) => `<li style="display:flex;gap:8px;font-size:13.5px;line-height:1.5"><span aria-hidden="true" style="flex:none;padding-top:3px;color:rgb(var(--accent))">▸</span><span style="color:rgb(var(--dim))">${c}</span></li>`).join("\n        ")}
      </ul>
      <h4 class="paneltitle" style="margin-top:16px;color:rgb(var(--mute))">Save to list</h4>
      <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px">
        <button style="border-radius:99px;border:1px solid rgb(var(--accent));background:rgb(var(--accent));color:rgb(var(--on-accent));padding:6px 12px;font-size:12.5px;font-weight:600" aria-pressed="true">✓ Knee cap rehab</button>
      </div>
      <a href="#" class="sheetcta" style="display:flex;align-items:center;justify-content:center;height:auto;padding:12px 0;font-size:13.5px;text-decoration:none;border-radius:12px">Watch on YouTube ↗</a>
      <p style="margin:8px 0 0;text-align:center;font-size:11px;color:rgb(var(--mute))">Opens a search of his channel, so you always get a live video.</p>`);

/* ------------------------------ Rehab list ------------------------------ */
const rehabListSheet = sheetWrap("Knee cap rehab", "6 moves. Tap one for cues and a video.", `
      <input class="authinput" value="Knee cap rehab" aria-label="Rename list" style="margin-bottom:12px;font-weight:600;font-size:14px">
      <div style="display:flex;flex-direction:column;gap:8px">
        ${[
          ["Backward Walking", "Knee blood flow · VMO · quads", 1],
          ["Tibialis Raise", "Tibialis anterior (front of shin)", 1],
          ["KOT Calf Raise", "Calf · big toe · ankle range", 1],
          ["ATG Split Squat", "VMO · quads · hip flexor stretch", 2],
          ["Patrick Step", "VMO · terminal knee extension", 2],
          ["Slant Board Squat", "Quads at full knee flexion", 3],
        ].map(([n, t, l]) => `<div class="rehabrow"><button class="open"><span style="min-width:0;flex:1"><span class="n">${n}</span><span class="t">${t}</span></span>${lvl(l)}</button><button style="width:40px;height:40px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:12px;border:0;background:none;font-size:16px;color:rgb(var(--mute))" aria-label="Remove ${n}">✕</button></div>`).join("\n        ")}
      </div>
      <button class="sheetcta" style="height:auto;padding:12px 0;font-size:13.5px;border-radius:12px;margin-top:12px">+ Add exercises</button>
      <button class="quietbtn" style="color:rgb(var(--mute))">Delete list</button>`);

/* ---------------------------- Session history --------------------------- */
const historyRows = [
  ["Tue 21 Jul", "Legs", "4/5", false], ["Mon 20 Jul", "Pull", "6/6", true], ["Sat 18 Jul", "Push", "5/5", true],
  ["Fri 17 Jul", "Push", "5/5", true], ["Thu 16 Jul", "Legs", "3/5", false], ["Wed 15 Jul", "Pull", "6/6", true],
  ["Mon 13 Jul", "Push", "5/5", true], ["Sat 11 Jul", "Legs", "5/5", true],
];
const historySheet = sheetWrap("Session history", "23 logged sessions, newest first.", `
      <div style="display:flex;flex-direction:column;gap:8px;padding-top:4px">
        ${historyRows.map(([d, w, c, full]) => `<div class="sessrow"><span class="l">${d} <i>· ${w}</i></span><span class="v ${full ? "ok" : "part"} tabular">${c} done</span></div>`).join("\n        ")}
      </div>`);

/* -------------------------------- login --------------------------------- */
const loginContent = `
    <div style="display:flex;min-height:100%;flex-direction:column;justify-content:center;padding:40px 24px">
      <div class="display" style="font-size:15px;font-weight:900;letter-spacing:.14em">GYM<span style="color:rgb(var(--accent))">·</span>LOG</div>
      <h1 class="display" style="margin:24px 0 0;font-size:34px;font-weight:900;text-transform:uppercase;line-height:.95;letter-spacing:-.02em">Welcome back</h1>
      <p style="margin:8px 0 0;font-size:13px;color:rgb(var(--dim))">Your plan and history sync across every device.</p>
      <form style="margin-top:28px;display:flex;flex-direction:column;gap:12px">
        <input class="authinput" type="email" placeholder="Email" autocomplete="email">
        <input class="authinput" type="password" placeholder="Password" autocomplete="current-password">
        <button type="submit" class="sheetcta" style="margin-top:4px;height:auto;padding:14px 16px;font-size:15px;border-radius:12px">Log in</button>
      </form>
      <div style="margin:20px 0;display:flex;align-items:center;gap:12px;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:rgb(var(--dim))">
        <span style="height:1px;flex:1;background:rgb(var(--border))"></span> or <span style="height:1px;flex:1;background:rgb(var(--border))"></span>
      </div>
      <button style="display:flex;align-items:center;justify-content:center;gap:12px;border-radius:12px;border:1px solid rgb(var(--border));background:rgb(var(--surface));padding:14px 16px;font-size:15px;font-weight:600">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.0 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.0 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37.0 40.3 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
        Continue with Google
      </button>
      <div style="margin-top:28px;display:flex;flex-direction:column;gap:8px;font-size:13px;color:rgb(var(--dim))">
        <button style="background:none;border:0;padding:0;text-align:left;color:inherit;font-size:13px">New here? <span style="font-weight:600;color:rgb(var(--text))">Create an account</span></button>
        <button style="background:none;border:0;padding:0;text-align:left;color:inherit;font-size:13px">Forgot your password?</button>
      </div>
    </div>`;

/* -------------------------------- emit --------------------------------- */
const pages = [
  ["today.html", "GymLog — Today", "today", false, todayContent],
  ["rehab.html", "GymLog — Rehab", "rehab", false, rehabContent],
  ["sports.html", "GymLog — Sports", "sports", false, sportsContent],
  ["stats.html", "GymLog — Stats", "stats", false, statsContent],
  ["body.html", "GymLog — Your body", "today", true, bodyContent],
  ["login.html", "GymLog — Log in", "today", false, loginContent, "", true],
  ["log-exercise.html", "GymLog — Log exercise sheet", "today", false, todayContent, logExerciseSheet],
  ["log-cardio.html", "GymLog — Log cardio sheet", "today", false, todayContent, logCardioSheet],
  ["add-exercise.html", "GymLog — Add exercise sheet", "today", false, todayContent, pickerSheet],
  ["exercise-detail.html", "GymLog — Exercise detail sheet", "today", false, todayContent, detailSheet],
  ["log-activity.html", "GymLog — Log activity sheet", "sports", false, sportsContent, activitySheet],
  ["rehab-detail.html", "GymLog — Rehab exercise sheet", "rehab", false, rehabContent, rehabDetailSheet],
  ["rehab-list.html", "GymLog — Rehab list sheet", "rehab", false, rehabContent, rehabListSheet],
  ["session-history.html", "GymLog — Session history sheet", "stats", false, statsContent, historySheet],
];

for (const [file, title, active, bodyActive, content, overlay = "", bare = false] of pages) {
  writeFileSync(`${OUT}/${file}`, shell({ title, active, bodyActive, content, overlay, bare }));
  console.log("wrote", file);
}
