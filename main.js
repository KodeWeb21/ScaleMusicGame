import { scales, noteFrequencies, getHarmonicCircle } from './scales.js';
import * as Tone from 'tone';

let appState = {
  unlockedScaleIndex: parseInt(localStorage.getItem('piano_unlocked_scales')) || 0,
  unlockedChordIndex: parseInt(localStorage.getItem('piano_unlocked_chords')) || 0,
  notation: localStorage.getItem('piano_notation') || 'latin',
  activeTab: 'scales',
  scalesView: 'menu',
  chordsView: 'menu',
  currentScaleIndex: 0,
  userSequence: [],
  difficulty: localStorage.getItem('piano_difficulty') ? parseInt(localStorage.getItem('piano_difficulty')) : null,
  timerInterval: null
};

const ALL_NOTES = ["DO", "DO#", "RE", "RE#", "MI", "FA", "FA#", "SOL", "SOL#", "LA", "LA#", "SI", "DO(alt)"];

let audioInitialized = false;
const pianoSampler = new Tone.Sampler({
  urls: {
    A0: "A0.mp3",
    C1: "C1.mp3",
    "D#1": "Ds1.mp3",
    "F#1": "Fs1.mp3",
    A1: "A1.mp3",
    C2: "C2.mp3",
    "D#2": "Ds2.mp3",
    "F#2": "Fs2.mp3",
    A2: "A2.mp3",
    C3: "C3.mp3",
    "D#3": "Ds3.mp3",
    "F#3": "Fs3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
    C5: "C5.mp3",
    "D#5": "Ds5.mp3",
    "F#5": "Fs5.mp3",
    A5: "A5.mp3",
    C6: "C6.mp3",
    "D#6": "Ds6.mp3",
    "F#6": "Fs6.mp3",
    A6: "A6.mp3",
    C7: "C7.mp3",
    "D#7": "Ds7.mp3",
    "F#7": "Fs7.mp3",
    A7: "A7.mp3",
    C8: "C8.mp3"
  },
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/"
}).toDestination();

const noteToPitch = {
  "DO": "C4",
  "DO#": "C#4",
  "RE": "D4",
  "RE#": "D#4",
  "MI": "E4",
  "FA": "F4",
  "FA#": "F#4",
  "SOL": "G4",
  "SOL#": "G#4",
  "LA": "A4",
  "LA#": "A#4",
  "SI": "B4",
  "DO(alt)": "C5"
};

const appDiv = document.getElementById('app');

function startTimer(seconds) {
  stopTimer();
  let timeLeft = seconds;
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) timerDisplay.textContent = `⏳ ${timeLeft}s`;
  
  appState.timerInterval = setInterval(() => {
    timeLeft--;
    if (timerDisplay) timerDisplay.textContent = `⏳ ${timeLeft}s`;
    if (timeLeft <= 0) {
      stopTimer();
      showErrorToast("Tiempo agotado");
      const feedback = document.getElementById('feedback');
      if (feedback) feedback.innerHTML = `<span class="error">Se acabó el tiempo.</span>`;
      appState.userSequence = [];
      renderContent();
      const newFeedback = document.getElementById('feedback');
      if (newFeedback) newFeedback.innerHTML = `<span class="error">Se acabó el tiempo.</span>`;
    }
  }, 1000);
}

