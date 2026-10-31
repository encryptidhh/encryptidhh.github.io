(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const DEFAULT_IMG = 'images/red-hand-mirror-selfie.png';
  const form = $('intro-form');
  const result = $('result');
  const coursesEl = $('courses');
  const preview = $('photo-preview');
  let imageSrc = DEFAULT_IMG;   // what the built page shows (a data URL after an upload)
  let imageFile = DEFAULT_IMG;  // what the JSON and XML exports record

  const INITIAL_COURSES = [
    ['ITIS', '3135', 'Front End Web Development', 'Required for my major and cybersecurity concentration.'],
    ['ITIS', '6214', 'Usable Security & Privacy', 'Interesting graduate level course, needed for my major'],
    ['ITSC', '3160', 'Database Design & Implementation', 'Needed for my major, teaches SQL'],
    ['ITSC', '3155', 'Software Development', 'Required for my major, teaches enterprise software design/development']
  ];

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ---------- Course rows ---------- */
  function courseRow(c) {
    return '<li class="course-group">' +
      '<input type="text" name="department" value="' + esc(c[0]) + '" placeholder="Dept (ITIS)" aria-label="Department" pattern="[A-Z]{2,4}" title="2-4 capital letters, such as ITIS" required>' +
      '<input type="text" name="number" value="' + esc(c[1]) + '" placeholder="No. (3135)" aria-label="Course number" pattern="[0-9]{3,4}" title="3-4 digits, such as 3135" required>' +
      '<input type="text" name="courseName" value="' + esc(c[2]) + '" placeholder="Course name" aria-label="Course name" required>' +
      '<input type="text" name="reason" value="' + esc(c[3]) + '" placeholder="Reason for taking it" aria-label="Reason for taking it" required>' +
      '<button type="button" class="delete-course" aria-label="Delete this course">Delete</button></li>';
  }
  const initialCoursesHTML = INITIAL_COURSES.map(courseRow).join('');
  coursesEl.innerHTML = initialCoursesHTML;

  function updateDeleteButtons() {
    const only = coursesEl.children.length < 2;
    coursesEl.querySelectorAll('.delete-course').forEach((b) => { b.disabled = only; });
  }
  updateDeleteButtons();

  $('add-course').addEventListener('click', () => {
    coursesEl.insertAdjacentHTML('beforeend', courseRow(['', '', '', '']));
    coursesEl.lastElementChild.querySelector('input').focus();
    updateDeleteButtons();
  });
  coursesEl.addEventListener('click', (ev) => {
    if (ev.target.classList.contains('delete-course')) {
      ev.target.closest('li').remove();
      updateDeleteButtons();
    }
  });

  /* ---------- Picture ---------- */
  function resetImage() {
    imageSrc = DEFAULT_IMG;
    imageFile = DEFAULT_IMG;
    preview.src = DEFAULT_IMG;
  }
  $('photo').addEventListener('change', () => {
    const file = $('photo').files[0];
    if (!file) { resetImage(); return; }
    const reader = new FileReader();
    reader.onload = () => {
      imageSrc = reader.result;
      imageFile = 'images/' + file.name;
      preview.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  /* ---------- Collect the form into one data object ---------- */
  function collect() {
    const v = (id) => $(id).value.trim();
    const first = v('first-name'), last = v('last-name'), nick = v('nickname');
    const mi = v('middle-initial').replace(/[^A-Za-z]/g, '').toUpperCase();
    const mid = mi ? ' ' + mi + '.' : '';
    const fullName = (first + mid + (nick ? ' "' + nick + '"' : '') + ' ' + last).replace(/\s+/g, ' ').trim();
    const dm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v('ack-date'));
    const computer = {
      manufacturer: v('manufacturer'), deviceType: v('device-type'),
      operatingSystem: v('os'), version: v('os-version')
    };
    computer.summary = computer.manufacturer + ' ' + computer.deviceType + ', ' +
      computer.operatingSystem + ', Version ' + computer.version;
    return {
      name: { first: first, middleInitial: mi, nickname: nick, last: last,
              heading: last + ', ' + first + mid },
      acknowledgment: { statement: v('ack-statement'),
                        initials: ((first[0] || '') + mi + (last[0] || '')).toUpperCase(),
                        date: dm ? (+dm[1]) + '/' + (+dm[2]) + '/' + dm[3] : v('ack-date') },
      mascot: { adjective: v('mascot-adjective'), animal: v('mascot-animal'), divider: v('divider') },
      displayName: fullName + ' ' + v('divider') + ' ' + v('mascot-adjective') + ' ' + v('mascot-animal'),
      picture: { src: imageSrc, file: imageFile, caption: v('caption') },
      personalStatement: v('statement'),
      background: { personal: v('personal-bg'), professional: v('professional-bg'),
                    academic: v('academic-bg'), webDevelopment: v('web-bg') },
      computer: computer,
      workLocation: v('work-location'),
      alternate: v('alternate'),
      courses: Array.from(coursesEl.children).map((li) => {
        const g = (n) => li.querySelector('[name="' + n + '"]').value.trim();
        return { department: g('department'), number: g('number'),
                 code: g('department') + g('number'), name: g('courseName'), reason: g('reason') };
      }),
      funnyItem: v('funny-item'),
      alsoToShare: v('also-share'),
      quote: { text: v('quote-text'), author: v('quote-author') },
      links: Array.from(document.querySelectorAll('.link-input')).map((i) => ({ name: i.dataset.name, url: i.value.trim() }))
    };
  }

  /* ---------- Output builders ---------- */
  function entryHTML(d) {
    const bullet = (label, text) => '    <li><strong>' + esc(label) + '</strong> ' + esc(text) + '</li>\n';
    let h = '<p class="entry-name"><strong>' + esc(d.name.heading) + '</strong></p>\n';
    h += '<p>' + esc(d.acknowledgment.statement) + ' - <em>' + esc(d.acknowledgment.initials) + '. ' + esc(d.acknowledgment.date) + '</em></p>\n';
    h += '<h6>' + esc(d.displayName) + '</h6>\n';
    h += '<figure>\n  <img class="figure" src="' + esc(d.picture.src) + '" width="300" height="400" alt="Photo of ' + esc(d.name.first + ' ' + d.name.last) + '">\n';
    h += '  <figcaption>' + esc(d.picture.caption) + '</figcaption>\n</figure>\n';
    h += '<p>' + esc(d.personalStatement) + '</p>\n<ul>\n';
    h += bullet('Personal Background:', d.background.personal);
    h += bullet('Professional Background:', d.background.professional);
    h += bullet('Academic Background:', d.background.academic);
    if (d.background.webDevelopment) h += bullet('Background in this Course’s Material:', d.background.webDevelopment);
    h += bullet('Primary Work Computer:', d.computer.summary);
    h += bullet('Primary Work Location:', d.workLocation);
    h += bullet('Alternate Computer & Location:', d.alternate);
    h += '    <li><strong>Courses I’m taking &amp; Why:</strong>\n      <ol>\n';
    h += d.courses.map((c) => '        <li><strong>' + esc(c.code) + ' - ' + esc(c.name) + ':</strong> ' + esc(c.reason) + '</li>\n').join('');
    h += '      </ol>\n    </li>\n';
    if (d.funnyItem) h += bullet('Funny/Interesting Item to Remember Me by:', d.funnyItem);
    if (d.alsoToShare) h += bullet('I’d Also Like to Share:', d.alsoToShare);
    h += '</ul>\n<blockquote>\n  <p>“' + esc(d.quote.text) + '”</p>\n  <p>- <em>' + esc(d.quote.author) + '</em></p>\n</blockquote>\n';
    h += '<p class="profile-links">' + d.links.map((l) => '<a href="' + esc(l.url) + '">' + esc(l.name) + '</a>').join(' | ') + '</p>\n';
    return h;
  }

  function htmlDoc(d) {
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      '  <title>' + esc(d.displayName) + ' | Introduction</title>\n' +
      '  <link rel="stylesheet" href="styles/default.css">\n' +
      '</head>\n<body>\n<main class="content-block">\n' + entryHTML(d) + '</main>\n</body>\n</html>\n';
  }

  function exportData(d) {
    return Object.assign({}, d, { picture: { file: d.picture.file, caption: d.picture.caption } });
  }

  function toXml(name, val, ind) {
    if (Array.isArray(val)) {
      const item = name === 'courses' ? 'course' : 'link';
      return ind + '<' + name + '>\n' + val.map((x) => toXml(item, x, ind + '  ')).join('') + ind + '</' + name + '>\n';
    }
    if (val && typeof val === 'object') {
      return ind + '<' + name + '>\n' + Object.keys(val).map((k) => toXml(k, val[k], ind + '  ')).join('') + ind + '</' + name + '>\n';
    }
    return ind + '<' + name + '>' + esc(val) + '</' + name + '>\n';
  }

  const FORMATS = {
    html: { label: 'HTML', ext: 'html', mime: 'text/html', build: htmlDoc },
    json: { label: 'JSON', ext: 'json', mime: 'application/json', build: (d) => JSON.stringify(exportData(d), null, 2) },
    xml:  { label: 'XML',  ext: 'xml',  mime: 'application/xml',
            build: (d) => '<?xml version="1.0" encoding="UTF-8"?>\n' + toXml('introduction', exportData(d), '') }
  };

  function generate(kind) {
    const f = FORMATS[kind];
    let box = $('out-' + kind);
    if (!box) {
      const wrap = document.createElement('div');
      wrap.className = 'output-block';
      wrap.innerHTML = '<label for="out-' + kind + '"><strong>' + f.label + ' output</strong></label>' +
        '<textarea id="out-' + kind + '" readonly></textarea>' +
        '<p><button type="button" class="download" data-kind="' + kind + '">Download ' + f.label + ' file</button></p>';
      $('output').appendChild(wrap);
      box = $('out-' + kind);
    }
    box.value = f.build(collect());
  }
  ['html', 'json', 'xml'].forEach((k) => $('gen-' + k).addEventListener('click', () => generate(k)));

  $('output').addEventListener('click', (ev) => {
    if (!ev.target.classList.contains('download')) return;
    const f = FORMATS[ev.target.dataset.kind];
    const url = URL.createObjectURL(new Blob([$('out-' + ev.target.dataset.kind).value], { type: f.mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'introduction.' + f.ext;
    a.click();
    URL.revokeObjectURL(url);
  });

  /* ---------- Date: strict MM/DD/YYYY ---------- */
  const dateInput = $('ack-date');

  function dateProblem(value) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!m) return 'Enter the date as MM/DD/YYYY, such as 08/18/2026.';
    const month = +m[1], day = +m[2], year = +m[3];
    const d = new Date(year, month - 1, day);
    // Date rolls invalid dates over (02/30 becomes 03/02), so compare the parts to catch them
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
      return 'That date does not exist. Use MM/DD/YYYY.';
    }
    return '';
  }

  // An empty box is left to the "required" check; anything else must match exactly
  function checkDate() {
    dateInput.setCustomValidity(dateInput.value === '' ? '' : dateProblem(dateInput.value));
  }
  dateInput.addEventListener('input', checkDate);
  checkDate();

  /* ---------- Submit, Reset, Clear ---------- */
  function showForm() {
    result.hidden = true;
    form.hidden = false;
    $('form-heading').hidden = false;
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();   // the browser has already blocked the submit if a required field is empty
    result.innerHTML = entryHTML(collect()) + '<p><a href="#" id="reset-link">Reset and fill out the form again</a></p>';
    form.hidden = true;
    $('form-heading').hidden = true;
    result.hidden = false;
  });

  form.addEventListener('reset', () => {
    coursesEl.innerHTML = initialCoursesHTML;
    updateDeleteButtons();
    resetImage();
    setTimeout(checkDate, 0);   // the browser restores the date value after this event
  });

  result.addEventListener('click', (ev) => {
    if (ev.target.id === 'reset-link') {
      ev.preventDefault();
      form.reset();
      showForm();
    }
  });

  $('clear').addEventListener('click', () => {
    form.querySelectorAll('input, textarea').forEach((el) => { el.value = ''; });
    resetImage();
    checkDate();
  });
})();