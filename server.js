/**
 * YT2Top — YouTube to Top4Top Uploader
 * Jalankan: node server.js
 * Buka:     http://localhost:3000
 *
 * Install dulu:
 *   npm install express axios axios-cookiejar-support cheerio tough-cookie form-data cors
 *   sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod +x /usr/local/bin/yt-dlp
 */

import express from "express";
import axios from "axios";
import FormData from "form-data";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const execAsync = promisify(exec);
const app = express();
app.use(express.json());
app.use(express.static("public"));

// ─── HTML Frontend (inline) ──────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>KaiShiuee Convert</title>
  <link rel="icon" type="image/png" href="/assets/logo.png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#050a18;--surface:rgba(8,20,40,.60);--surface2:rgba(8,25,50,.72);
      --border:rgba(80,160,255,.20);--border-strong:rgba(76,201,255,.42);
      --accent:#3b82f6;--electric:#4cc9ff;--text:#f5f9ff;--text2:#a8b8d0;--text3:#7489a8;
      --success:#45d7b0;--error:#ff6b87;
      --shadow:0 20px 60px rgba(0,4,16,.42),0 1px 0 rgba(255,255,255,.05) inset;
      --shadow-lg:0 24px 80px rgba(0,4,18,.52),0 0 38px rgba(59,130,246,.10);
      --radius:20px;--radius-sm:11px;
    }
    html{scroll-behavior:smooth;background:var(--bg)}
    body{
      font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--text);
      min-height:100vh;display:flex;flex-direction:column;align-items:center;
      padding:24px 16px 64px;position:relative;overflow-x:hidden;
    }
    .background-video,.video-overlay,.scene-glow,.vignette{
      position:fixed;inset:0;width:100%;height:100%;pointer-events:none;
    }
    .background-video{
      object-fit:cover;z-index:0;filter:brightness(.48) saturate(.72) contrast(1.09);
    }
    .video-overlay{
      z-index:1;background:
        linear-gradient(120deg,rgba(11,76,145,.20),rgba(0,30,75,.18) 48%,rgba(17,85,155,.16)),
        linear-gradient(180deg,rgba(3,9,24,.58),rgba(3,8,20,.78));
      mix-blend-mode:multiply;
    }
    .scene-glow{
      z-index:2;background:radial-gradient(circle at 50% 46%,rgba(50,135,255,.24),rgba(13,55,120,.08) 31%,transparent 60%);
    }
    .vignette{
      z-index:3;background:radial-gradient(ellipse at center,transparent 42%,rgba(2,7,18,.22) 68%,rgba(2,6,16,.68) 100%);
    }
    .wrapper{width:100%;max-width:560px;position:relative;z-index:4}
    header{text-align:center;padding:48px 0 36px;text-shadow:0 3px 22px rgba(0,5,18,.65)}
    .logo-chip{
      display:inline-flex;align-items:center;gap:8px;background:rgba(8,28,58,.66);color:var(--electric);
      border:1px solid var(--border-strong);font-family:'Space Mono',monospace;font-weight:700;
      font-size:12px;letter-spacing:.1em;padding:7px 15px;border-radius:100px;margin-bottom:20px;
      box-shadow:0 8px 28px rgba(0,18,55,.34),0 0 18px rgba(76,201,255,.10);
      backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
    }
    h1{font-size:clamp(28px,6vw,40px);font-weight:800;line-height:1.15;letter-spacing:-.02em;margin-bottom:12px}
    h1 span{color:var(--electric);text-shadow:0 0 24px rgba(76,201,255,.24)}
    .subtitle{font-size:15px;color:var(--text2);line-height:1.6;max-width:440px;margin:0 auto}
    .card,#resultCard,.info-tag{
      background:var(--surface);border:1px solid var(--border);
      backdrop-filter:blur(22px) saturate(1.15);-webkit-backdrop-filter:blur(22px) saturate(1.15);
    }
    .card{
      border-radius:var(--radius);box-shadow:var(--shadow);padding:28px 28px 24px;
      transition:border-color .25s,box-shadow .25s;position:relative;
    }
    .card::before{
      content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
      background:linear-gradient(145deg,rgba(255,255,255,.055),transparent 38%);
    }
    .card:hover{border-color:rgba(80,160,255,.30);box-shadow:var(--shadow-lg)}
    .input-label{font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text2);margin-bottom:10px;display:block}
    .input-row{display:flex;gap:8px;align-items:stretch}
    .input-wrap{position:relative;flex:1;min-width:0}
    .yt-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none;transition:color .2s}
    #ytUrl{
      width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);
      padding:14px 16px 14px 44px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;
      color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s,background .2s;
    }
    #ytUrl::placeholder{color:var(--text3)}
    #ytUrl:focus{border-color:var(--border-strong);box-shadow:0 0 0 4px rgba(59,130,246,.14);background:rgba(7,24,49,.88)}
    .input-wrap:focus-within .yt-icon{color:var(--electric)}
    .paste-btn{
      flex-shrink:0;background:rgba(12,36,70,.70);border:1px solid var(--border);border-radius:var(--radius-sm);
      padding:0 16px;cursor:pointer;color:var(--text2);font-family:'Plus Jakarta Sans',sans-serif;
      font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;
      transition:all .2s;white-space:nowrap;
    }
    .paste-btn:hover{background:rgba(24,61,109,.72);border-color:var(--border-strong);color:var(--text);transform:translateY(-1px)}
    .divider{height:1px;background:var(--border);margin:20px 0}
    #generateBtn{
      width:100%;background:linear-gradient(135deg,var(--accent) 0%,#1769dc 55%,#0756c5 100%);color:var(--text);border:1px solid rgba(116,202,255,.32);
      border-radius:var(--radius-sm);padding:16px 24px;font-family:'Plus Jakarta Sans',sans-serif;
      font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;
      justify-content:center;gap:10px;transition:all .2s;
      box-shadow:0 8px 26px rgba(26,104,224,.32),0 1px 0 rgba(255,255,255,.18) inset;
      position:relative;overflow:hidden;
    }
    #generateBtn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.14) 0%,transparent 55%);pointer-events:none}
    #generateBtn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 34px rgba(30,128,245,.42),0 0 22px rgba(76,201,255,.12)}
    #generateBtn:active:not(:disabled){transform:translateY(0)}
    #generateBtn:disabled{opacity:.7;cursor:not-allowed;transform:none}
    .spinner{width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-top-color:var(--text);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
    @keyframes spin{to{transform:rotate(360deg)}}
    .steps-wrap{margin-top:20px;display:none}
    .step-row{display:flex;align-items:center;gap:12px;padding:9px 0;opacity:.32;transition:opacity .3s,transform .3s}
    .step-row.active{opacity:1;transform:translateX(4px)}
    .step-row.done{opacity:.62}
    .step-dot{
      width:28px;height:28px;border-radius:50%;background:var(--surface2);border:1px solid var(--border);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
      font-size:11px;font-weight:700;color:var(--text3);transition:all .3s;
    }
    .step-row.active .step-dot{background:rgba(59,130,246,.16);border-color:var(--electric);color:var(--electric);box-shadow:0 0 16px rgba(76,201,255,.12)}
    .step-row.done .step-dot{background:var(--success);border-color:var(--success);color:#051622}
    .step-check{display:none}
    .step-row.done .step-check{display:block}
    .step-row.done .step-num{display:none}
    .step-text{font-size:13.5px;font-weight:500;color:var(--text2)}
    .step-row.active .step-text{color:var(--text);font-weight:600}
    .step-spin{margin-left:auto;width:14px;height:14px;border:2px solid var(--border);border-top-color:var(--electric);border-radius:50%;animation:spin .7s linear infinite;display:none}
    .step-row.active .step-spin{display:block}
    .info-strip{display:flex;gap:8px;margin-top:16px}
    .info-tag{flex:1;border-radius:var(--radius-sm);padding:12px 14px;text-align:center;box-shadow:0 10px 30px rgba(0,5,18,.18)}
    .info-tag-icon{font-size:18px;margin-bottom:4px;filter:saturate(.72)}
    .info-tag-label{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em}
    .info-tag-val{font-size:13px;font-weight:600;color:var(--text);margin-top:2px}
    #resultCard{
      display:none;border-radius:var(--radius);box-shadow:var(--shadow);padding:24px;margin-top:16px;
      animation:slideUp .4s cubic-bezier(.16,1,.3,1);
    }
    @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    .result-label{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--success);display:flex;align-items:center;gap:6px;margin-bottom:14px}
    .result-title{font-size:14px;color:var(--text2);margin-bottom:4px;font-weight:500}
    .result-title strong{color:var(--text)}
    .link-box{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 16px;display:flex;align-items:center;gap:10px;margin-top:12px}
    .link-text{flex:1;font-family:'Space Mono',monospace;font-size:12px;color:var(--text);word-break:break-all;line-height:1.5}
    .copy-btn{
      flex-shrink:0;background:var(--accent);color:var(--text);border:1px solid rgba(120,207,255,.28);border-radius:8px;padding:8px 14px;
      font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;font-weight:700;cursor:pointer;
      display:flex;align-items:center;gap:6px;transition:all .2s;box-shadow:0 4px 14px rgba(59,130,246,.25);
    }
    .copy-btn:hover{background:#2477ed;transform:translateY(-1px)}
    .open-btn{
      display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:10px;
      background:transparent;border:1px solid var(--border);border-radius:var(--radius-sm);
      padding:11px 16px;font-family:'Plus Jakarta Sans',sans-serif;font-size:13.5px;font-weight:600;
      color:var(--text2);cursor:pointer;text-decoration:none;transition:all .2s;
    }
    .open-btn:hover{border-color:var(--border-strong);color:var(--electric);background:rgba(59,130,246,.08)}
    #errorCard{
      display:none;background:rgba(46,12,34,.74);border:1px solid rgba(255,107,135,.34);border-radius:var(--radius);
      padding:18px 20px;margin-top:16px;align-items:flex-start;gap:12px;
      backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);animation:slideUp .3s ease;
    }
    .error-icon{color:var(--error);flex-shrink:0;margin-top:1px}
    .error-msg{font-size:13.5px;color:#ffb1c0;line-height:1.55;font-weight:500}
    footer{margin-top:40px;text-align:center;font-size:12.5px;color:var(--text3);text-shadow:0 2px 12px rgba(0,0,0,.8)}
    .toast{
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);
      background:rgba(5,16,34,.92);color:var(--text);border:1px solid var(--border);padding:10px 20px;border-radius:100px;
      font-size:13.5px;font-weight:600;box-shadow:0 8px 28px rgba(0,0,0,.38);
      backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
      transition:transform .35s cubic-bezier(.16,1,.3,1);z-index:999;white-space:nowrap;
    }
    .toast.show{transform:translateX(-50%) translateY(0)}
    @media(max-width:480px){
      body{padding:12px 12px 44px}.background-video{object-position:center center}
      header{padding:38px 8px 28px}.card{padding:22px 18px 20px}
      .input-row{flex-direction:column}.paste-btn{min-height:42px;justify-content:center}
      .info-tag{padding:11px 7px}.link-box{align-items:stretch;flex-direction:column}.copy-btn{justify-content:center}
    }
  </style>
