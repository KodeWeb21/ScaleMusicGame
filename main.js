import { scales, noteFrequencies, getHarmonicCircle } from './scales.js';

let appState = {
  xp: parseInt(localStorage.getItem('piano_xp')) || 0,
  notation: localStorage.getItem('piano_notation') || 'latin',
  activeTab: 'scales',
  scalesView: 'menu',
  chordsView: 'menu',
  currentScaleIndex: 0,
  userSequence: []
};

const ALL_NOTES = ["DO", "DO#", "RE", "RE#", "MI", "FA", "FA#", "SOL", "SOL#", "LA", "LA#", "SI", "DO(alt)"];

let audioCtx = null;
const appDiv = document.getElementById('app');

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playNoteSound(noteName) {
  initAudio();
  const freq = noteFrequencies[noteName] || 440;
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = freq;
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 1.5);
}

function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function getLevelTitle(level) {
  if (level < 3) return "Principiante";
  if (level < 6) return "Aprendiz";
  if (level < 10) return "Intermedio";
  if (level < 15) return "Avanzado";
  if (level < 20) return "Virtuoso";
  return "Maestro";
}

function getXPForNextLevel(level) {
  return Math.pow(level, 2) * 100;
}

function addXP(amount) {
  appState.xp += amount;
  localStorage.setItem('piano_xp', appState.xp);
  renderHeader();
  
  const popup = document.createElement('div');
  popup.className = 'xp-popup';
  popup.textContent = `+${amount} XP`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1500);
}

const latinToAnglo = {
  "DO": "C", "DO#": "C#", "RE": "D", "RE#": "D#", "MI": "E", "FA": "F",
  "FA#": "F#", "SOL": "G", "SOL#": "G#", "LA": "A", "LA#": "A#", "SI": "B",
  "DO(alt)": "C(alt)"
};

function translateNote(str) {
  if (appState.notation === 'latin') return str;
  const parts = str.split(' ');
  if (latinToAnglo[parts[0]]) {
    parts[0] = latinToAnglo[parts[0]];
  }
  return parts.join(' ');
}

function showErrorToast(expected) {
  // Remove existing toasts to avoid spam
  document.querySelectorAll('.error-toast').forEach(t => t.remove());
  
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = `❌ Esperaba: ${expected}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// SVG Icons
const icons = {
  scales: `<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>`,
  chords: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`,
  coming: `<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`
};

function renderApp() {
  appDiv.innerHTML = `
    <header class="app-header" id="app-header"></header>
    <main class="main-content" id="main-content"></main>
    <nav class="bottom-nav">
      <div class="nav-item ${appState.activeTab === 'scales' ? 'active' : ''}" data-tab="scales">
        ${icons.scales}<span>Escalas</span>
      </div>
      <div class="nav-item ${appState.activeTab === 'chords' ? 'active' : ''}" data-tab="chords">
        ${icons.chords}<span>Círculos</span>
      </div>
    </nav>
  `;
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      appState.activeTab = e.currentTarget.getAttribute('data-tab');
      appState.scalesView = 'menu';
      appState.chordsView = 'menu';
      appState.currentScaleIndex = 0;
      appState.userSequence = [];
      initAudio();
      renderApp();
    });
  });

  renderHeader();
  renderContent();
}

function renderHeader() {
  const header = document.getElementById('app-header');
  if(!header) return;
  const level = calculateLevel(appState.xp);
  const title = getLevelTitle(level);
  const nextXP = getXPForNextLevel(level);
  const prevXP = getXPForNextLevel(level - 1);
  const progress = Math.min(100, Math.max(0, ((appState.xp - prevXP) / (nextXP - prevXP)) * 100));
  
  header.innerHTML = `
    <div class="profile-info">
      <div class="avatar">J</div>
      <div class="xp-container">
        <div class="level-text">Nivel ${level} <span style="color: var(--text-muted); font-size: 0.65rem; font-weight: 500; margin-left: 4px;">• ${title}</span></div>
        <div class="xp-bar-bg">
          <div class="xp-bar-fill" style="width: ${progress}%"></div>
        </div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 1rem;">
      <button class="btn-icon" id="btn-toggle-notation" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);" title="Alternar Notación">
        <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/></svg>
        <span style="font-weight: bold; letter-spacing: 0.5px;">C ↔ DO</span>
      </button>
      <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">${appState.xp} XP</div>
    </div>
  `;

  document.getElementById('btn-toggle-notation').addEventListener('click', () => {
    appState.notation = appState.notation === 'latin' ? 'anglo' : 'latin';
    localStorage.setItem('piano_notation', appState.notation);
    renderApp();
  });
}

