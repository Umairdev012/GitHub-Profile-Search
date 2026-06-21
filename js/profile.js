function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatNumber(value) {
  const number = Math.abs(Number(value) || 0);
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(number);
}

function calculateProfileCompleteness(userData) {
  const fields = [
    userData.avatar_url,
    userData.bio,
    userData.location,
    userData.company,
    userData.blog,
    userData.email,
    userData.twitter_username,
  ];
  const filled = fields.filter(value => Boolean(value)).length;
  return Math.round((filled / fields.length) * 100);
}

function renderCompleteness(score) {
  const progress = Math.min(Math.max(score, 0), 100);
  const chart = $('#completeness-chart');
  chart.css('background', `conic-gradient(var(--accent) 0deg ${progress * 3.6}deg, var(--surface-strong) ${progress * 3.6}deg 360deg)`);
  $('#completeness-value').text(`${progress}%`);
}

function renderProfile(userData) {
  const joinedDate = formatDate(userData.created_at);
  const blogLink = userData.blog ? `<a href="${userData.blog.startsWith('http') ? userData.blog : `https://${userData.blog}`}" target="_blank" rel="noopener noreferrer">${userData.blog}</a>` : 'Not available';
  const twitter = userData.twitter_username ? `<a href="https://twitter.com/${userData.twitter_username}" target="_blank" rel="noopener noreferrer">@${userData.twitter_username}</a>` : 'Not available';
  const company = userData.company ? userData.company : 'Not available';
  const location = userData.location ? userData.location : 'Not available';
  const bioText = userData.bio ? userData.bio : 'No bio provided.';

  const html = `
    <img src="${userData.avatar_url}" alt="${userData.login} avatar" class="profile-avatar" />
    <div>
      <h2 class="profile-name">${userData.name || userData.login}</h2>
      <p class="profile-username"><a href="${userData.html_url}" target="_blank" rel="noopener noreferrer">@${userData.login}</a></p>
      <p class="profile-bio">${bioText}</p>
      <p class="profile-meta">Joined ${joinedDate}</p>
    </div>
    <div class="info-pills">
      <span class="info-pill"><i class="fa-solid fa-location-dot"></i> ${location}</span>
      <span class="info-pill"><i class="fa-solid fa-building"></i> ${company}</span>
      <span class="info-pill"><i class="fa-solid fa-link"></i> ${blogLink}</span>
      <span class="info-pill"><i class="fa-brands fa-twitter"></i> ${twitter}</span>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><strong id="repo-count">0</strong><span>Public Repos</span></div>
      <div class="stat-card"><strong id="followers-count-card">0</strong><span>Followers</span></div>
      <div class="stat-card"><strong id="following-count-card">0</strong><span>Following</span></div>
    </div>
    <div class="action-buttons">
      <a href="${userData.html_url}" target="_blank" rel="noopener noreferrer" class="btn">View on GitHub</a>
      <button class="btn btn-secondary" type="button" id="copy-profile-url">Copy Profile URL</button>
    </div>
  `;
  $('#profile-card').html(html);
  $('#copy-profile-url').on('click', () => copyProfileURL(userData.html_url));
}

function renderStats(userData) {
  animateCount('#repo-count', userData.public_repos);
  animateCount('#followers-count-card', userData.followers);
  animateCount('#following-count-card', userData.following);
}

function animateCount(selector, value) {
  const element = $(selector);
  const endValue = Number(value) || 0;
  let current = 0;
  const duration = 1000;
  const stepTime = Math.max(Math.floor(duration / (endValue || 1)), 20);
  const timer = setInterval(() => {
    current += Math.ceil(endValue / (duration / stepTime));
    if (current >= endValue) {
      current = endValue;
      clearInterval(timer);
    }
    element.text(formatNumber(current));
  }, stepTime);
}

function copyProfileURL(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('Profile URL copied!', 'success');
  }).catch(() => {
    showToast('Unable to copy URL', 'error');
  });
}