</head>
<body>
<video class="background-video" autoplay muted loop playsinline preload="auto" aria-hidden="true" disablepictureinpicture>
  <source src="/assets/background.mp4" type="video/mp4"/>
</video>
<div class="video-overlay" aria-hidden="true"></div>
<div class="scene-glow" aria-hidden="true"></div>
<div class="vignette" aria-hidden="true"></div>
<div class="wrapper">
  <header>
    <div class="logo-chip">⚡ YT2TOP</div>
    <h1>Buat link <span>Top4Top</span><br/>secara instan!</h1>
    <p class="subtitle">Sebuah website yang memudahkan kamu untuk membuat link boombox dari link youtube!</p>
  </header>

  <div class="card">
    <label class="input-label" for="ytUrl">🔗 Link Video YouTube</label>
    <div class="input-row">
      <div class="input-wrap">
        <svg class="yt-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.8C6.8 19 12 19 12 19s4.8 0 7-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM10 15V9l5.5 3-5.5 3z"/>
        </svg>
        <input type="text" id="ytUrl" placeholder="Masukan link disini sayang" autocomplete="off" spellcheck="false"/>
      </div>
      <button class="paste-btn" id="pasteBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="4" y="6" width="16" height="16" rx="2"/><path d="M9 12h6M9 16h4"/></svg>
        Paste
      </button>
    </div>
    <div class="divider"></div>
    <button id="generateBtn">
      <svg id="btnIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-2 14.5v-9l6 4.5z"/>
      </svg>
      <span id="btnText">Generate &amp; Upload</span>
    </button>
    <div class="steps-wrap" id="stepsWrap">
      <div class="step-row" id="step1">
        <div class="step-dot"><span class="step-num">1</span><svg class="step-check" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <span class="step-text">Mengambil info video YouTube</span>
        <div class="step-spin"></div>
      </div>
      <div class="step-row" id="step2">
        <div class="step-dot"><span class="step-num">2</span><svg class="step-check" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <span class="step-text">Download &amp; konversi ke MP3</span>
        <div class="step-spin"></div>
      </div>
      <div class="step-row" id="step3">
        <div class="step-dot"><span class="step-num">3</span><svg class="step-check" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <span class="step-text">Upload ke Top4Top</span>
        <div class="step-spin"></div>
      </div>
    </div>
  </div>

  <div class="info-strip">
    <div class="info-tag"><div class="info-tag-icon">🎵</div><div class="info-tag-label">Format</div><div class="info-tag-val">MP3</div></div>
    <div class="info-tag"><div class="info-tag-icon">☁️</div><div class="info-tag-label">Host</div><div class="info-tag-val">Top4Top</div></div>
    <div class="info-tag"><div class="info-tag-icon">⚡</div><div class="info-tag-label">Proses</div><div class="info-tag-val">Otomatis</div></div>
  </div>

  <div id="resultCard">
    <div class="result-label">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
      Upload Berhasil!
    </div>
    <p class="result-title">Judul: <strong id="resultTitle">—</strong></p>
    <div class="link-box">
      <span class="link-text" id="resultUrl">—</span>
      <button class="copy-btn" id="copyBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Salin
      </button>
    </div>
    <a class="open-btn" id="openBtn" href="#" target="_blank" rel="noopener">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      Buka Link di Top4Top
    </a>
  </div>

  <div id="errorCard">
    <div class="error-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
    <p class="error-msg" id="errorMsg">Terjadi kesalahan.</p>
  </div>

  <footer><p>Made by KaizuuShizuee. &amp; Powered by yt-dlp and top4top.io</p></footer>