function renderContent() {
  const main = document.getElementById('main-content');
  main.innerHTML = '';

  if (appState.activeTab === 'scales') {
    if (appState.scalesView === 'menu') {
      renderScalesMenu(main);
    } else {
      renderScalesPractice(main);
    }
  } else if (appState.activeTab === 'chords') {
    if (appState.chordsView === 'menu') {
      renderChordsMenu(main);
    } else {
      renderChordsPractice(main);
    }
  } else {
    main.innerHTML = `
      <div class="info-view animate-enter">
        ${icons.coming}
        <h2>Próximamente</h2>
        <p>Esta sección está en desarrollo. Sigue practicando en otras áreas para subir de nivel.</p>
      </div>
    `;
  }
}

// ========================
// MODO ESCALAS
// ========================
function renderScalesMenu(container) {
  const level = calculateLevel(appState.xp);
  
  const cardsHtml = scales.map((scale, index) => {
    const isUnlocked = index < level;
    
    if (isUnlocked) {
      return `
        <div class="level-card unlocked" data-index="${index}">
          <div class="scale-name">${translateNote(scale.name)}</div>
          <div class="req-level">Nivel ${index + 1}</div>
        </div>
      `;
    } else {
      return `
        <div class="level-card locked">
          <svg class="icon-lock" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
          <div class="scale-name">${translateNote(scale.name)}</div>
          <div class="req-level">Desbloquea en Nivel ${index + 1}</div>
        </div>
      `;
    }
  }).join('');

  container.innerHTML = `
    <div class="glass-card animate-enter">
      <div class="tag blue">Modo Escalas</div>
      <h2>Selecciona tu Nivel</h2>
      <p class="text-muted" style="font-size: 0.85rem; color: var(--text-secondary);">Sube de nivel practicando para desbloquear más escalas.</p>
      
      <div class="levels-grid">
        ${cardsHtml}
      </div>
    </div>
  `;

  container.querySelectorAll('.level-card.unlocked').forEach(card => {
    card.addEventListener('click', (e) => {
      appState.currentScaleIndex = parseInt(e.currentTarget.getAttribute('data-index'));
      appState.scalesView = 'practice';
      appState.userSequence = [];
      renderContent();
    });
  });
}

function renderScalesPractice(container) {
  const scale = scales[appState.currentScaleIndex];
  
  container.innerHTML = `
    <div class="glass-card animate-enter" id="game-area">
      <div class="header-actions">
        <button class="btn-icon" id="btn-back-menu">
          <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Menú
        </button>
        <div class="tag blue" style="margin: 0;">Práctica</div>
      </div>
      <h2>Escala de ${translateNote(scale.name)}</h2>
      
      <div class="slots-container">
        ${scale.notes.map(() => `<div class="slot"></div>`).join('')}
      </div>
      
      <div class="feedback" id="feedback"></div>
      
      <div class="keyboard-wrapper">
        <div class="keyboard" id="keyboard">
          ${ALL_NOTES.slice(0, 12).map(note => {
            const isBlack = note.includes('#');
            return `<div class="key ${isBlack ? 'black' : 'white'}" data-note="${note}">
                      <span class="note-label">${translateNote(note)}</span>
                    </div>`;
          }).join('')}
        </div>
      </div>
      
      <button class="btn-primary hidden" id="btn-next"></button>
    </div>
  `;

  document.getElementById('btn-back-menu').addEventListener('click', () => {
    appState.scalesView = 'menu';
    renderContent();
  });

  document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('click', (e) => {
      handleNotePress(e.currentTarget.getAttribute('data-note'), e.currentTarget, scale);
    });
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    const level = calculateLevel(appState.xp);
    if (appState.currentScaleIndex + 1 < scales.length && (appState.currentScaleIndex + 1) < level) {
      appState.currentScaleIndex++;
      appState.userSequence = [];
      renderContent();
    } else {
      appState.scalesView = 'menu';
      renderContent();
    }
  });
}

