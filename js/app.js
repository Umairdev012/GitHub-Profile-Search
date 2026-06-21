const appState = {
  isLoading: false,
  history: [],
  suggestions: [],
  currentUser: null,
  reposPage: 1,
  compareMode: false,
  compareData: {
    left: null,
    right: null,
  },
  debounceTimer: null,
};

const STORAGE_KEYS = {
  theme: 'devfinder_theme',
  history: 'devfinder_history',
  lastUser: 'devfinder_last_user',
};

const selectors = {
  body: $('body'),
  searchInput: $('#search-input'),
  searchForm: $('#search-form'),
  searchClear: $('#search-clear'),
  suggestionsPanel: $('#search-suggestions'),
  historyPanel: $('#history-panel'),
  historyCards: $('#history-cards'),
  clearHistory: $('#clear-history'),
  validationMessage: $('#validation-message'),
  loadingSpinner: $('#loading-spinner'),
  profileSection: $('#profile-section'),
  compareSection: $('#compare-section'),
  compareToggle: $('#compare-toggle'),
  exitCompare: $('#exit-compare'),
  compareUser1: $('#compare-user-1'),
  compareUser2: $('#compare-user-2'),
  compareSearch1: $('#compare-search-1'),
  compareSearch2: $('#compare-search-2'),
  compareCard1: $('#compare-card-1'),
  compareCard2: $('#compare-card-2'),
  compareTableWrap: $('#comparison-table-wrap'),
  compareTableBody: $('#comparison-table tbody'),
  repoSort: $('#repo-sort'),
  themeToggle: $('#theme-toggle'),
  navRateLimit: $('#nav-rate-limit'),
  footerLimit: $('#footer-limit'),
  errorState: $('#error-state'),
};

function initApp() {
  bindEvents();
  bindImageFallbacks();
  loadTheme();
  loadHistory();
  renderHistory();
  updateRateLimit();
  const lastUser = localStorage.getItem(STORAGE_KEYS.lastUser);
  if (lastUser) {
    performSearch(lastUser);
  }
}

function bindImageFallbacks() {
  window.addEventListener('error', event => {
    const target = event.target;
    if (target && target.tagName === 'IMG') {
      const image = $(target);
      if (!image.data('fallbacked')) {
        image.data('fallbacked', true);
        image.attr('src', 'https://via.placeholder.com/150');
      }
    }
  }, true);
}

function bindEvents() {
  selectors.themeToggle.on('click', toggleTheme);
  selectors.searchForm.on('submit', event => {
    event.preventDefault();
    const value = selectors.searchInput.val().trim();
    validateAndSearch(value);
  });
  selectors.searchInput.on('input', handleSearchInput);
  selectors.searchClear.on('click', clearSearchInput);
  selectors.clearHistory.on('click', clearHistory);
  selectors.suggestionsPanel.on('click', '.suggestion-item', event => {
    const username = $(event.currentTarget).data('username');
    selectors.searchInput.val(username);
    performSearch(username);
  });
  selectors.historyCards.on('click', '.history-item', event => {
    const username = $(event.currentTarget).data('username');
    performSearch(username);
  });
  selectors.historyCards.on('click', '.remove-history', event => {
    event.stopPropagation();
    const username = $(event.currentTarget).closest('.history-item').data('username');
    removeHistoryItem(username);
  });
  selectors.compareToggle.on('click', enterCompareMode);
  selectors.exitCompare.on('click', exitCompareMode);
  selectors.compareSearch1.on('click', () => searchCompareUser('left'));
  selectors.compareSearch2.on('click', () => searchCompareUser('right'));
  $('#load-more-button').on('click', () => {
    if (appState.currentUser) {
      loadMoreRepos(appState.currentUser.login);
    }
  });
  $('.tabs-bar').on('click', '.tab-button', event => {
    const tabName = $(event.currentTarget).data('tab');
    $('.tab-button').removeClass('active');
    $(event.currentTarget).addClass('active');
    $('.tab-content').removeClass('active');
    $(`#tab-${tabName}`).addClass('active');
  });
  selectors.repoSort.on('change', () => {
    const sortBy = selectors.repoSort.val();
    sortRepos(sortBy, appState.currentRepos);
  });
  $('body').on('keydown', event => {
    if (event.key === '/') {
      event.preventDefault();
      selectors.searchInput.focus();
    }
  });
}