</div>
<div class="toast" id="toast"></div>
<script>
  const $=id=>document.getElementById(id);
  const urlInput=$('ytUrl'),pasteBtn=$('pasteBtn'),generateBtn=$('generateBtn');
  const btnText=$('btnText'),btnIcon=$('btnIcon'),stepsWrap=$('stepsWrap');
  const resultCard=$('resultCard'),errorCard=$('errorCard');
  const resultUrl=$('resultUrl'),resultTitle=$('resultTitle');
  const copyBtn=$('copyBtn'),openBtn=$('openBtn'),errorMsg=$('errorMsg'),toast=$('toast');

  function showToast(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2300)}
  
  pasteBtn.addEventListener('click',async()=>{
    try{const t=await navigator.clipboard.readText();urlInput.value=t.trim();urlInput.focus();showToast('✅ Link di-paste!');}
    catch{urlInput.focus();showToast('⚠️ Izinkan akses clipboard')}
  });

  function setStep(n,state){const el=$('step'+n);el.classList.remove('active','done');if(state)el.classList.add(state)}
  function resetSteps(){[1,2,3].forEach(n=>setStep(n,''))}
  function hideCards(){resultCard.style.display='none';errorCard.style.display='none'}

  function setLoading(on){
    generateBtn.disabled=on;
    btnText.textContent=on?'Memproses…':'Generate & Upload';
    btnIcon.style.display=on?'none':'block';
    const ex=generateBtn.querySelector('.spinner');
    if(on&&!ex){const sp=document.createElement('div');sp.className='spinner';generateBtn.prepend(sp)}
    else if(!on&&ex)ex.remove();
  }

  generateBtn.addEventListener('click',async()=>{
    const url=urlInput.value.trim();
    if(!url){urlInput.focus();showToast('⚠️ Masukkan link YouTube dulu!');return}
    if(!/youtu(\.be|be\.com)/i.test(url)){showToast('⚠️ Bukan link YouTube yang valid');return}
    hideCards();resetSteps();setLoading(true);
    stepsWrap.style.display='block';setStep(1,'active');
    const t1=setTimeout(()=>{setStep(1,'done');setStep(2,'active')},4000);
    const t2=setTimeout(()=>{setStep(2,'done');setStep(3,'active')},14000);
    try{
      const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
      clearTimeout(t1);clearTimeout(t2);
      const data=await res.json();
      if(data.success){
        setStep(1,'done');setStep(2,'done');setStep(3,'done');
        resultTitle.textContent=data.title||'—';
        resultUrl.textContent=data.url;
        openBtn.href=data.url;
        resultCard.style.display='block';
        resultCard.scrollIntoView({behavior:'smooth',block:'nearest'});
        showToast('🎉 Upload berhasil!');
      }else{
        setStep(1,'done');
        errorMsg.textContent=data.error||'Terjadi kesalahan. Coba lagi.';
        errorCard.style.display='flex';
      }
    }catch{
      clearTimeout(t1);clearTimeout(t2);
      errorMsg.textContent='Tidak bisa terhubung ke server. Pastikan server.js berjalan.';
      errorCard.style.display='flex';
    }finally{setLoading(false)}
  });

  urlInput.addEventListener('keydown',e=>{if(e.key==='Enter')generateBtn.click()});

  urlInput.addEventListener('focus',async()=>{
    if(urlInput.value)return;
    try{const t=await navigator.clipboard.readText();if(/youtu(\.be|be\.com)/i.test(t)){urlInput.value=t.trim();showToast('📋 Link YouTube terdeteksi!')}}catch{}
  });

  copyBtn.addEventListener('click',()=>{
    navigator.clipboard.writeText(resultUrl.textContent).then(()=>{
      const orig=copyBtn.innerHTML;
      copyBtn.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Disalin!';
      showToast('✅ Link berhasil disalin!');
      setTimeout(()=>{copyBtn.innerHTML=orig},2000);
    });
  });