function showDifficultyPopup() {
  const popup = document.createElement('div');
  popup.className = 'difficulty-popup';
  popup.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 100;">
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: -1;" onclick="this.closest('.difficulty-popup').remove()"></div>
      <div class="glass-card animate-enter" style="max-width: 300px; width: 90%; text-align: center; box-shadow: 0 0 50px rgba(0,0,0,0.8); margin: 0;">
        <h2 style="margin-bottom: 1.5rem;">Selecciona Dificultad</h2>
        <div style="display: flex; flex-direction: column; gap: 0.8rem;">
          <button class="btn-primary" data-time="null" style="margin: 0; background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));">Práctica (Sin tiempo)</button>
          <button class="btn-primary" data-time="15" style="margin: 0; background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple)); box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3);">Fácil (15s)</button>
          <button class="btn-primary" data-time="10" style="margin: 0; background: linear-gradient(135deg, var(--accent-gold), var(--accent-purple)); box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);">Medio (10s)</button>
          <button class="btn-primary" data-time="5" style="margin: 0; background: linear-gradient(135deg, var(--error), var(--accent-purple)); box-shadow: 0 4px 15px rgba(255, 51, 102, 0.3);">Difícil (5s)</button>
        </div>
        <button class="btn-icon" style="margin: 1.5rem auto 0; padding: 8px 16px;" onclick="this.closest('.difficulty-popup').remove()">Cancelar</button>
      </div>
    </div>
  `;
  
  popup.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const time = e.currentTarget.getAttribute('data-time');
      appState.difficulty = time === "null" ? null : parseInt(time);
      if (appState.difficulty === null) {
        localStorage.removeItem('piano_difficulty');
      } else {
        localStorage.setItem('piano_difficulty', appState.difficulty);
      }
      popup.remove();
      stopTimer();
      appState.userSequence = [];
      renderContent();
    });
  });
  
  document.body.appendChild(popup);
}

function stopTimer() {
  if (appState.timerInterval) {
    clearInterval(appState.timerInterval);
    appState.timerInterval = null;
  }
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay && appState.userSequence.length === 0) {
    timerDisplay.textContent = appState.difficulty ? `⏳ ${appState.difficulty}s` : '';
  }
}

async function initAudio() {
  if (!audioInitialized) {
    await Tone.start();
    audioInitialized = true;
  }
}

function playNoteSound(noteName) {
  if (audioInitialized) {
    if (pianoSampler.loaded) {
      const pitch = noteToPitch[noteName] || "C4";
      pianoSampler.triggerAttackRelease(pitch, "2n");
    }
  } else {
    initAudio().then(() => {
      if (pianoSampler.loaded) {
        const pitch = noteToPitch[noteName] || "C4";
        pianoSampler.triggerAttackRelease(pitch, "2n");
      }
    });
  }
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
      if (typeof stopTimer === 'function') stopTimer();
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
  
  header.innerHTML = `
    <div class="profile-info">
      <div class="avatar" style="overflow: hidden;">
        <img src="piano_avatar.png" alt="Piano" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 1rem;">
      <button class="btn-icon" id="btn-toggle-notation" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);" title="Alternar Notación">
        <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/></svg>
        <span style="font-weight: bold; letter-spacing: 0.5px;">C ↔ DO</span>
      </button>
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
  const cardsHtml = scales.map((scale, index) => {
    const isUnlocked = index <= appState.unlockedScaleIndex;
    
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
          <div class="req-level">Completa anterior para desbloquear</div>
        </div>
      `;
    }
  }).join('');

  container.innerHTML = `
    <div class="glass-card animate-enter">
      <div class="header-actions">
        <div class="tag blue" style="margin: 0;">Modo Escalas</div>
        <button class="tag blue" style="margin: 0; cursor: pointer; border: none; font-family: inherit; background: rgba(0, 229, 255, 0.15); color: #80F2FF; font-weight: bold; font-size: 0.8rem; padding: 6px 14px;" id="btn-difficulty-menu-scales">
          ${appState.difficulty ? `⏳ ${appState.difficulty}s` : 'Práctica'}
        </button>
      </div>
      <h2>Selecciona tu Nivel</h2>
      <p class="text-muted" style="font-size: 0.85rem; color: var(--text-secondary);">Sube de nivel practicando para desbloquear más escalas.</p>
      
      <div class="levels-grid">
        ${cardsHtml}
      </div>
    </div>
  `;

  document.getElementById('btn-difficulty-menu-scales').addEventListener('click', showDifficultyPopup);

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
        <button class="tag blue" style="margin: 0; cursor: pointer; border: none; font-family: inherit; background: rgba(0, 229, 255, 0.15); color: #80F2FF; font-weight: bold; font-size: 0.8rem; padding: 6px 14px;" id="btn-difficulty">
          ${appState.difficulty ? `⏳ ${appState.difficulty}s` : 'Práctica'}
        </button>
      </div>
      <h2>Escala de ${translateNote(scale.name)}</h2>
      <div id="timer-display" style="text-align: center; font-size: 1.2rem; font-weight: bold; color: var(--accent-gold); margin-bottom: 0.5rem; min-height: 1.5rem;">
        ${appState.difficulty ? `⏳ ${appState.difficulty}s` : ''}
      </div>
      
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
    stopTimer();
    appState.scalesView = 'menu';
    renderContent();
  });

  document.getElementById('btn-difficulty').addEventListener('click', showDifficultyPopup);

  document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('click', (e) => {
      handleNotePress(e.currentTarget.getAttribute('data-note'), e.currentTarget, scale);
    });
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    if (appState.currentScaleIndex + 1 < scales.length && (appState.currentScaleIndex + 1) <= appState.unlockedScaleIndex) {
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
  if (appState.userSequence.length === 0 && appState.difficulty && !appState.timerInterval) {
    startTimer(appState.difficulty);
  }

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
      stopTimer();
      document.getElementById('feedback').innerHTML = `<span class="success">¡Excelente!</span>`;
      
      // Advance unlock progress if needed
      if (appState.currentScaleIndex === appState.unlockedScaleIndex) {
        appState.unlockedScaleIndex++;
        localStorage.setItem('piano_unlocked_scales', appState.unlockedScaleIndex);
      }
      
      const btnNext = document.getElementById('btn-next');
      
      if (appState.currentScaleIndex + 1 < scales.length && (appState.currentScaleIndex + 1) <= appState.unlockedScaleIndex) {
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
    stopTimer();
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
  const cardsHtml = scales.map((scale, index) => {
    const isUnlocked = index <= appState.unlockedChordIndex;
    
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
          <div class="req-level">Completa anterior para desbloquear</div>
        </div>
      `;
    }
  }).join('');

  container.innerHTML = `
    <div class="glass-card animate-enter">
      <div class="header-actions">
        <div class="tag purple" style="margin: 0;">Círculos Armónicos</div>
        <button class="tag purple" style="margin: 0; cursor: pointer; border: none; font-family: inherit; background: rgba(176, 38, 255, 0.15); color: #D68FFF; font-weight: bold; font-size: 0.8rem; padding: 6px 14px;" id="btn-difficulty-menu-chords">
          ${appState.difficulty ? `⏳ ${appState.difficulty}s` : 'Práctica'}
        </button>
      </div>
      <h2>Selecciona tu Nivel</h2>
      <p class="text-muted" style="font-size: 0.85rem; color: var(--text-secondary);">Desbloquea más círculos armónicos subiendo de nivel.</p>
      
      <div class="levels-grid">
        ${cardsHtml}
      </div>
    </div>
  `;

  document.getElementById('btn-difficulty-menu-chords').addEventListener('click', showDifficultyPopup);

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
        <button class="tag purple" style="margin: 0; cursor: pointer; border: none; font-family: inherit; background: rgba(176, 38, 255, 0.15); color: #D68FFF; font-weight: bold; font-size: 0.8rem; padding: 6px 14px;" id="btn-difficulty-chords">
          ${appState.difficulty ? `⏳ ${appState.difficulty}s` : 'Práctica'}
        </button>
      </div>
      <h2>Círculo de ${translateNote(scale.name)}</h2>
      <div id="timer-display" style="text-align: center; font-size: 1.2rem; font-weight: bold; color: var(--accent-gold); margin-bottom: 0.5rem; min-height: 1.5rem;">
        ${appState.difficulty ? `⏳ ${appState.difficulty}s` : ''}
      </div>
      
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
    stopTimer();
    appState.chordsView = 'menu';
    renderContent();
  });

  document.getElementById('btn-difficulty-chords').addEventListener('click', showDifficultyPopup);

  document.getElementById('btn-next').addEventListener('click', () => {
    if (appState.currentScaleIndex + 1 < scales.length && (appState.currentScaleIndex + 1) <= appState.unlockedChordIndex) {
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
  if (appState.userSequence.length === 0 && appState.difficulty && !appState.timerInterval) {
    startTimer(appState.difficulty);
  }

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
      stopTimer();
      document.getElementById('feedback').innerHTML = `<span class="success">¡Excelente!</span>`;
      
      // Advance unlock progress if needed
      if (appState.currentScaleIndex === appState.unlockedChordIndex) {
        appState.unlockedChordIndex++;
        localStorage.setItem('piano_unlocked_chords', appState.unlockedChordIndex);
      }
      
      document.getElementById('chords-grid-container').classList.add('hidden');
      const btnNext = document.getElementById('btn-next');
      
      if (appState.currentScaleIndex + 1 < scales.length && (appState.currentScaleIndex + 1) <= appState.unlockedChordIndex) {
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
    stopTimer();
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
