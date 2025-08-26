// Enhanced Resume Builder Logic
const form = document.getElementById('resume-form');
const preview = document.getElementById('resume-preview');
const exportBtn = document.getElementById('export-pdf');
const uploadInput = document.getElementById('upload-json');
const templateGrid = document.getElementById('template-grid');
const clearBtn = document.getElementById('clear-btn');
const themeToggle = document.getElementById('theme-toggle');

let currentTemplate = 'modern';

function safeHtml(s){
  const div = document.createElement('div');
  div.textContent = s || '';
  return div.innerHTML.replace(/\n/g, '<br>');
}

function generateResume(data, template = 'modern'){
  const cls = template === 'classic' ? 'classic' : template === 'creative' ? 'creative' : '';
  return `
    <div class="resume-template ${cls}">
      <div class="resume-header">
        <div>
          <h2>${safeHtml(data.name)}</h2>
          <div class="resume-meta">${safeHtml(data.location || '')}</div>
        </div>
        <div class="resume-meta">${safeHtml(data.email)}<br>${safeHtml(data.phone)}</div>
      </div>

      <div class="resume-section">
        <div class="resume-section-title">Summary</div>
        <div>${safeHtml(data.summary)}</div>
      </div>

      <div class="resume-section">
        <div class="resume-section-title">Experience</div>
        <div>${safeHtml(data.experience)}</div>
      </div>

      <div class="resume-section">
        <div class="resume-section-title">Education</div>
        <div>${safeHtml(data.education)}</div>
      </div>
    </div>
  `;
}

function showPreview(data){
  preview.classList.remove('pulse');
  preview.style.opacity = 0;
  requestAnimationFrame(()=>{
    preview.innerHTML = generateResume(data, currentTemplate);
    preview.classList.add('animated');
    exportBtn.style.display = 'inline-block';
    preview.style.opacity = 1;
  });
}

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  showPreview(data);
});

uploadInput.addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (evt)=>{
    try{
      const data = JSON.parse(evt.target.result);
      // normalize: ensure keys exist
      const norm = {name:'',email:'',phone:'',summary:'',experience:'',education:'',location:'' , ...data};
      showPreview(norm);
    }catch(err){
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
});

templateGrid.addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  [...templateGrid.children].forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  currentTemplate = btn.dataset.template;
  // re-render preview if present
  if(preview.innerHTML.trim()){
    // try to extract current data from preview or form
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    showPreview(data);
  }
});