</script>
</body>
</html>`;

// ─── top4top Upload Logic ────────────────────────────────────────────────────
const TOP4TOP = "https://top4top.io";
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

function makeClient() {
  const jar = new CookieJar();
  return {
    jar,
    client: wrapper(axios.create({
      baseURL: TOP4TOP, jar, withCredentials: true, timeout: 180000,
      validateStatus: () => true,
      headers: { "user-agent": UA, "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7" }
    }))
  };
}

function getCookieSid(jar) {
  return jar.getCookiesSync(TOP4TOP).find(c => c.key === "sid")?.value || "";
}

function parseResultUrl(html) {
  const $ = cheerio.load(html);

  // ── Prioritas 1: Link CDN langsung (e.top4top.io / f.top4top.io / subdomain lain)
  // Format: http://e.top4top.io/m_XXXXX.mp3
  const cdnFromInput = $('input[value]').toArray()
    .map(el => $(el).attr("value")?.trim())
    .find(v => v && /^https?:\/\/[a-z]\.top4top\.io\//i.test(v));
  if (cdnFromInput) return cdnFromInput;

  const cdnFromAnchor = $('a[href]').toArray()
    .map(el => $(el).attr("href")?.trim())
    .find(h => h && /^https?:\/\/[a-z]\.top4top\.io\//i.test(h));
  if (cdnFromAnchor) return cdnFromAnchor;

  // ── Prioritas 2: Input/anchor dengan ekstensi audio
  const audioExt = /\.(mp3|m4a|ogg|webm|aac|flac|wav)(\?.*)?$/i;
  const audioFromInput = $('input[value]').toArray()
    .map(el => $(el).attr("value")?.trim())
    .find(v => v && audioExt.test(v));
  if (audioFromInput) return audioFromInput;

  const audioFromAnchor = $('a[href]').toArray()
    .map(el => $(el).attr("href")?.trim())
    .find(h => h && audioExt.test(h));
  if (audioFromAnchor) return audioFromAnchor;

  // ── Prioritas 3: Field berlabel "direct" / "رابط مباشر"
  let labeledDirect = null;
  $(".inputbody").each((_, el) => {
    const title = $(el).find(".btitle").text().trim().toLowerCase();
    const value = $(el).find("input").attr("value")?.trim();
    if (value && (title.includes("مباشر") || title.includes("direct") || title.includes("download")))
      labeledDirect = value;
  });
  if (labeledDirect) return labeledDirect;

  // ── Prioritas 4: Halaman share /p_ atau /a_ (akan di-resolve oleh resolveDirectUrl)
  return $('input[value*="top4top.io/p_"]').attr("value")?.trim()
    || $('input[value*="top4top.io/a_"]').attr("value")?.trim()
    || $('a[href*="top4top.io/p_"]').attr("href")?.trim()
    || $('a[href*="top4top.io/a_"]').attr("href")?.trim()
    || null;
}

/**
 * Jika URL yang didapat masih halaman share (.html), fetch halaman itu
 * dan cari link direct download audio di dalamnya.
 */
async function resolveDirectUrl(shareUrl, client) {
  // Sudah link CDN / audio — tidak perlu resolve
  if (/^https?:\/\/[a-z]\.top4top\.io\//i.test(shareUrl)) return shareUrl;
  if (/\.(mp3|m4a|ogg|webm|aac|flac|wav)(\?.*)?$/i.test(shareUrl)) return shareUrl;

  // Fetch halaman share
  try {
    const res = await client.get(shareUrl, {
      headers: { accept: "text/html,*/*", referer: TOP4TOP + "/" }
    });
    const $ = cheerio.load(res.data || "");

    // Cari link audio di halaman share
    const cdnLink =
      $('a[href]').toArray().map(el => $(el).attr("href")?.trim())
        .find(h => h && /^https?:\/\/[a-z]\.top4top\.io\//i.test(h))
      || $('source[src]').toArray().map(el => $(el).attr("src")?.trim())
        .find(s => s && /top4top\.io/i.test(s))
      || $('[data-url]').toArray().map(el => $(el).attr("data-url")?.trim())
        .find(u => u && /top4top\.io/i.test(u));

    if (cdnLink) return cdnLink;

    // Cari di semua input / anchor dengan ekstensi audio
    const audioExt = /\.(mp3|m4a|ogg|webm|aac|flac|wav)(\?.*)?$/i;
    const audioLink =
      $('a[href]').toArray().map(el => $(el).attr("href")?.trim()).find(h => h && audioExt.test(h))
      || $('input[value]').toArray().map(el => $(el).attr("value")?.trim()).find(v => v && audioExt.test(v));

    if (audioLink) return audioLink;
  } catch (e) {
    console.warn("⚠️ resolveDirectUrl gagal:", e.message);
  }

  // Kembalikan URL asli kalau tidak ketemu
  return shareUrl;
}

async function getSid(client, jar) {
  const res = await client.get("/", { headers: { accept: "text/html,*/*", referer: `${TOP4TOP}/` } });
  const $ = cheerio.load(res.data || "");
  return $('input[name="sid"]').attr("value") || getCookieSid(jar);
}

async function uploadToTop4top(filePath, mimeType = "audio/mpeg") {
  const { jar, client } = makeClient();
  const sid = await getSid(client, jar);
  const form = new FormData();
  if (sid) form.append("sid", sid);
  form.append("file_0_", fs.createReadStream(filePath), { filename: path.basename(filePath), contentType: mimeType });
  for (let i = 1; i <= 9; i++) form.append(`file_${i}_`, "");
  form.append("submitr", "[ رفع الملفات ]");
  for (let i = 0; i <= 9; i++) form.append(`file_${i}_`, "");
  const res = await client.post("/index.php", form, {
    maxBodyLength: Infinity, maxContentLength: Infinity,
    headers: {
      ...form.getHeaders(),
      accept: "text/html,*/*", origin: TOP4TOP, referer: `${TOP4TOP}/`,
      "upgrade-insecure-requests": "1",
      "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
      "sec-ch-ua-mobile": "?1", "sec-ch-ua-platform": '"Android"',
      "sec-fetch-site": "same-origin", "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1", "sec-fetch-dest": "document"
    }
  });

  // Debug: log semua input values dan anchor hrefs dari halaman hasil upload
  const $dbg = cheerio.load(res.data || "");
  const allInputs = $dbg('input[value]').toArray().map(el => $dbg(el).attr("value")?.trim()).filter(Boolean);
  const allAnchors = $dbg('a[href]').toArray().map(el => $dbg(el).attr("href")?.trim()).filter(v => v && v.includes("top4top"));
  console.log("📄 Input values di halaman hasil:", allInputs.slice(0, 10));
  console.log("🔗 Anchor hrefs top4top:", allAnchors.slice(0, 10));

  const rawUrl = parseResultUrl(res.data || "");
  if (!rawUrl) return null;

  console.log(`🔍 URL mentah dari parse: ${rawUrl}`);
  const directUrl = await resolveDirectUrl(rawUrl, client);
  console.log(`✅ URL direct final: ${directUrl}`);
  return directUrl;
}

// ─── YouTube Audio Download ───────────────────────────────────────────────────
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

async function installYtdlp() {
  const binPath = "/tmp/yt-dlp";
  // Kalau sudah ada skip
  if (fs.existsSync(binPath)) {
    try { await execAsync(`${binPath} --version`); return binPath; } catch {}
  }
  console.log("⬇️  Menginstall yt-dlp...");
  await execAsync(
    `curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${binPath} && chmod +x ${binPath}`,
    { timeout: 60000 }
  );
  console.log("✅ yt-dlp berhasil diinstall");
  return binPath;
}

async function getYtdlpBin() {
  // 1. cek PATH dulu
  try { const { stdout } = await execAsync("which yt-dlp"); if (stdout.trim()) return "yt-dlp"; } catch {}
  try { const { stdout } = await execAsync("which youtube-dl"); if (stdout.trim()) return "youtube-dl"; } catch {}
  // 2. cek /tmp
  if (fs.existsSync("/tmp/yt-dlp")) return "/tmp/yt-dlp";
  // 3. auto install ke /tmp
  return await installYtdlp();
}

async function getYoutubeInfo(url, bin) {
  const cmd = bin + ' --dump-json --no-playlist --no-check-certificate '
    + '--extractor-args "youtube:player_client=tv,web" '
    + '--add-header "Accept-Language:en-US,en;q=0.9" '
    + '"' + url + '" 2>/dev/null';
  const { stdout } = await execAsync(cmd, { timeout: 30000 });
  return JSON.parse(stdout.trim());
}

// Daftar strategi download — dicoba satu per satu sampai berhasil
const DL_STRATEGIES = [
  // Strategi 1: TV client (paling sering bypass bot detection)
  (bin, tpl, url) => bin + ' -x --audio-format mp3 --audio-quality 5 --no-check-certificate '
    + '--extractor-args "youtube:player_client=tv,web" '
    + '--add-header "Accept-Language:en-US,en;q=0.9" '
    + '-o "' + tpl + '" "' + url + '"',

  // Strategi 2: Android client
  (bin, tpl, url) => bin + ' -x --audio-format mp3 --audio-quality 5 --no-check-certificate '
    + '--extractor-args "youtube:player_client=android" '
    + '--add-header "Accept-Language:en-US,en;q=0.9" '
    + '-o "' + tpl + '" "' + url + '"',

  // Strategi 3: mweb client
  (bin, tpl, url) => bin + ' -x --audio-format mp3 --audio-quality 5 --no-check-certificate '
    + '--extractor-args "youtube:player_client=mweb" '
    + '--sleep-requests 2 --min-sleep-interval 2 '
    + '--add-header "Accept-Language:en-US,en;q=0.9" '
    + '-o "' + tpl + '" "' + url + '"',

  // Strategi 4: bestaudio tanpa convert
  (bin, tpl, url) => bin + ' -f "bestaudio/best" --no-check-certificate '
    + '--extractor-args "youtube:player_client=tv" '
    + '-o "' + tpl + '" "' + url + '"',
];

async function downloadYoutubeAudio(url, bin) {
  // Update yt-dlp ke versi terbaru dulu (silent)
  try { await execAsync(bin + ' -U 2>/dev/null', { timeout: 30000 }); } catch {}

  const tmpDir = os.tmpdir();
  const videoId = extractVideoId(url);
  const tpl = path.join(tmpDir, 'yt_' + videoId + '_%(title)s.%(ext)s');

  let lastError = null;
  for (let i = 0; i < DL_STRATEGIES.length; i++) {
    const cmd = DL_STRATEGIES[i](bin, tpl, url) + ' 2>&1';
    console.log('⚙️  Strategi ' + (i + 1) + ': ' + cmd);
    try {
      await execAsync(cmd, { timeout: 200000 });

      const mp3Files = fs.readdirSync(tmpDir).filter(f => f.startsWith('yt_' + videoId) && f.endsWith('.mp3'));
      if (mp3Files.length > 0) return { filePath: path.join(tmpDir, mp3Files[0]), ext: 'mp3' };

      const anyFiles = fs.readdirSync(tmpDir).filter(f => f.startsWith('yt_' + videoId));
      if (anyFiles.length > 0) return { filePath: path.join(tmpDir, anyFiles[0]), ext: path.extname(anyFiles[0]).slice(1) };

      console.warn('⚠️  Strategi ' + (i + 1) + ' jalan tapi file tidak ditemukan, coba berikutnya...');
    } catch (err) {
      lastError = err;
      console.warn('⚠️  Strategi ' + (i + 1) + ' gagal: ' + (err.stdout || err.message || '').slice(0, 300));
      fs.readdirSync(tmpDir).filter(f => f.startsWith('yt_' + videoId)).forEach(f => {
        try { fs.unlinkSync(path.join(tmpDir, f)); } catch {}
      });
    }
  }

  const errDetail = (lastError && (lastError.stdout || lastError.stderr || lastError.message)) || 'Semua strategi gagal';
  throw new Error('Download gagal setelah ' + DL_STRATEGIES.length + ' percobaan.\n' + errDetail);
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get("/", (_, res) => res.send(HTML));

app.post("/api/generate", async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.json({ success: false, error: "URL tidak boleh kosong" });

  const videoId = extractVideoId(url);
  if (!videoId) return res.json({ success: false, error: "URL YouTube tidak valid" });

  let tmpFile = null;
  try {
    const bin = await getYtdlpBin();
    console.log(`\n[1/3] Info video: ${url}`);
    let title = "Audio";
    try { const info = await getYoutubeInfo(url, bin); title = info.title || "Audio"; } catch {}

    console.log(`[2/3] Download audio...`);
    const { filePath, ext } = await downloadYoutubeAudio(url, bin);
    tmpFile = filePath;
    const mimeMap = { mp3: "audio/mpeg", m4a: "audio/mp4", webm: "audio/webm", ogg: "audio/ogg" };

    console.log(`[3/3] Upload ke top4top...`);
    const resultUrl = await uploadToTop4top(filePath, mimeMap[ext] || "audio/mpeg");

    if (!resultUrl) return res.json({ success: false, error: "Upload berhasil tapi link tidak ditemukan. Coba lagi." });

    console.log(`✅ Done: ${resultUrl}`);
    res.json({ success: true, url: resultUrl, title });
  } catch (err) {
    console.error("❌ FULL ERROR:", err.message);
    console.error("❌ STDERR:", err.stderr);
    console.error("❌ STDOUT:", err.stdout);
    res.json({ success: false, error: err.stderr || err.stdout || err.message });
  } finally {
    if (tmpFile) try { fs.unlinkSync(tmpFile); } catch {}
  }
});

app.get("/api/health", (_, res) => res.json({ ok: true }));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`\n🚀 ShizueeX berjalan di http://localhost:${PORT}`);
  console.log(`   Buka di browser: http://localhost:${PORT}\n`);
  try { await installYtdlp(); } catch (e) { console.warn("⚠️ Auto-install yt-dlp gagal:", e.message); }
});