function handleNotePress(note, element, scale) {
  playNoteSound(note);
  
  element.classList.add('active');
  setTimeout(() => element.classList.remove('active'), 200);

  const targetNote = scale.notes[appState.userSequence.length];

  if (note === targetNote || (note === "DO" && targetNote === "DO" && appState.userSequence.length > 0)) { 
    const slot = document.querySelectorAll('.slot')[appState.userSequence.length];
    slot.textContent = translateNote(targetNote);
    slot.classList.add('filled');
    
    appState.userSequence.push(targetNote);
    
    if (appState.userSequence.length === scale.notes.length) {
      document.getElementById('feedback').innerHTML = `<span class="success">¡Excelente! +50 XP</span>`;
      addXP(50);
      
      const btnNext = document.getElementById('btn-next');
      const level = calculateLevel(appState.xp);
      
      if (appState.currentScaleIndex + 1 < scales.length && (appState.currentScaleIndex + 1) < level) {
         btnNext.textContent = 'Siguiente Escala';
      } else {
         btnNext.textContent = 'Volver al Menú';
      }
      btnNext.classList.remove('hidden');
      
      setTimeout(() => {
        if (appState.activeTab === 'scales' && appState.scalesView === 'practice' && appState.userSequence.length === scale.notes.length) {
          btnNext.click();
        }
      }, 2000);
    }
  } else {
    showErrorToast(translateNote(targetNote));
    document.getElementById('feedback').innerHTML = `<span class="error">Se reinició la secuencia.</span>`;
    
    appState.userSequence = [];
    document.querySelectorAll('.slot').forEach(slot => {
      slot.textContent = '';
      slot.classList.remove('filled');
    });
  }
}

// ========================
// MODO CÍRCULOS
// ========================
function renderChordsMenu(container) {
  const level = calculateLevel(appState.xp);
  
  const cardsHtml = scales.map((scale, index) => {
    const isUnlocked = index < level;
    
    if (isUnlocked) {
      return `
        <div class="level-card unlocked" data-index="${index}">
          <div class="scale-name">${translateNote(scale.name)}</div>
          <div class="req-level">Nivel ${index + 1}</div>
        </div>
      `;
    } else {
      return `
        <div class="level-card locked">
          <svg class="icon-lock" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
          <div class="scale-name">${translateNote(scale.name)}</div>
          <div class="req-level">Desbloquea en Nivel ${index + 1}</div>
        </div>
      `;
    }
  }).join('');

  container.innerHTML = `
    <div class="glass-card animate-enter">
      <div class="tag purple">Círculos Armónicos</div>
      <h2>Selecciona tu Nivel</h2>
      <p class="text-muted" style="font-size: 0.85rem; color: var(--text-secondary);">Desbloquea más círculos armónicos subiendo de nivel.</p>
      
      <div class="levels-grid">
        ${cardsHtml}
      </div>
    </div>
  `;

  container.querySelectorAll('.level-card.unlocked').forEach(card => {
    card.addEventListener('click', (e) => {
      appState.currentScaleIndex = parseInt(e.currentTarget.getAttribute('data-index'));
      appState.chordsView = 'practice';
      appState.userSequence = [];
      renderContent();
    });
  });
}

