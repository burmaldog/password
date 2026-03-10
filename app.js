// Utility functions
const getPlural = (number, one, two, five) => {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) {
    return five;
  }
  n %= 10;
  if (n === 1) {
    return one;
  }
  if (n >= 2 && n <= 4) {
    return two;
  }
  return five;
};

const formatTime = (seconds) => {
  if (seconds === 0) return 'Введите пароль';
  if (seconds < 1) return 'Мгновенно';
  if (seconds === Infinity) return 'Вечность';

  if (seconds < 60) {
    const val = Math.round(seconds);
    return `${val} ${getPlural(val, 'секунда', 'секунды', 'секунд')}`;
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    const val = Math.round(minutes);
    return `${val} ${getPlural(val, 'минута', 'минуты', 'минут')}`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    const val = Math.round(hours);
    return `${val} ${getPlural(val, 'час', 'часа', 'часов')}`;
  }
  const days = hours / 24;
  if (days < 30) {
    const val = Math.round(days);
    return `${val} ${getPlural(val, 'день', 'дня', 'дней')}`;
  }
  const months = days / 30.44;
  if (months < 12) {
    const val = Math.round(months);
    return `${val} ${getPlural(val, 'месяц', 'месяца', 'месяцев')}`;
  }
  const years = days / 365.25;
  if (years < 100) {
    const val = Math.round(years);
    return `${val} ${getPlural(val, 'год', 'года', 'лет')}`;
  }
  if (years < 1000) {
    const val = Math.round(years / 100);
    return `${val} ${getPlural(val, 'век', 'века', 'веков')}`;
  }
  if (years < 1_000_000) {
    const val = Math.round(years / 1000);
    return `${val} ${getPlural(val, 'тысячелетие', 'тысячелетия', 'тысячелетий')}`;
  }
  if (years < 1_000_000_000) {
    const val = Math.round(years / 1_000_000);
    return `${val} ${getPlural(val, 'миллион лет', 'миллиона лет', 'миллионов лет')}`;
  }
  return 'Больше миллиарда лет';
};

// State
let activeTab = 'analyze';
let showPassword = false;
let genLength = 16;
let genLower = true;
let genUpper = true;
let genNumbers = true;
let genSymbols = true;
let generatedPasswords = [];
let copiedIndex = null;

// DOM Elements
const analyzeTab = document.getElementById('analyze-tab');
const generateTab = document.getElementById('generate-tab');
const tabButtons = document.querySelectorAll('.tab-btn');
const passwordInput = document.getElementById('password-input');
const toggleVisibilityBtn = document.getElementById('toggle-visibility');
const eyeIcon = document.getElementById('eye-icon');
const eyeOffIcon = document.getElementById('eye-off-icon');
const timeValue = document.getElementById('time-value');
const feedbackEl = document.getElementById('feedback');
const strengthBars = document.querySelectorAll('.bar');
const charCountEl = document.getElementById('char-count');
const poolSizeEl = document.getElementById('pool-size');
const lengthSlider = document.getElementById('length-slider');
const lengthValue = document.getElementById('length-value');
const optLower = document.getElementById('opt-lower');
const optUpper = document.getElementById('opt-upper');
const optNumbers = document.getElementById('opt-numbers');
const optSymbols = document.getElementById('opt-symbols');
const generateBtn = document.getElementById('generate-btn');
const passwordsList = document.getElementById('passwords-list');

// Tab switching
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    analyzeTab.classList.remove('active');
    generateTab.classList.remove('active');
    
    if (tabName === 'analyze') {
      analyzeTab.classList.add('active');
    } else {
      generateTab.classList.add('active');
      if (generatedPasswords.length === 0) {
        handleGenerate();
      }
    }
  });
});

// Password visibility toggle
toggleVisibilityBtn.addEventListener('click', () => {
  showPassword = !showPassword;
  passwordInput.type = showPassword ? 'text' : 'password';
  eyeIcon.classList.toggle('hidden');
  eyeOffIcon.classList.toggle('hidden');
});

