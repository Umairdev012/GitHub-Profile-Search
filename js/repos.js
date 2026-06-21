const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#fa7343',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  React: '#61dafb',
  JSX: '#61dafb',
  Dart: '#00B4AB',
  Unknown: '#8b949e',
};

function getLanguageColor(lang) {
  return LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.Unknown;
}

function formatRelativeTime(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) {
    const diffHours = Math.floor(diffMs / 3600000);
    return diffHours <= 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffDays < 30) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  }
  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
}

function renderRepos(reposArray) {
  const list = $('#repo-grid');
  list.empty();
  if (!reposArray || !reposArray.length) {
    list.html('<p>No repositories available.</p>');
    $('#load-more-button').addClass('hidden');
    return;
  }
  reposArray.forEach(repo => {
    const description = repo.description ? repo.description : 'No description provided';
    const language = repo.language || 'Unknown';
    const topics = repo.topics ? repo.topics.slice(0, 3) : [];
    const card = $(
      `<article class="repo-card">
        <h4><a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a></h4>
        <p>${description}</p>
        <div class="repo-meta">
          <span class="language-dot"><span></span>${language}</span>
          <span>⭐ ${formatNumber(repo.stargazers_count)}</span>
          <span>🍴 ${formatNumber(repo.forks_count)}</span>
          <span>🕒 ${formatRelativeTime(repo.updated_at)}</span>
        </div>
        <div class="repo-tags">${topics.map(topic => `<span class="tag-pill">${topic}</span>`).join('')}</div>
      </article>`
    );
    card.find('.language-dot span').css('background', getLanguageColor(language));
    list.append(card);
  });
  $('#load-more-button').toggleClass('hidden', appState.lastRepoFetchCount < 12);
}

function sortRepos(by, reposArray) {
  if (!Array.isArray(reposArray)) {
    return;
  }
  const sorted = [...reposArray];
  if (by === 'stars') {
    sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
  } else if (by === 'forks') {
    sorted.sort((a, b) => b.forks_count - a.forks_count);
  } else if (by === 'updated') {
    sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  } else if (by === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  renderRepos(sorted);
}

function calculateLanguageStats(repos) {
  const languageMap = {};
  repos.forEach(repo => {
    const language = repo.language || 'Unknown';
    languageMap[language] = (languageMap[language] || 0) + 1;
  });
  const total = repos.length || 1;
  return Object.entries(languageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([language, count]) => ({
      language,
      percentage: Math.round((count / total) * 100),
    }));
}

function renderLanguageChart(stats) {
  const container = $('#language-chart');
  container.empty();
  if (!stats.length) {
    container.html('<p>No language data available.</p>');
    return;
  }
  stats.forEach(stat => {
    const item = $(
      `<div class="language-item">
        <div class="language-label"><span>${stat.language}</span><span>${stat.percentage}%</span></div>
        <div class="language-bar"><div class="language-bar-fill"></div></div>
      </div>`
    );
    item.find('.language-bar-fill').css({
      width: `${stat.percentage}%`,
      background: getLanguageColor(stat.language),
    });
    container.append(item);
  });
}

function renderRepoStats(repos) {
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
  const average = repos.length ? Math.round(totalStars / repos.length) : 0;
  const oldest = repos.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
  const newest = repos.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const html = `
    <h4>Activity summary</h4>
    <p><strong>Total stars:</strong> ${formatNumber(totalStars)}</p>
    <p><strong>Total forks:</strong> ${formatNumber(totalForks)}</p>
    <p><strong>Average stars per repo:</strong> ${formatNumber(average)}</p>
    <p><strong>Oldest repo:</strong> ${oldest ? oldest.name : 'N/A'}</p>
    <p><strong>Newest repo:</strong> ${newest ? newest.name : 'N/A'}</p>
  `;
  $('#activity-summary').html(html);
}

function loadMoreRepos(username) {
  if (appState.isLoading) {
    return;
  }
  appState.isLoading = true;
  appState.reposPage += 1;
  showLoading();
  fetchRepos(username, appState.reposPage)
    .done(repos => {
      appState.currentRepos = appState.currentRepos.concat(repos);
      appState.lastRepoFetchCount = repos.length;
      renderRepos(appState.currentRepos);
      renderLanguageChart(calculateLanguageStats(appState.currentRepos));
      renderRepoStats(appState.currentRepos);
    })
    .fail(() => {
      showToast('Unable to load more repositories', 'error');
    })
    .always(() => {
      appState.isLoading = false;
      hideLoading();
      updateRateLimit();
    });
}