function renderChordsPractice(container) {
  const scale = scales[appState.currentScaleIndex];
  const circle = getHarmonicCircle(scale.notes);
  
  const distractorScale = scales[(appState.currentScaleIndex + 3) % scales.length];
  const distractorCircle = getHarmonicCircle(distractorScale.notes);
  let options = [...circle, distractorCircle[0], distractorCircle[3], distractorCircle[4]];
  
  const uniqueOptions = new Map();
  options.forEach(c => uniqueOptions.set(c.chord, c));
  options = Array.from(uniqueOptions.values());
  options.sort(() => Math.random() - 0.5);
  
  container.innerHTML = `
    <div class="glass-card animate-enter" id="game-area">
      <div class="header-actions">
        <button class="btn-icon" id="btn-back-menu-chords">
          <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Menú
        </button>
        <div class="tag purple" style="margin: 0;">Círculos</div>
      </div>
      <h2>Círculo de ${translateNote(scale.name)}</h2>
      
      <div class="slots-container">
        ${circle.map(c => `
           <div class="slot chord-slot">
              <span class="degree-hint">${c.degree}</span>
           </div>
        `).join('')}
      </div>
      
      <div class="feedback" id="feedback"></div>
      
      <div id="chords-grid-container">
        <p class="text-center text-muted mt-2" style="font-size: 0.85rem; color: var(--text-secondary)">Selecciona los acordes en el orden correcto (I a vii°)</p>
        <div class="chords-grid">
          ${options.map(c => `
            <div class="chord-card interactive" data-chord="${c.chord}">
              <div class="name">${translateNote(c.chord)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <button class="btn-primary hidden" id="btn-next"></button>
    </div>
  `;

  document.getElementById('btn-back-menu-chords').addEventListener('click', () => {
    appState.chordsView = 'menu';
    renderContent();
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    const level = calculateLevel(appState.xp);
    if (appState.currentScaleIndex + 1 < scales.length && (appState.currentScaleIndex + 1) < level) {
      appState.currentScaleIndex++;
      appState.userSequence = [];
      renderContent();
    } else {
      appState.chordsView = 'menu';
      renderContent();
    }
  });

  document.querySelectorAll('.chord-card.interactive').forEach(card => {
    card.addEventListener('click', (e) => {
      const chordName = e.currentTarget.getAttribute('data-chord');
      handleChordPress(chordName, e.currentTarget, circle);
    });
  });
}

function handleChordPress(chordName, element, circle) {
  const rootNote = chordName.split(' ')[0];
  playNoteSound(rootNote);
  
  element.style.transform = 'scale(0.9)';
  setTimeout(() => element.style.transform = '', 150);

  const targetChord = circle[appState.userSequence.length].chord;

  if (chordName === targetChord) {
    const slot = document.querySelectorAll('.slot')[appState.userSequence.length];
    slot.innerHTML = translateNote(chordName);
    slot.classList.add('filled');
    
    appState.userSequence.push(chordName);
    element.classList.add('hidden');
    
    if (appState.userSequence.length === circle.length) {
      document.getElementById('feedback').innerHTML = `<span class="success">¡Brillante! +75 XP</span>`;
      addXP(75);
      
      document.getElementById('chords-grid-container').classList.add('hidden');
      const btnNext = document.getElementById('btn-next');
      const level = calculateLevel(appState.xp);
      
      if (appState.currentScaleIndex + 1 < scales.length && (appState.currentScaleIndex + 1) < level) {
         btnNext.textContent = 'Siguiente Círculo';
      } else {
         btnNext.textContent = 'Volver al Menú';
      }
      btnNext.classList.remove('hidden');
      
      setTimeout(() => {
        if (appState.activeTab === 'chords' && appState.chordsView === 'practice' && appState.userSequence.length === circle.length) {
          btnNext.click();
        }
      }, 2000);
    }
  } else {
    showErrorToast(translateNote(targetChord));
    document.getElementById('feedback').innerHTML = `<span class="error">Se reinició la secuencia.</span>`;
    
    appState.userSequence = [];
    document.querySelectorAll('.slot').forEach((slot, idx) => {
      slot.innerHTML = `<span class="degree-hint">${circle[idx].degree}</span>`;
      slot.classList.remove('filled');
    });
    
    document.querySelectorAll('.chord-card').forEach(card => card.classList.remove('hidden'));
  }
}

// Initialization
renderApp();
