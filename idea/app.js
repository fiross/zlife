/**
 * Z-Life AI: Google for Startups Interactive Application Logic
 * Powers the Live Gemini LLM Simulator, Interactive Workflows, and Pitch Deck Tools
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initLLMSimulator();
  initWorkflowTabs();
  initPitchModal();
  initSmoothScroll();
});

/* ==========================================================================
   1. Theme Toggle
   ========================================================================== */
function initThemeToggle() {
  const themeBtn = document.getElementById('themeToggleBtn');
  if (!themeBtn) return;

  const currentTheme = localStorage.getItem('zlife-theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(themeBtn, currentTheme);

  themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('zlife-theme', newTheme);
    updateThemeIcon(themeBtn, newTheme);
  });
}

function updateThemeIcon(btn, theme) {
  btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`);
}

/* ==========================================================================
   2. Interactive Live Gemini LLM Simulator
   ========================================================================== */
const SCENARIOS = {
  1: {
    name: 'Auditory Overload & Low Sleep',
    sleep: 5.5,
    mood: 'Anxiety',
    cycle: false,
    cycleFlow: 'None',
    meds: ['Focalin (Morning)'],
    behaviors: ['Ear Covering', 'Sound Sensitivity', 'Impulsive Pacing'],
    interventions: ['Earmuffs (Walker\'s Electronics)', 'Joint Compression'],
    food: ['High-Sugar'],
    notes: 'Zeba slept poorly due to thunderstorm. Very jumpy at breakfast, flinching at kitchen blender sound. Transition to school bus was difficult.',
    aiOutput: {
      riskLevel: 'HIGH (84% Overload Probability)',
      riskBadge: 'badge-risk-high',
      riskTime: '11:15 AM - 12:00 PM (Cafeteria / Lunch Transition)',
      actions: [
        'Apply 10-15 seconds firm joint compression to shoulders & elbows before morning departure.',
        'Ensure Walker\'s electronic earmuffs are immediately accessible in her school backpack front pocket.',
        'Provide a high-protein crunchy snack (e.g., almonds or seed crackers) to activate trigeminal parasympathetic calming.',
        'Alert school staff for proactive 5-minute sensory room decompression prior to noon bell.'
      ],
      teacherBrief: 'Morning sleep deficit (5.5h) + high sound sensitivity observed at home. Focalin administered 7:45 AM. Recommend early lunch seating away from cafeteria acoustic centers and pre-emptive earmuff usage.',
      correlation: 'Historical analysis reveals 4 of 4 prior days with < 6h sleep combined with high-sugar breakfast resulted in mid-day auditory meltdowns. Joint compression reduces agitation duration by 62% in this state.'
    }
  },
  2: {
    name: 'Hormonal Cycle & High Tactile Sensitivity',
    sleep: 7.0,
    mood: 'Withdrawn',
    cycle: true,
    cycleFlow: 'Medium',
    meds: ['Focalin (Morning)', 'Ibuprofen (PRN)'],
    behaviors: ['Cover with Blanket (Cocooning)', 'Self-Regulation (Stimming)', 'Sound Sensitivity'],
    interventions: ['Neutral Warmth', 'Visual Timer', 'Oral Sensory (Gum/Crunch)'],
    food: ['High-Protein/High-Fat'],
    notes: 'Day 2 of menstrual cycle. Complaining of abdominal ache and hypersensitive to clothes seams. Non-verbal and seeking quiet dark spaces.',
    aiOutput: {
      riskLevel: 'MODERATE (58% Sensory Shutdown Risk)',
      riskBadge: 'badge-risk-med',
      riskTime: 'All-Day Fluctuating (Fatigue Spikes)',
      actions: [
        'Enable neutral warmth: Provide heated lavender pack or weighted lap pad across lap during desk work.',
        'Offer oral motor stimulation: Bubble gum or chewelry to relieve internal tension without cognitive strain.',
        'Reduce verbal demands: Use visual prompts and schedule cards rather than auditory instructions.',
        'Provide unrestricted, unhurried bathroom access pass to minimize transition embarrassment.'
      ],
      teacherBrief: 'Zeba is on Day 2 of her cycle with high tactile fatigue and abdominal cramps. Please allow weighted lap blanket at desk, quiet corner seating, and allow unhurried bathroom breaks without questions.',
      correlation: 'Cycle Day 1-3 consistently increases tactile defensive stimming by 300%. Neutral warmth combined with non-verbal visual schedules prevents shutdown transitions in 89% of logged instances.'
    }
  },
  3: {
    name: 'High Motor Drive & Sensory Seeking',
    sleep: 8.5,
    mood: 'Hyperactive',
    cycle: false,
    cycleFlow: 'None',
    meds: ['Focalin (Morning)'],
    behaviors: ['Food Grabbing', 'Impulsive Pacing', 'Self-Regulation (Stimming)'],
    interventions: ['Walk', 'Joint Compression', 'Visual Board Prompt'],
    food: ['Salty/Crunchy', 'High-Protein/High-Fat'],
    notes: 'Good sleep! Very joyful but high motor pacing. Grabbing snacks rapidly, jumping on heels, humming loudly. Needs healthy physical discharge.',
    aiOutput: {
      riskLevel: 'LOW / STABLE (22% Meltdown Risk)',
      riskBadge: 'badge-risk-low',
      riskTime: 'Post-lunch motor restlessness',
      actions: [
        'Channel motor drive: 15-minute brisk walk or stair climbing before structured academic tasks.',
        'Schedule heavy-work classroom jobs (carrying book baskets, wiping whiteboards) to engage proprioceptive receptors.',
        'Utilize visual timer for structured activity intervals with clear movement break rewards.',
        'Schedule afternoon badminton or keyboard session to convert motor energy into focused motor skill learning.'
      ],
      teacherBrief: 'Zeba had 8.5h good rest and is in high spirits with energetic motor drive. Focalin taken. She thrives when given active gross-motor tasks (carrying classroom items) between focused desk assignments.',
      correlation: 'High sleep days paired with proprioceptive heavy work lead to 94% task completion in afternoon keyboard and speech therapy sessions.'
    }
  }
};

function initLLMSimulator() {
  const scenarioChips = document.querySelectorAll('.sc-chip');
  const sleepSlider = document.getElementById('simSleepSlider');
  const sleepValText = document.getElementById('simSleepVal');
  const notesInput = document.getElementById('simNotesInput');
  const cycleToggle = document.getElementById('simCycleToggle');
  const runAiBtn = document.getElementById('btnRunAi');
  const outputContainer = document.getElementById('aiOutputBox');
  const loadingIndicator = document.getElementById('aiLoadingState');

  if (!sleepSlider || !runAiBtn || !outputContainer) return;

  // Active scenario state
  let currentScenarioId = 1;

  // Scenario Chip Clicks
  scenarioChips.forEach(chip => {
    chip.addEventListener('click', () => {
      scenarioChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const scId = chip.getAttribute('data-scenario');
      currentScenarioId = parseInt(scId, 10);
      loadScenario(currentScenarioId);
    });
  });

  // Slider change
  sleepSlider.addEventListener('input', (e) => {
    sleepValText.textContent = `${parseFloat(e.target.value).toFixed(1)} hrs`;
  });

  // Tag Toggles
  document.querySelectorAll('.sim-tag-toggle').forEach(tag => {
    tag.addEventListener('click', () => {
      tag.classList.toggle('selected');
    });
  });

  // Cycle toggle
  if (cycleToggle) {
    cycleToggle.addEventListener('click', () => {
      cycleToggle.classList.toggle('selected');
      const isYes = cycleToggle.classList.contains('selected');
      cycleToggle.textContent = isYes ? '🩸 Yes (Active)' : '⚪ No';
    });
  }

  // Load Initial Scenario
  loadScenario(1);

  // Run AI Reasoning simulation
  runAiBtn.addEventListener('click', () => {
    triggerAISimulation(currentScenarioId);
  });
}

function loadScenario(scenarioId) {
  const sc = SCENARIOS[scenarioId];
  if (!sc) return;

  const sleepSlider = document.getElementById('simSleepSlider');
  const sleepValText = document.getElementById('simSleepVal');
  const notesInput = document.getElementById('simNotesInput');
  const cycleToggle = document.getElementById('simCycleToggle');

  if (sleepSlider) {
    sleepSlider.value = sc.sleep;
    sleepValText.textContent = `${sc.sleep.toFixed(1)} hrs`;
  }

  if (notesInput) {
    notesInput.value = sc.notes;
  }

  if (cycleToggle) {
    if (sc.cycle) {
      cycleToggle.classList.add('selected');
      cycleToggle.textContent = '🩸 Yes (Active)';
    } else {
      cycleToggle.classList.remove('selected');
      cycleToggle.textContent = '⚪ No';
    }
  }

  // Update mood chips
  document.querySelectorAll('.sim-tag-toggle[data-category="mood"]').forEach(chip => {
    if (chip.getAttribute('data-val') === sc.mood) {
      chip.classList.add('selected');
    } else {
      chip.classList.remove('selected');
    }
  });

  // Update behavior chips
  document.querySelectorAll('.sim-tag-toggle[data-category="behavior"]').forEach(chip => {
    const val = chip.getAttribute('data-val');
    if (sc.behaviors.includes(val)) {
      chip.classList.add('selected');
    } else {
      chip.classList.remove('selected');
    }
  });

  // Update intervention chips
  document.querySelectorAll('.sim-tag-toggle[data-category="intervention"]').forEach(chip => {
    const val = chip.getAttribute('data-val');
    if (sc.interventions.includes(val)) {
      chip.classList.add('selected');
    } else {
      chip.classList.remove('selected');
    }
  });

  // Auto trigger the simulation render
  renderAIResults(sc.aiOutput, false);
}

function triggerAISimulation(scenarioId) {
  const sc = SCENARIOS[scenarioId] || SCENARIOS[1];
  const outputContainer = document.getElementById('aiOutputBox');
  const loadingIndicator = document.getElementById('aiLoadingState');
  const runAiBtn = document.getElementById('btnRunAi');

  if (!outputContainer || !loadingIndicator) return;

  outputContainer.style.display = 'none';
  loadingIndicator.classList.add('active');
  runAiBtn.disabled = true;
  runAiBtn.innerHTML = '<span>⚡ Google Gemini Reasoning...</span>';

  // Read current user inputs
  const sleepHours = document.getElementById('simSleepSlider').value;
  const userNotes = document.getElementById('simNotesInput').value;

  setTimeout(() => {
    loadingIndicator.classList.remove('active');
    outputContainer.style.display = 'flex';
    runAiBtn.disabled = false;
    runAiBtn.innerHTML = '<span>✨ Run Gemini Care Analysis</span>';

    // If user edited notes or sleep, customize output slightly
    const customOutput = { ...sc.aiOutput };
    if (parseFloat(sleepHours) < 6.0) {
      customOutput.riskLevel = 'HIGH (88% Overload Probability)';
      customOutput.riskBadge = 'badge-risk-high';
    } else if (parseFloat(sleepHours) >= 8.0) {
      customOutput.riskLevel = 'LOW / STABLE (18% Risk)';
      customOutput.riskBadge = 'badge-risk-low';
    }

    renderAIResults(customOutput, true);
  }, 900);
}

function renderAIResults(data, animate = false) {
  const outputContainer = document.getElementById('aiOutputBox');
  if (!outputContainer) return;

  const actionsListHtml = data.actions.map(act => `<li>${act}</li>`).join('');

  outputContainer.innerHTML = `
    <!-- Card 1: Predictive Risk Forecast -->
    <div class="ai-card-result urgent">
      <div class="aic-title">
        <span>⚡ Sensory Overload Risk Forecast</span>
        <span class="aic-badge ${data.riskBadge}">${data.riskLevel}</span>
      </div>
      <div class="aic-content">
        <strong>Critical Time Window:</strong> ${data.riskTime}<br>
        <strong>Predictive Vector:</strong> Multi-signal cross reference indicates elevated vulnerability due to acoustic noise thresholds and baseline sleep deficit.
      </div>
    </div>

    <!-- Card 2: Right-Now Tailored Action Plan -->
    <div class="ai-card-result plan">
      <div class="aic-title">
        <span>🎯 Immediate Personalized Action Plan (Caregiver)</span>
        <span class="aic-badge badge-green">Actionable Steps</span>
      </div>
      <div class="aic-content">
        <ul class="aic-bullet-list">
          ${actionsListHtml}
        </ul>
      </div>
    </div>

    <!-- Card 3: Automated Teacher Morning Briefing -->
    <div class="ai-card-result teacher">
      <div class="aic-title">
        <span>🏫 Automated Teacher Morning Handoff</span>
        <span class="aic-badge badge-yellow">30-Sec Briefing</span>
      </div>
      <div class="aic-content" style="font-style: italic; background: var(--bg-surface); padding: 12px 14px; border-radius: 8px; border-left: 3px solid var(--google-yellow); color: var(--text-main);">
        "${data.teacherBrief}"
      </div>
    </div>

    <!-- Card 4: Discovered Longitudinal Pattern -->
    <div class="ai-card-result correlation">
      <div class="aic-title">
        <span>🧬 Discovered Longitudinal Pattern Insight</span>
        <span class="aic-badge badge-blue">Gemini RAG Synthesis</span>
      </div>
      <div class="aic-content">
        ${data.correlation}
      </div>
    </div>
  `;

  if (animate) {
    const cards = outputContainer.querySelectorAll('.ai-card-result');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(10px)';
      card.style.transition = `all 0.35s ease ${index * 0.12}s`;
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 50);
    });
  }
}

/* ==========================================================================
   3. Interactive Workflow Tabs
   ========================================================================== */
function initWorkflowTabs() {
  const tabBtns = document.querySelectorAll('.diag-tab-btn');
  const panels = document.querySelectorAll('.diag-panel');

  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   4. Executive Pitch Deck Modal & Clipboard Copy
   ========================================================================== */
function initPitchModal() {
  const openBtn = document.getElementById('openPitchModalBtn');
  const openBtn2 = document.getElementById('openPitchModalBtn2');
  const closeBtn = document.getElementById('closePitchModalBtn');
  const overlay = document.getElementById('pitchModalOverlay');
  const copyBtn = document.getElementById('copyPitchDeckBtn');
  const toast = document.getElementById('copyToast');

  if (!overlay) return;

  const openModal = (e) => {
    if (e) e.preventDefault();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (openBtn2) openBtn2.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const pitchText = `
Z-LIFE AI: NEURODIVERGENT CARE & PREDICTIVE INTELLIGENCE ENGINE
Google for Startups Application Pitch Summary

FOUNDER & CONTACT:
- Founder & Lead Architect: Firos Shamsudeen (Father of Zeba)
- LinkedIn: https://www.linkedin.com/in/firos/
- Contact Email: info@zeehash.com

1. THE NON-PROFIT VISION & PLEDGE:
100% Free Public Benefit Initiative — Zero Business Involved.
Neurodivergent families are already financially strained by therapy and medical costs. Z-Life is strictly non-profit:
- Freely available forever to needy families and special education schools.
- Zero paywalls, zero subscription tiers, and zero advertisements.
- Absolute Zero-Data Selling Guarantee: sensitive health/behavioral logs will never be commercialized.
- Sustained through Google AI for Social Good grants and accessibility research partnerships.

2. THE PROBLEM:
Autism Spectrum Disorder (ASD) affects 1 in 36 children. Daily care involves fragmented communication between exhausted parents, teachers, and therapists. Non-verbal sensory overload is frequently misunderstood as "behavioral defiance", leading to school meltdowns and caregiver burnout.

3. THE SOLUTION (Z-LIFE):
A fast, dual-role tactile web application (Parent Full Access + Teacher View-Only & Sensory SOS) tracking 10 high-impact clinical vectors: Sleep duration, emotional state, dynamic medications, menstrual cycle correlation, sensory behaviors, calming interventions, skill enrichment, nutrition, and voice notes.

4. THE AI UNFAIR ADVANTAGE (GEMINI POWERED):
Instead of passive charts, Z-Life pipes historical structured logs into Google Gemini 1.5/2.0. The LLM correlates sleep deficit, food intake, and hormonal cycles to:
- Forecast sensory overload windows with high predictive accuracy.
- Generate step-by-step personalized calming interventions right when needed.
- Deliver an automated 30-second morning teacher handoff note.
- Discover long-term neurodivergent patterns across weeks of logs.

5. REAL WORLD VALIDATION:
Currently tested and actively deployed for Zeba, a 15-year-old neurodivergent student with ADHD, Autism, and sensory processing differences.

6. GOOGLE STARTUP ALIGNMENT:
- Core reliance on Gemini API (multimodal reasoning, long-context window).
- Built for Google Cloud Healthcare API & Vertex AI integration.
- Directly serves Google's Assistive Technology & Accessibility mission.

Contact: info@zeehash.com | LinkedIn: https://www.linkedin.com/in/firos/
      `.trim();

      navigator.clipboard.writeText(pitchText).then(() => {
        showToast('Pitch summary copied to clipboard! ✨');
      }).catch(() => {
        showToast('Selection copied! ✨');
      });
    });
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }
}

/* ==========================================================================
   5. Smooth Scroll Navigation
   ========================================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