function handleSearchInput() {
  const value = selectors.searchInput.val();
  selectors.searchClear.toggleClass('visible', value.length > 0);
  if (appState.debounceTimer) {
    clearTimeout(appState.debounceTimer);
  }
  appState.debounceTimer = setTimeout(() => {
    if (value.trim()) {
      renderSuggestions();
    } else {
      selectors.suggestionsPanel.addClass('hidden');
    }
  }, 500);
}

function clearSearchInput() {
  selectors.searchInput.val('');
  selectors.searchClear.removeClass('visible');
  selectors.suggestionsPanel.addClass('hidden');
  selectors.validationMessage.addClass('hidden');
}

function validateAndSearch(username) {
  selectors.validationMessage.addClass('hidden');
  if (!username) {
    selectors.validationMessage.text('Please enter a username').removeClass('hidden');
    selectors.searchInput.addClass('input-error');
    return;
  }
  selectors.searchInput.removeClass('input-error');
  performSearch(username);
}

function performSearch(username) {
  if (appState.isLoading) {
    return;
  }
  appState.isLoading = true;
  selectors.validationMessage.addClass('hidden');
  showLoading();
  hideError();
  selectors.profileSection.removeClass('hidden');

  const cleanUsername = username.trim();
  if (!cleanUsername) {
    appState.isLoading = false;
    hideLoading();
    return;
  }

  const userPromise = fetchUser(cleanUsername);
  const repoPromise = fetchRepos(cleanUsername, 1);
  const followersPromise = fetchFollowers(cleanUsername);
  const followingPromise = fetchFollowing(cleanUsername);

  $.when(userPromise, repoPromise, followersPromise, followingPromise)
    .done((userData, repoData, followerData, followingData) => {
      const user = userData[0] || userData;
      const repos = repoData[0] || repoData;
      const followers = followerData[0] || followerData;
      const following = followingData[0] || followingData;

      appState.currentUser = user;
      appState.currentRepos = repos;
      appState.reposPage = 1;
      appState.lastRepoFetchCount = repos.length;
      renderProfile(user);
      renderStats(user);
      renderRepos(repos);
      renderFollowers(followers);
      renderFollowing(following);
      renderLanguageChart(calculateLanguageStats(repos));
      renderRepoStats(repos);
      renderCompleteness(calculateProfileCompleteness(user));
      selectors.searchInput.val(cleanUsername);
      localStorage.setItem(STORAGE_KEYS.lastUser, cleanUsername);
      saveSearchHistory(cleanUsername, user.avatar_url);
      showToast('Username added to history', 'info');
    })
    .fail((jqXHR, textStatus) => {
      if (jqXHR.status === 404) {
        showError('not-found');
      } else if (jqXHR.status === 403) {
        const reset = parseInt(jqXHR.getResponseHeader('x-ratelimit-reset') || '0', 10) * 1000;
        showError('rate-limit', reset);
      } else {
        showError('network');
      }
    })
    .always(() => {
      appState.isLoading = false;
      hideLoading();
      updateRateLimit();
    });
}

function enterCompareMode() {
  appState.compareMode = true;
  selectors.compareSection.removeClass('hidden');
  selectors.profileSection.addClass('hidden');
  selectors.errorState.addClass('hidden');
}

function exitCompareMode() {
  appState.compareMode = false;
  selectors.compareSection.addClass('hidden');
  selectors.profileSection.removeClass('hidden');
  selectors.compareTableWrap.addClass('hidden');
  selectors.compareCard1.empty();
  selectors.compareCard2.empty();
  selectors.compareUser1.val('');
  selectors.compareUser2.val('');
  appState.compareData.left = null;
  appState.compareData.right = null;
}