clearBtn.addEventListener('click', ()=>{
  form.reset();
  preview.innerHTML = '';
  exportBtn.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', ()=>{
  // Enforce dark theme and disable toggle
  document.body.classList.add('dark');
  if(themeToggle){
    themeToggle.setAttribute('disabled','true');
    themeToggle.textContent = '🌙';
  }

  // --- Simple client-side auth/profile storage (localStorage) ---
  const authModal = document.getElementById('auth-modal');
  const openAuth = document.getElementById('open-auth');
  const authSave = document.getElementById('auth-save');
  const authCancel = document.getElementById('auth-cancel');
  const authEmail = document.getElementById('auth-email');
  const authName = document.getElementById('auth-name');
  const pcName = document.getElementById('pc-name');
  const pcBio = document.getElementById('pc-bio');
  const pexelsKeyInput = document.getElementById('pexels-key');
  const pexelsSearchBtn = document.getElementById('pexels-search');
  const pexelsResults = document.getElementById('pexels-results');
  const navLinks = document.querySelectorAll('.nav-link');

  function loadProfile(){
    const user = JSON.parse(localStorage.getItem('re_user')||'null');
    if(user){
      pcName.textContent = user.name||user.email||'User';
      pcBio.textContent = user.bio||'Saved locally';
      authEmail.value = user.email||'';
      authName.value = user.name||'';
      // load stored pexels key if present
      if(user.pexelsKey) pexelsKeyInput.value = user.pexelsKey;
    } else {
      pcName.textContent = 'Guest';
      pcBio.textContent = 'Sign in to save your profile and resumes locally.';
    }
  }

  // nav handling — simple hash navigation feel
  navLinks.forEach(a=>a.addEventListener('click',(e)=>{
    // default anchors will scroll; we add a small active state
    navLinks.forEach(n=>n.classList.remove('active'));
    e.currentTarget.classList.add('active');
  }));

  // ensure openAuth exists and attaches
  const openAuthBtn = document.getElementById('open-auth');
  if(openAuthBtn) openAuthBtn.addEventListener('click', ()=>{authModal.classList.add('open');authModal.setAttribute('aria-hidden','false')});
  if(authCancel) authCancel.addEventListener('click', ()=>{authModal.classList.remove('open');authModal.setAttribute('aria-hidden','true')});

  if(authSave) authSave.addEventListener('click', ()=>{
    const user = {email:authEmail.value||'', name:authName.value||'', bio:`Member since ${new Date().toLocaleDateString()}`};
    // persist also pexels key
    const k = pexelsKeyInput.value?.trim(); if(k) user.pexelsKey = k;
    localStorage.setItem('re_user', JSON.stringify(user));
    loadProfile();
    authModal.classList.remove('open');
  });

  loadProfile();

  // Pexels search (client-side) — requires user to paste their Pexels API key
  if(pexelsSearchBtn) pexelsSearchBtn.addEventListener('click', async ()=>{
    const key = pexelsKeyInput.value?.trim();
    if(!key){alert('Paste your Pexels API key first.');return}
    const q = prompt('Search term (e.g. developer headshot)') || 'office';
    try{
      pexelsResults.innerHTML = 'Searching...';
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=6`, {headers:{Authorization:key}});
      if(!res.ok) throw new Error('Pexels request failed');
      const json = await res.json();
      pexelsResults.innerHTML = json.photos.map(p=>`<img src="${p.src.medium}" alt="${p.alt}">`).join('');
      // save key to user profile
      const user = JSON.parse(localStorage.getItem('re_user')||'null')||{}; user.pexelsKey = key; localStorage.setItem('re_user', JSON.stringify(user));
    }catch(err){pexelsResults.innerHTML = 'Failed to fetch images.'; console.error(err)}
  });

  // --- Save resume locally per user ---
  const saveResumeBtn = document.createElement('button'); saveResumeBtn.className='btn subtle'; saveResumeBtn.textContent='Save Resume';
  const fa = document.querySelector('.form-actions'); if(fa) fa.appendChild(saveResumeBtn);
  saveResumeBtn.addEventListener('click', ()=>{
    const formData = new FormData(form); const data = Object.fromEntries(formData.entries());
    const user = JSON.parse(localStorage.getItem('re_user')||'null');
    if(!user || !user.email){alert('Sign in first to save your resume locally.'); return}
    const stored = JSON.parse(localStorage.getItem('re_resumes')||'{}');
    stored[user.email] = stored[user.email]||[]; stored[user.email].push({id:Date.now(),data});
    localStorage.setItem('re_resumes', JSON.stringify(stored));
    alert('Resume saved locally for '+user.email);
  });

  // My Resumes section: build list and allow load/delete
  function renderMyResumes(){
    const myResumesEl = document.getElementById('my-resumes-list');
    if(!myResumesEl) return;
    const user = JSON.parse(localStorage.getItem('re_user')||'null');
    myResumesEl.innerHTML = '';
    if(!user || !user.email){ myResumesEl.innerHTML = '<div>Please sign in to view saved resumes.</div>'; return }
    const stored = JSON.parse(localStorage.getItem('re_resumes')||'{}');
    const list = stored[user.email]||[];
    if(list.length===0){ myResumesEl.innerHTML = '<div>No saved resumes yet.</div>'; return }
    list.slice().reverse().forEach(r=>{
      const el = document.createElement('div'); el.className='my-resume-item';
      el.innerHTML = `<div class="mr-meta">Saved ${new Date(r.id).toLocaleString()}</div>`;
      const loadBtn = document.createElement('button'); loadBtn.className='btn subtle'; loadBtn.textContent='Load';
      loadBtn.addEventListener('click', ()=>{ Object.entries(r.data).forEach(([k,v])=>{ const i=form.elements[k]; if(i) i.value=v }); showPreview(r.data); window.location.hash='#form'; });
      const delBtn = document.createElement('button'); delBtn.className='btn subtle'; delBtn.textContent='Delete';
      delBtn.addEventListener('click', ()=>{ const stored = JSON.parse(localStorage.getItem('re_resumes')||'{}'); stored[user.email] = stored[user.email].filter(x=>x.id!==r.id); localStorage.setItem('re_resumes', JSON.stringify(stored)); renderMyResumes(); });
      el.appendChild(loadBtn); el.appendChild(delBtn);
      myResumesEl.appendChild(el);
    });
  }

  // create My Resumes panel if not present
  if(!document.getElementById('my-resumes')){
    const aside = document.createElement('section'); aside.id='my-resumes'; aside.className='panel'; aside.innerHTML = '<h3>My Resumes</h3><div id="my-resumes-list"></div>';
    document.querySelector('.main-grid').appendChild(aside);
  }
  renderMyResumes();

  // expose render function for later
  window.re_renderMyResumes = renderMyResumes;

  // Optionally, later we can wire these to real APIs (Gemini/Stability) but do NOT store keys in repo.
});

exportBtn.addEventListener('click', async ()=>{
  if(!window.html2pdf){
    alert('PDF export library is not loaded.');
    return;
  }
  // small UI animation
  exportBtn.disabled = true;
  exportBtn.textContent = 'Preparing...';
  await new Promise(r=>setTimeout(r,300));
  const opt = {
    margin: 0.5,
    filename: 'resume.pdf',
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  try{
    await html2pdf().set(opt).from(preview).save();
  }catch(err){
    console.error(err);
    alert('Failed to export PDF.');
  }finally{
    exportBtn.disabled = false;
    exportBtn.textContent = 'Export as PDF';
  }
});

// Dynamically load html2pdf.js with graceful fallback
(function(){
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  script.onload = ()=>{ exportBtn.disabled = false; };
  script.onerror = ()=>{ exportBtn.disabled = true; console.warn('Failed to load html2pdf.js'); };
  document.body.appendChild(script);
})();

// Particle canvas removed — dot animation disabled
