(function () {
  'use strict';

  // ===== SEARCH TOGGLE =====
  const toggleBtn = document.querySelector('.search-toggle-btn');
  const searchCont = document.querySelector('.search-container');
  if (toggleBtn && searchCont) {
    toggleBtn.removeAttribute('onclick');
    toggleBtn.addEventListener('click', function () {
      searchCont.classList.toggle('open');
      if (searchCont.classList.contains('open')) {
        const f = searchCont.querySelector('.search-field');
        if (f) f.focus();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') searchCont.classList.remove('open');
    });
  }

  // ===== POST FILTER HELPERS =====
  function getPostCards() {
    return Array.from(document.querySelectorAll('.post-card'));
  }

  function showAllPosts() {
    getPostCards().forEach(function (card) { card.style.display = ''; });
    const msg = document.querySelector('.no-results-msg');
    if (msg) msg.remove();
  }

  function filterPostsByText(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) { showAllPosts(); return; }
    let visible = 0;
    getPostCards().forEach(function (card) {
      const title = (card.querySelector('.post-title') || {}).textContent || '';
      const cats = (card.querySelector('.post-categories') || {}).textContent || '';
      const excerpt = (card.querySelector('.post-excerpt') || {}).textContent || '';
      const matches = title.toLowerCase().includes(q) ||
                      cats.toLowerCase().includes(q) ||
                      excerpt.toLowerCase().includes(q);
      card.style.display = matches ? '' : 'none';
      if (matches) visible++;
    });
    updateNoResults(visible, 'search');
  }

  function filterPostsByCategory(cat) {
    if (!cat || cat === 'Select Category') { showAllPosts(); return; }
    const catName = cat.replace(/\s*\(\d+\)/, '').toLowerCase().trim();
    let visible = 0;
    getPostCards().forEach(function (card) {
      const cats = (card.querySelector('.post-categories') || {}).textContent || '';
      const matches = cats.toLowerCase().includes(catName);
      card.style.display = matches ? '' : 'none';
      if (matches) visible++;
    });
    updateNoResults(visible, 'category "' + cat.replace(/\s*\(\d+\)/, '').trim() + '"');
  }

  function updateNoResults(count, context) {
    const postsEl = document.querySelector('.posts');
    if (!postsEl) return;
    let msg = postsEl.nextElementSibling;
    if (msg && msg.classList.contains('no-results-msg')) msg.remove();
    if (count === 0) {
      msg = document.createElement('p');
      msg.className = 'no-results-msg';
      msg.textContent = 'No posts found for ' + context + '.';
      postsEl.insertAdjacentElement('afterend', msg);
    }
  }

  // ===== SIDEBAR SEARCH =====
  document.querySelectorAll('.widget .search-form').forEach(function (form) {
    const field = form.querySelector('.search-field');
    if (!field) return;
    field.addEventListener('input', function () { filterPostsByText(field.value); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      filterPostsByText(field.value);
    });
  });

  // ===== NAV SEARCH =====
  if (searchCont) {
    const navForm = searchCont.querySelector('.search-form');
    if (navForm) {
      navForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const field = navForm.querySelector('.search-field');
        filterPostsByText(field ? field.value : '');
        searchCont.classList.remove('open');
      });
    }
  }

  // ===== CATEGORY FILTER =====
  document.querySelectorAll('.category-select').forEach(function (sel) {
    sel.addEventListener('change', function () { filterPostsByCategory(sel.value); });
  });

  // ===== DYNAMIC CALENDAR =====
  var MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  function buildCalendarHTML(year, month) {
    var today = new Date();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday=0 to Monday-first grid
    firstDay = (firstDay === 0) ? 6 : firstDay - 1;

    var prevYear = month === 0 ? year - 1 : year;
    var prevMonth = month === 0 ? 11 : month - 1;
    var nextYear = month === 11 ? year + 1 : year;
    var nextMonth = month === 11 ? 0 : month + 1;

    var rows = '';
    var day = 1;
    for (var r = 0; r < 6; r++) {
      if (day > daysInMonth) break;
      var row = '<tr>';
      for (var d = 0; d < 7; d++) {
        var cell = r * 7 + d;
        if (cell < firstDay || day > daysInMonth) {
          row += '<td>&nbsp;</td>';
        } else {
          var isToday = year === today.getFullYear() &&
                        month === today.getMonth() &&
                        day === today.getDate();
          row += '<td' + (isToday ? ' class="today"' : '') + '>' + day + '</td>';
          day++;
        }
      }
      row += '</tr>';
      rows += row;
    }

    return '<caption>' + MONTH_NAMES[month] + ' ' + year + '</caption>' +
      '<thead><tr><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th><th>S</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '<tfoot><tr>' +
        '<td id="prev"><a href="#" data-year="' + prevYear + '" data-month="' + prevMonth + '">' +
          '&laquo; ' + MONTH_NAMES[prevMonth].slice(0, 3) + '</a></td>' +
        '<td colspan="5">&nbsp;</td>' +
        '<td id="next"><a href="#" data-year="' + nextYear + '" data-month="' + nextMonth + '">' +
          MONTH_NAMES[nextMonth].slice(0, 3) + ' &raquo;</a></td>' +
      '</tr></tfoot>';
  }

  function initCalendar() {
    var cal = document.getElementById('wp-calendar');
    if (!cal) return;
    var today = new Date();
    var curYear = today.getFullYear();
    var curMonth = today.getMonth();

    function renderCalendar(year, month) {
      cal.innerHTML = buildCalendarHTML(year, month);

      // Update widget title
      var widget = cal.closest ? cal.closest('.widget') : null;
      if (!widget) {
        var p = cal.parentElement;
        while (p) { if (p.classList && p.classList.contains('widget')) { widget = p; break; } p = p.parentElement; }
      }
      if (widget) {
        var titleEl = widget.querySelector('.widget-title');
        if (titleEl) titleEl.textContent = MONTH_NAMES[month] + ' ' + year;
      }

      // Bind nav links
      cal.querySelectorAll('tfoot a').forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          curYear = parseInt(this.getAttribute('data-year'), 10);
          curMonth = parseInt(this.getAttribute('data-month'), 10);
          renderCalendar(curYear, curMonth);
        });
      });
    }

    renderCalendar(curYear, curMonth);
  }

  initCalendar();

  // ===== CONTACT FORM =====
  var contactForm = document.querySelector('.page-post form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (contactForm.querySelector('#name') || {}).value || '';
      var email = (contactForm.querySelector('#email') || {}).value || '';
      var message = (contactForm.querySelector('#message') || {}).value || '';

      name = name.trim();
      email = email.trim();
      message = message.trim();

      if (!name || !email || !message) {
        showFormMsg(contactForm, 'Please fill in all required fields.', 'error');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormMsg(contactForm, 'Please enter a valid email address.', 'error');
        return;
      }

      showFormMsg(contactForm, 'Thank you! Your message has been sent.', 'success');
      contactForm.reset();
    });
  }

  function showFormMsg(form, text, type) {
    var el = form.querySelector('.form-message');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-message';
      form.insertBefore(el, form.firstChild);
    }
    el.textContent = text;
    var base = 'padding:12px 16px;margin-bottom:20px;border-radius:2px;font-size:0.9rem;font-weight:700;';
    el.style.cssText = base + (type === 'success'
      ? 'background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.4);'
      : 'background:rgba(0,0,0,0.25);color:#fff;border:1px solid rgba(255,255,255,0.2);');
  }

})();
