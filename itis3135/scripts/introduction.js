(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const DEFAULT_IMG = 'images/red-hand-mirror-selfie.png';
  const form = $('intro-form');
  const result = $('result');
  const coursesEl = $('courses');
  const preview = $('photo-preview');
  let imageSrc = DEFAULT_IMG;   // what the built page shows (a data URL after an upload)
  let imageFile = DEFAULT_IMG;  // what the JSON and XML exports record (the "img" key)

  const INITIAL_COURSES = [
    ['ITIS', '3135', 'Front End Web Development', 'Required for my major and cybersecurity concentration.'],
    ['ITIS', '6214', 'Usable Security & Privacy', 'Interesting graduate level course, needed for my major'],
    ['ITSC', '3160', 'Database Design & Implementation', 'Needed for my major, teaches SQL'],
    ['ITSC', '3155', 'Software Development', 'Required for my major, teaches enterprise software design/development']
  ];

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ---------- Course rows (add + delete) ---------- */
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

  // Keep at least one course on the page
  function updateDeleteButtons() {
    const only = coursesEl.children.length < 2;
    coursesEl.querySelectorAll('.delete-course').forEach((b) => { b.disabled = only; });
  }
  updateDeleteButtons();

  function addCourse() {
    coursesEl.insertAdjacentHTML('beforeend', courseRow(['', '', '', '']));
    coursesEl.lastElementChild.querySelector('input').focus();
    updateDeleteButtons();
  }
  $('add-course').addEventListener('click', addCourse);

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

  /* ---------- Helpers for names and dates ---------- */
  // "F" or "f." becomes "F."; a full middle name is left as typed
  function normalizeMiddle(raw) {
    const m = raw.trim();
    return /^[A-Za-z]\.?$/.test(m) ? m[0].toUpperCase() + '.' : m;
  }

  // 08/18/2026 -> 8/18/2026
  function formatDate(value) {
    const dm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    return dm ? (+dm[1]) + '/' + (+dm[2]) + '/' + dm[3] : value;
  }

  /* ---------- Collect the form into one object that uses the data-model keys ---------- */
  function collect() {
    const v = (id) => $(id).value.trim();

    const computer = v('manufacturer') + ' ' + v('device-type') + ', ' +
      v('os') + ', Version ' + v('os-version');

    const personalInfo = {
      statement: v('statement'),
      personalBackground: v('personal-bg'),
      professionalBackground: v('professional-bg'),
      academicBackground: v('academic-bg')
    };
    // The data model has no key for this optional bullet, so it is only added when it is filled in
    if (v('web-bg')) personalInfo.webDevelopmentBackground = v('web-bg');
    personalInfo.primaryWorkComputer = computer;
    personalInfo.primaryWorkLocation = v('work-location');
    personalInfo.alternateComputerLocation = v('alternate');

    return {
      firstName: v('first-name'),
      middleName: normalizeMiddle(v('middle-name')),
      nickname: v('nickname'),
      lastName: v('last-name'),
      acknowledgment: v('ack-statement'),
      acknowledgmentDate: formatDate(v('ack-date')),
      prettyNameDivider: v('divider'),
      adjectives: v('mascot-adjective'),
      animal: v('mascot-animal'),
      img: imageFile,
      pictureAlt: v('picture-alt'),
      caption: v('caption'),
      personalInfo: personalInfo,
      courses: Array.from(coursesEl.children).map((li) => {
        const g = (n) => li.querySelector('[name="' + n + '"]').value.trim();
        return { department: g('department'), courseNumber: g('number'),
                 courseTitle: g('courseName'), reasonForTaking: g('reason') };
      }),
      quote: '“' + v('quote-text') + '”',
      quoteAuthor: v('quote-author'),
      funnyItem: v('funny-item'),
      somethingToShare: v('also-share'),
      footerLinks: Array.from(document.querySelectorAll('.link-input')).map((i) => ({ label: i.dataset.name, url: i.value.trim() }))
    };
  }

  /* ---------- Output builders ---------- */
  function entryHTML(d) {
    const mid = d.middleName ? ' ' + d.middleName : '';
    const nick = d.nickname ? ' "' + d.nickname + '"' : '';
    const heading = d.lastName + ', ' + d.firstName + mid;
    const displayName = (d.firstName + mid + nick + ' ' + d.lastName).replace(/\s+/g, ' ').trim() +
      ' ' + d.prettyNameDivider + ' ' + d.adjectives + ' ' + d.animal;
    const initials = ((d.firstName[0] || '') + (d.middleName[0] || '') + (d.lastName[0] || '')).toUpperCase();
    const p = d.personalInfo;
    const bullet = (label, text) => '    <li><strong>' + esc(label) + '</strong> ' + esc(text) + '</li>\n';

    let h = '<p class="entry-name"><strong>' + esc(heading) + '</strong></p>\n';
    h += '<p>' + esc(d.acknowledgment) + ' - <em>' + esc(initials) + '. ' + esc(d.acknowledgmentDate) + '</em></p>\n';
    h += '<h6>' + esc(displayName) + '</h6>\n';
    h += '<figure>\n  <img class="figure" src="' + esc(imageSrc) + '" width="300" height="400" alt="' + esc(d.pictureAlt) + '">\n';
    h += '  <figcaption>' + esc(d.caption) + '</figcaption>\n</figure>\n';
    h += '<p>' + esc(p.statement) + '</p>\n<ul>\n';
    h += bullet('Personal Background:', p.personalBackground);
    h += bullet('Professional Background:', p.professionalBackground);
    h += bullet('Academic Background:', p.academicBackground);
    if (p.webDevelopmentBackground) h += bullet('Background in this Course’s Material:', p.webDevelopmentBackground);
    h += bullet('Primary Work Computer:', p.primaryWorkComputer);
    h += bullet('Primary Work Location:', p.primaryWorkLocation);
    h += bullet('Alternate Computer & Location:', p.alternateComputerLocation);
    h += '    <li><strong>Courses I’m taking &amp; Why:</strong>\n      <ol>\n';
    h += d.courses.map((c) => '        <li><strong>' + esc(c.department + c.courseNumber) + ' - ' + esc(c.courseTitle) + ':</strong> ' + esc(c.reasonForTaking) + '</li>\n').join('');
    h += '      </ol>\n    </li>\n';
    if (d.funnyItem) h += bullet('Funny/Interesting Item to Remember Me by:', d.funnyItem);
    if (d.somethingToShare) h += bullet('I’d Also Like to Share:', d.somethingToShare);
    h += '</ul>\n<blockquote>\n  <p>' + esc(d.quote) + '</p>\n  <p>- <em>' + esc(d.quoteAuthor) + '</em></p>\n</blockquote>\n';
    h += '<p class="profile-links">' + d.footerLinks.map((l) => '<a href="' + esc(l.url) + '">' + esc(l.label) + '</a>').join(' | ') + '</p>\n';
    return h;
  }

  function htmlDoc(d) {
    const mid = d.middleName ? ' ' + d.middleName : '';
    const nick = d.nickname ? ' "' + d.nickname + '"' : '';
    const title = (d.firstName + mid + nick + ' ' + d.lastName).replace(/\s+/g, ' ').trim() +
      ' ' + d.prettyNameDivider + ' ' + d.adjectives + ' ' + d.animal;
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      '  <title>' + esc(title) + ' | Introduction</title>\n' +
      '  <link rel="stylesheet" href="styles/default.css">\n' +
      '</head>\n<body>\n<main class="content-block">\n' + entryHTML(d) + '</main>\n</body>\n</html>\n';
  }

  // Element names for the items inside each array
  const XML_ITEMS = { courses: 'course', footerLinks: 'link' };

  function toXml(name, val, ind) {
    if (Array.isArray(val)) {
      const item = XML_ITEMS[name] || 'item';
      return ind + '<' + name + '>\n' + val.map((x) => toXml(item, x, ind + '  ')).join('') + ind + '</' + name + '>\n';
    }
    if (val && typeof val === 'object') {
      return ind + '<' + name + '>\n' + Object.keys(val).map((k) => toXml(k, val[k], ind + '  ')).join('') + ind + '</' + name + '>\n';
    }
    return ind + '<' + name + '>' + esc(val) + '</' + name + '>\n';
  }

  const FORMATS = {
    html: { label: 'HTML', ext: 'html', mime: 'text/html', build: htmlDoc },
    json: { label: 'JSON', ext: 'json', mime: 'application/json', build: (d) => JSON.stringify(d, null, 2) },
    xml:  { label: 'XML',  ext: 'xml',  mime: 'application/xml',
            build: (d) => '<?xml version="1.0" encoding="UTF-8"?>\n' + toXml('introduction', d, '') }
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

  /* ---------- Required-field validation ---------- */
  // The browser's "required" attribute accepts a box that holds only spaces, so check the trimmed value too.
  // Returns the first field that is not filled in, or null when the form is complete.
  function findMissingRequired() {
    let firstMissing = null;
    form.querySelectorAll('[required]').forEach((el) => {
      if (el === dateInput) return;   // the date has its own check above
      const blank = el.value.trim() === '';
      el.setCustomValidity(blank ? 'Please fill out this field.' : '');
      if (blank && !firstMissing) firstMissing = el;
    });
    return firstMissing;
  }

  // Clear the "blank" message as soon as the person starts typing again
  form.addEventListener('input', (ev) => {
    if (ev.target !== dateInput && ev.target.setCustomValidity) ev.target.setCustomValidity('');
  });

  /* ---------- Submit, Reset, Clear ---------- */
  function showForm() {
    result.hidden = true;
    form.hidden = false;
    $('form-heading').hidden = false;
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();   // stops the page refresh / default form behavior

    const missing = findMissingRequired();
    if (missing) { missing.reportValidity(); return; }
    if (!form.checkValidity()) { form.reportValidity(); return; }

    result.innerHTML = entryHTML(collect()) + '<p><a href="#" id="reset-link">Reset and fill out the form again</a></p>';
    form.hidden = true;
    $('form-heading').hidden = true;
    result.hidden = false;
  });

  // Reset: back to the pre-filled values, the starting courses and the default picture
  form.addEventListener('reset', () => {
    coursesEl.innerHTML = initialCoursesHTML;
    updateDeleteButtons();
    resetImage();
    setTimeout(() => {          // the browser restores the field values after this event
      form.querySelectorAll('input, textarea').forEach((el) => el.setCustomValidity(''));
      checkDate();
    }, 0);
  });

  result.addEventListener('click', (ev) => {
    if (ev.target.id === 'reset-link') {
      ev.preventDefault();
      form.reset();
      showForm();
    }
  });

  // Clear: empty every field so the placeholders show
  $('clear').addEventListener('click', () => {
    form.querySelectorAll('input, textarea').forEach((el) => { el.value = ''; el.setCustomValidity(''); });
    resetImage();
    checkDate();
  });
})();