function searchCompareUser(side) {
  const username = side === 'left' ? selectors.compareUser1.val().trim() : selectors.compareUser2.val().trim();
  if (!username) {
    showToast('Please enter a username for compare', 'warning');
    return;
  }
  const card = side === 'left' ? selectors.compareCard1 : selectors.compareCard2;
  card.html('<p>Loading...</p>');
  $.when(fetchUser(username), fetchRepos(username, 1, 100))
    .done((userData, repoData) => {
      const user = userData[0] || userData;
      const repos = repoData[0] || repoData;
      appState.compareData[side] = { ...user, repos };
      renderCompareUser(card, appState.compareData[side]);
      if (appState.compareData.left && appState.compareData.right) {
        renderComparison();
      }
    })
    .fail((jqXHR) => {
      card.empty();
      if (jqXHR.status === 404) {
        showToast('Compare user not found', 'error');
      } else if (jqXHR.status === 403) {
        showToast('Rate limit reached during compare', 'error');
      } else {
        showToast('Connection failed during compare', 'error');
      }
    });
}

function renderCompareUser(container, user) {
  const repoCount = formatNumber(user.public_repos);
  const totalStars = formatNumber((user.repos || []).reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0));
  const html = `
    <div class="profile-card compare-profile-card">
      <img src="${user.avatar_url}" alt="${user.login} avatar" class="profile-avatar compare-avatar" />
      <h4 class="profile-name">${user.name || user.login}</h4>
      <p class="profile-username">@${user.login}</p>
      <p class="profile-bio">${user.bio || 'No bio available.'}</p>
      <p class="profile-meta">Repos: ${repoCount} · Followers: ${formatNumber(user.followers)} · Following: ${formatNumber(user.following)}</p>
      <p class="profile-meta">Stars: ${totalStars}</p>
    </div>
  `;
  container.html(html);
}

function renderComparison() {
  const user1 = appState.compareData.left;
  const user2 = appState.compareData.right;
  if (!user1 || !user2) {
    return;
  }
  const totalStars1 = (user1.repos || []).reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const totalStars2 = (user2.repos || []).reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const rows = [
    ['Repos', user1.public_repos, user2.public_repos],
    ['Followers', user1.followers, user2.followers],
    ['Following', user1.following, user2.following],
    ['Total Stars', totalStars1, totalStars2],
    ['Joined', new Date(user1.created_at).getFullYear(), new Date(user2.created_at).getFullYear()],
  ];
  selectors.compareTableBody.empty();
  rows.forEach(([metric, value1, value2]) => {
    const winner = determineWinner(value1, value2, metric);
    const row = $('<tr>');
    row.append(`<td>${metric}</td>`);
    row.append(`<td class="${winner === 'left' ? 'highlight-win' : ''}">${value1}</td>`);
    row.append(`<td class="${winner === 'right' ? 'highlight-win' : ''}">${value2}</td>`);
    selectors.compareTableBody.append(row);
  });
  selectors.compareTableWrap.removeClass('hidden');
}

function determineWinner(value1, value2, metric) {
  if (metric === 'Joined') {
    return value1 < value2 ? 'left' : value2 < value1 ? 'right' : '';
  }
  if (value1 > value2) {
    return 'left';
  }
  if (value2 > value1) {
    return 'right';
  }
  return '';
}

function saveSearchHistory(username, avatar) {
  const existing = appState.history.find(item => item.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    appState.history = appState.history.filter(item => item.username.toLowerCase() !== username.toLowerCase());
  }
  appState.history.unshift({ username, avatar });
  appState.history = appState.history.slice(0, 10);
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(appState.history));
  renderHistory();
}

function removeHistoryItem(username) {
  appState.history = appState.history.filter(item => item.username !== username);
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(appState.history));
  renderHistory();
}

function clearHistory() {
  appState.history = [];
  localStorage.removeItem(STORAGE_KEYS.history);
  renderHistory();
  showToast('History cleared', 'warning');
}

function loadHistory() {
  const stored = localStorage.getItem(STORAGE_KEYS.history);
  if (stored) {
    try {
      appState.history = JSON.parse(stored) || [];
    } catch (error) {
      appState.history = [];
    }
  }
}

