(function () {
  'use strict';

  function renderQuiz(block) {
    var scriptTag = block.querySelector('script[type="application/json"]');
    if (!scriptTag) return;

    var data;
    try {
      data = JSON.parse(scriptTag.textContent);
    } catch (e) {
      return;
    }

    var question    = data.question    || '';
    var choices     = data.choices     || [];
    var answer      = data.answer;      // 0-indexed
    var explanation = data.explanation || '';

    // --- question ---
    var qEl = document.createElement('div');
    qEl.className = 'quiz-question';
    qEl.innerHTML = question;

    // --- choices ---
    var cEl = document.createElement('div');
    cEl.className = 'quiz-choices';

    choices.forEach(function (text, i) {
      var btn = document.createElement('button');
      btn.className = 'quiz-choice';
      btn.innerHTML =
        '<span class="quiz-choice-label">' + String.fromCharCode(65 + i) + '</span>' +
        '<span class="quiz-choice-text">'  + text + '</span>';
      btn.dataset.index = i;
      btn.addEventListener('click', function () {
        onSelect(block, i, answer, explanation);
      });
      cEl.appendChild(btn);
    });

    // --- feedback (hidden until answered) ---
    var fEl = document.createElement('div');
    fEl.className = 'quiz-feedback';

    block.innerHTML = '';
    block.appendChild(qEl);
    block.appendChild(cEl);
    block.appendChild(fEl);

    typesetBlock(block);
  }

  function onSelect(block, selected, correct, explanation) {
    var buttons = block.querySelectorAll('.quiz-choice');

    // disable all choices
    buttons.forEach(function (btn) {
      btn.disabled = true;
    });

    var isCorrect = (selected === correct);

    buttons[selected].classList.add(isCorrect ? 'quiz-correct' : 'quiz-incorrect');
    if (!isCorrect) {
      buttons[correct].classList.add('quiz-correct');
    }

    var fEl = block.querySelector('.quiz-feedback');
    fEl.className = 'quiz-feedback ' + (isCorrect ? 'quiz-verdict-correct' : 'quiz-verdict-incorrect');
    fEl.innerHTML =
      '<div class="quiz-verdict-label">' + (isCorrect ? '&#10003; 正解' : '&#10007; 不正解') + '</div>' +
      '<div class="quiz-explanation-text">' + explanation + '</div>';

    typesetBlock(fEl);
  }

  function typesetBlock(el) {
    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
      MathJax.typesetPromise([el]);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.quiz-block').forEach(renderQuiz);
  });
})();