// Password analysis
passwordInput.addEventListener('input', () => {
  const password = passwordInput.value;
  
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;
  
  charCountEl.textContent = password.length;
  poolSizeEl.textContent = poolSize;
  
  if (password.length === 0) {
    timeValue.textContent = 'Введите пароль';
    timeValue.classList.add('placeholder');
    feedbackEl.classList.add('hidden');
    strengthBars.forEach(bar => bar.classList.remove('active'));
    return;
  }
  
  timeValue.classList.remove('placeholder');
  
  const combinations = Math.pow(poolSize, password.length);
  const guessesPerSecond = 100_000_000_000;
  const seconds = combinations / guessesPerSecond;
  
  timeValue.textContent = formatTime(seconds);
  
  // zxcvbn analysis
  const result = zxcvbn(password);
  const score = result.score;
  
  // Update strength bars
  strengthBars.forEach((bar, index) => {
    if (score >= index + 1 || (score === 0 && index === 0)) {
      bar.classList.add('active');
    } else {
      bar.classList.remove('active');
    }
  });
  
  // Feedback
  if (result.feedback.warning) {
    feedbackEl.textContent = 'Содержит словарные слова или частые паттерны';
    feedbackEl.classList.remove('hidden');
  } else {
    feedbackEl.classList.add('hidden');
  }
});

// Generator controls
lengthSlider.addEventListener('input', (e) => {
  genLength = Number(e.target.value);
  lengthValue.textContent = genLength;
});

optLower.addEventListener('change', (e) => {
  genLower = e.target.checked;
  ensureAtLeastOneOption();
});

optUpper.addEventListener('change', (e) => {
  genUpper = e.target.checked;
  ensureAtLeastOneOption();
});

optNumbers.addEventListener('change', (e) => {
  genNumbers = e.target.checked;
  ensureAtLeastOneOption();
});

optSymbols.addEventListener('change', (e) => {
  genSymbols = e.target.checked;
  ensureAtLeastOneOption();
});

function ensureAtLeastOneOption() {
  if (!genLower && !genUpper && !genNumbers && !genSymbols) {
    genLower = true;
    genUpper = true;
    genNumbers = true;
    optLower.checked = true;
    optUpper.checked = true;
    optNumbers.checked = true;
  }
}

// Generate password
function handleGenerate() {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  
  let charset = '';
  const required = [];
  
  if (genLower) { charset += lower; required.push(lower); }
  if (genUpper) { charset += upper; required.push(upper); }
  if (genNumbers) { charset += numbers; required.push(numbers); }
  if (genSymbols) { charset += symbols; required.push(symbols); }
  
  if (charset === '') {
    charset = lower + upper + numbers;
    required.push(lower, upper, numbers);
    genLower = true;
    genUpper = true;
    genNumbers = true;
    optLower.checked = true;
    optUpper.checked = true;
    optNumbers.checked = true;
  }
  
  generatedPasswords = [];
  for (let i = 0; i < 3; i++) {
    let pwd = '';
    required.forEach(reqCharset => {
      pwd += reqCharset[Math.floor(Math.random() * reqCharset.length)];
    });
    
    for (let j = required.length; j < genLength; j++) {
      pwd += charset[Math.floor(Math.random() * charset.length)];
    }
    
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    generatedPasswords.push(pwd);
  }
  
  copiedIndex = null;
  renderPasswords();
}

function renderPasswords() {
  passwordsList.innerHTML = '';
  
  generatedPasswords.forEach((pwd, idx) => {
    const item = document.createElement('div');
    item.className = 'password-item';
    
    const text = document.createElement('span');
    text.className = 'password-text';
    text.textContent = pwd;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = copiedIndex === idx 
      ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(pwd);
      copiedIndex = idx;
      renderPasswords();
      setTimeout(() => {
        copiedIndex = null;
        renderPasswords();
      }, 2000);
    });
    
    item.appendChild(text);
    item.appendChild(copyBtn);
    passwordsList.appendChild(item);
  });
}

generateBtn.addEventListener('click', handleGenerate);

// Initialize
charCountEl.textContent = '0';
poolSizeEl.textContent = '0';