function renderHistory() {
  selectors.historyCards.empty();
  if (!appState.history.length) {
    selectors.historyPanel.addClass('hidden');
    return;
  }
  selectors.historyPanel.removeClass('hidden');
  selectors.historyCards.empty();
  appState.history.forEach(item => {
    const card = $(
      `<div class="history-card history-item" data-username="${item.username}">
        <div class="history-avatar">
          <img src="${item.avatar || 'https://via.placeholder.com/40'}" alt="${item.username} avatar" />
          <span>${item.username}</span>
        </div>
        <button class="remove-history" type="button" aria-label="Remove history item"><i class="fa-solid fa-xmark"></i></button>
      </div>`
    );
    selectors.historyCards.append(card);
  });
  renderSuggestions();
}

function renderSuggestions() {
  if (!appState.history.length) {
    selectors.suggestionsPanel.addClass('hidden');
    return;
  }
  selectors.suggestionsPanel.removeClass('hidden');
  selectors.suggestionsPanel.empty();
  const suggestions = appState.history.slice(0, 5);
  suggestions.forEach(item => {
    const suggestion = $(
      `<div class="suggestion-item" data-username="${item.username}">
        <span><i class="fa-solid fa-clock-rotate-left"></i> ${item.username}</span>
        <span><i class="fa-solid fa-arrow-right-long"></i></span>
      </div>`
    );
    selectors.suggestionsPanel.append(suggestion);
  });
}

function loadTheme() {
  const theme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark-mode';
  selectors.body.removeClass('light-mode dark-mode').addClass(theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const nextTheme = selectors.body.hasClass('dark-mode') ? 'light-mode' : 'dark-mode';
  selectors.body.removeClass('dark-mode light-mode').addClass(nextTheme);
  localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
  updateThemeIcon(nextTheme);
}

function updateThemeIcon(theme) {
  const icon = theme === 'dark-mode' ? 'fa-moon' : 'fa-sun';
  selectors.themeToggle.find('i').attr('class', `fa-solid ${icon}`);
}

function updateRateLimit() {
  getRateLimit().done(data => {
    const remaining = data.resources && data.resources.core ? data.resources.core.remaining : 60;
    selectors.navRateLimit.text(remaining);
    selectors.footerLimit.text(remaining);
    if (remaining <= 5) {
      showToast(`Rate limit warning: ${remaining} requests remaining`, 'warning');
    }
  });
}

function showLoading() {
  selectors.loadingSpinner.removeClass('hidden');
  selectors.searchButtonDisabled = true;
  $('#search-button').prop('disabled', true);
}

function hideLoading() {
  selectors.loadingSpinner.addClass('hidden');
  $('#search-button').prop('disabled', false);
}

function showError(type, resetTime = 0) {
  let title = 'Oops! Something went wrong';
  let message = 'Please try again later.';
  if (type === 'not-found') {
    title = '<i class="fa-solid fa-face-sad-tear"></i> Oops! User not found';
    message = 'Check the username and try again';
  } else if (type === 'rate-limit') {
    const minutes = resetTime ? Math.max(0, Math.ceil((resetTime - Date.now()) / 60000)) : 'a few';
    title = '<i class="fa-solid fa-triangle-exclamation"></i> API rate limit reached';
    message = `Resets in ${minutes} minutes. <a href="https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting" target="_blank" rel="noopener noreferrer">Learn more</a>`;
  } else if (type === 'network') {
    title = '<i class="fa-solid fa-wifi"></i> Connection failed';
    message = 'Check your internet connection';
  }
  selectors.errorState.html(`<h3>${title}</h3><p>${message}</p>${type === 'not-found' ? '<p>Try: torvalds, gaearon, sindresorhus</p>' : ''}`);
  selectors.errorState.removeClass('hidden');
  selectors.profileSection.addClass('hidden');
}

function hideError() {
  selectors.errorState.addClass('hidden');
}

function showToast(message, type = 'info') {
  const toast = $(
    `<div class="toast ${type}">
      <span>${message}</span>
      <button type="button" aria-label="Close toast"><i class="fa-solid fa-xmark"></i></button>
    </div>`
  );
  const container = $('#toast-container');
  if (container.children().length >= 3) {
    container.children().first().remove();
  }
  container.append(toast);
  toast.find('button').on('click', () => toast.remove());
  setTimeout(() => toast.fadeOut(200, () => toast.remove()), 3000);
}

$(document).ready(initApp);
