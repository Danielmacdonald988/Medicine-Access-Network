'use strict';
const categories = [
  ['Integration conversations', 'Reflect on past experiences and everyday goals. No psychotherapy or substance arrangements.'],
  ['Preparation education', 'Discuss intentions, boundaries and questions to ask. No dosing, sourcing or medical clearance.'],
  ['Breathwork', 'Guided breathing within your competence and lawful scope. Describe the method and participation limits.'],
  ['Meditation & mindfulness', 'Guidance in attention and everyday mindfulness. No diagnosis or treatment claims.'],
  ['Somatic practices', 'Nonclinical body-awareness practices. Regulated bodywork and trauma treatment are excluded here.'],
  ['Spiritual support', 'Conversations about meaning, values and spiritual practice. No substance administration.'],
  ['Peer recovery support', 'Nonclinical support around recovery and everyday goals. No detoxification or addiction treatment.'],
  ['Harm-reduction education', 'General risk education and finding qualified support. No substance sales or individualized medical advice.'],
];
const profiles = [
  { id: 'alex', name: 'Alex Morgan', location: 'Boston, MA', formats: ['online'], categories: [0, 3], bio: 'Nonclinical conversations to reflect on past experiences and bring insights into everyday life. Sessions focus on the goals you choose.' },
  { id: 'jordan', name: 'Jordan Rivera', location: 'Austin, TX', formats: ['online', 'inperson'], categories: [2, 3], bio: 'Guided breathing and meditation practices for adults. Ask about the approach, participation limits and session format.' },
  { id: 'sam', name: 'Sam Taylor', location: 'Portland, ME', formats: ['online'], categories: [6, 5], bio: 'Nonclinical support for everyday goals, reflection and connection. Learn about my background and the limits of my role.' },
];
const $ = (selector) => document.querySelector(selector);
const dialog = $('#dialog');
let opener;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format = p => p.formats.length > 1 ? 'Online & in person' : p.formats[0] === 'online' ? 'Online' : 'In person';
function openDialog(title, html) {
  opener = document.activeElement;
  $('#dialog-title').textContent = title;
  $('#dialog-body').innerHTML = html;
  dialog.showModal();
}
$('#close').onclick = () => dialog.close();
dialog.addEventListener('close', () => { $('#dialog-body').replaceChildren(); opener?.focus(); });
$('#categories').insertAdjacentHTML('beforeend', categories.map(([name], i) => `<label><input type="checkbox" value="${i}">${name}</label>`).join(''));
function render() {
  const query = $('#query').value.trim().toLowerCase();
  const location = $('#location').value.trim().toLowerCase();
  const selected = [...document.querySelectorAll('#categories input:checked')].map(el => Number(el.value));
  const formats = [...document.querySelectorAll('#formats input:checked')].map(el => el.value);
  const matches = profiles.filter(p => [p.name, p.bio, ...p.categories.map(i => categories[i][0])].join(' ').toLowerCase().includes(query) && p.location.toLowerCase().includes(location) && (!selected.length || p.categories.some(i => selected.includes(i))) && (!formats.length || p.formats.some(f => formats.includes(f))));
  if ($('#sort').value === 'name') matches.sort((a,b) => a.name.localeCompare(b.name));
  $('#count').textContent = `${matches.length} sample profile${matches.length === 1 ? '' : 's'}`;
  $('#results').innerHTML = matches.length ? matches.map(p => `<article class="card"><div class="avatar" aria-hidden="true">${p.name.split(' ').map(n=>n[0]).join('')}</div><div><h3>${p.name}</h3><span class="muted">${p.location} · ${format(p)}</span><div class="chips">${p.categories.map(i=>`<span class="chip">${categories[i][0]}</span>`).join('')}</div><p>${p.bio}</p></div><div class="card-actions"><span class="small">Administrative review · sample only</span><button class="primary" data-inquiry="${p.id}">Send inquiry</button><button class="text-button" data-profile="${p.id}">View profile</button><span class="small">Free inquiry · No booking</span></div></article>`).join('') : '<div class="empty"><h3>No profiles match these filters.</h3><p>Try another category or location.</p></div>';
}
$('#search').addEventListener('submit', event => { event.preventDefault(); render(); });
$('#categories').addEventListener('change', render); $('#formats').addEventListener('change', render); $('#sort').addEventListener('change', render);
$('#clear').onclick = () => { $('#search').reset(); document.querySelectorAll('aside input').forEach(el=>el.checked=false); $('#sort').value='newest'; render(); };
const notices = {
  review: ['About administrative review', 'Proposed disclosure: an administrator reviews profile content for completeness and policy compliance. This does not verify identity, credentials, insurance or clinical suitability. These sandbox profiles are fictional and have not undergone real screening.'],
  resources: ['Resources preview', 'Ask about the exact service, relevant qualifications, boundaries, fees and cancellation terms. This sandbox does not provide clinical guidance or emergency monitoring.'],
  terms: ['Terms — draft for counsel review', 'This is an isolated design sandbox. All profiles are fictional. Forms are simulated locally in your browser and do not create accounts, bookings or service agreements. The full legal package is pending counsel review and is not published here as an approved contract.'],
  privacy: ['Sandbox privacy', 'Forms are processed only in memory in this browser tab. No account is created and no form content is sent to a facilitator, stored in a database or added to analytics. Hosting may retain ordinary access/security logs. Do not enter real personal information. Refresh to reset.'],
  rules: ['Service rules — draft for counsel review', 'The proposed categories are for education and nonclinical support. No substance supply, administration, sourcing, clinical treatment or arrangements for excluded services. A category selection does not prove qualifications or legality.'],
  report: ['Reporting preview', 'This sandbox does not submit reports. For an actual concern, use the contact page on the live website. If anyone is in immediate danger, contact local emergency services. Do not enter real incident details here.'],
};
document.addEventListener('click', event => {
  const info = event.target.closest('[data-info]');
  if (info) { const [title, text] = notices[info.dataset.info]; openDialog(title, `<p>${text}</p>`); return; }
  const button = event.target.closest('[data-inquiry], [data-profile]');
  if (!button) return;
  const p = profiles.find(p=>p.id===(button.dataset.inquiry || button.dataset.profile));
  if (button.dataset.profile) { openDialog(p.name, `<p class="notice">Fictional sample profile</p><p>${p.location} · ${format(p)}</p><p>${p.bio}</p><h3>Scope</h3><p>Nonclinical support only. No diagnosis, therapy, prescribing or substance administration.</p><h3>Qualifications</h3><p>No qualifications are claimed for this fictional profile.</p><button class="primary" id="profile-inquiry">Try inquiry form</button>`); $('#profile-inquiry').onclick=()=>{dialog.close(); inquiry(p);}; }
  else inquiry(p);
});
function inquiry(p) {
  openDialog(`Contact ${p.name}`, `<p class="notice">Test only. Use fictional details. Nothing will be sent.</p><form id="inquiry-form" class="stack"><label>Name<input name="name" required maxlength="80" autocomplete="off"></label><label>Email<input name="email" type="email" required autocomplete="off" placeholder="reviewer@example.test"></label><label>Brief introduction<textarea name="intro" required minlength="20" maxlength="600" placeholder="Describe the support you want, without sensitive details."></textarea></label><p class="small muted">In the proposed live flow, your contact details and introduction would be shared with the selected facilitator. This sandbox sends nothing.</p><label class="check"><input type="checkbox" required>I am at least 18 and legally able to enter an agreement.</label><label class="check"><input type="checkbox" required>I have reviewed the draft platform terms for this test.</label><label class="check"><input type="checkbox" required>I understand that an inquiry does not book a session or provide consent to a service.</label><button class="primary">Simulate inquiry</button></form>`);
  $('#inquiry-form').onsubmit = event => { event.preventDefault(); $('#dialog-body').innerHTML='<div class="success"><h3>Inquiry preview complete</h3><p>Nothing was sent or stored. No session was booked and no payment was taken.</p></div>'; };
}
$('#signup').onclick = () => {
  openDialog('List your practice', `<p class="notice">Sandbox application · Use fictional information only</p><form id="signup-form" class="stack"><label>Display name<input name="name" required maxlength="80" autocomplete="off"></label><label>Legal provider or business name <span class="help">Private in the proposed flow</span><input name="legal" required maxlength="100" autocomplete="off"></label><label>Email <input name="email" type="email" required placeholder="guide@example.test" autocomplete="off"></label><label>Provider location<input name="location" required placeholder="City, region, country"></label><label>Intended service territories<input name="territories" required placeholder="Where would you offer services?"></label><fieldset><legend>Services you actually offer</legend>${categories.map(([name,description],i)=>`<div class="category-choice"><label><input name="category" type="checkbox" value="${i}">${name}</label><span class="help">${description}</span></div>`).join('')}</fieldset><label>Your introduction — 2–3 sentences<textarea name="bio" required minlength="30" maxlength="600" placeholder="What do you offer, what happens in a session, and what are the limits of your role?"></textarea></label><p class="small muted">Choose only permitted services. No medical claims, client stories or substance-administration offers.</p><label class="check"><input type="checkbox" required>I am at least 18 and legally able to enter an agreement.</label><label class="check"><input type="checkbox" required>I have reviewed the draft listing agreement and service rules for this test.</label><label class="check"><input type="checkbox" required>My description is accurate. I will not use a listing or its contacts to offer prohibited services.</label><label class="check"><input type="checkbox" required>I understand administrative approval is not verification of qualifications, insurance or safety.</label><p id="form-error" role="alert"></p><button class="primary">Preview application</button></form>`);
  $('#signup-form').onsubmit = event => {
    event.preventDefault(); const data = new FormData(event.target); const selected=data.getAll('category');
    if (!selected.length) { $('#form-error').textContent='Select at least one service.'; return; }
    $('#dialog-body').innerHTML=`<p class="notice">Application preview — not submitted</p><h3>${escapeHtml(data.get('name'))}</h3><p>${escapeHtml(data.get('location'))}</p><div class="chips">${selected.map(i=>`<span class="chip">${categories[Number(i)][0]}</span>`).join('')}</div><p>${escapeHtml(data.get('bio'))}</p><p class="small muted">A live application would require administrative approval before publication. This test creates no account or public profile.</p><button class="primary" id="simulate-application">Simulate submission</button>`;
    $('#simulate-application').onclick=()=>{$('#dialog-body').innerHTML='<div class="success"><h3>Application simulation complete</h3><p>No account or profile was created. Nothing was transmitted or stored. Close this dialog to continue exploring.</p></div>';};
  };
};
render();
