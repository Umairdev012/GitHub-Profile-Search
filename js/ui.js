function showProfileSection() {
  $('#profile-section').removeClass('hidden');
}

function hideProfileSection() {
  $('#profile-section').addClass('hidden');
}

function renderFollowers(data) {
  const grid = $('#followers-grid');
  const count = $('#followers-count');
  grid.empty();
  count.text(`${data.length} Followers`);
  if (!data.length) {
    grid.html('<p>No followers found.</p>');
    return;
  }
  data.forEach(item => {
    const card = $(
      `<div class="follow-card" data-username="${item.login}">
        <img src="${item.avatar_url}" alt="${item.login} avatar" />
        <span>@${item.login}</span>
      </div>`
    );
    card.on('click', () => performSearch(item.login));
    grid.append(card);
  });
}

function renderFollowing(data) {
  const grid = $('#following-grid');
  const count = $('#following-count');
  grid.empty();
  count.text(`${data.length} Following`);
  if (!data.length) {
    grid.html('<p>No following users found.</p>');
    return;
  }
  data.forEach(item => {
    const card = $(
      `<div class="follow-card" data-username="${item.login}">
        <img src="${item.avatar_url}" alt="${item.login} avatar" />
        <span>@${item.login}</span>
      </div>`
    );
    card.on('click', () => performSearch(item.login));
    grid.append(card);
  });
}

function switchTab(tabName) {
  $('.tab-button').removeClass('active');
  $(`.tab-button[data-tab="${tabName}"]`).addClass('active');
  $('.tab-content').removeClass('active');
  $(`#tab-${tabName}`).addClass('active');
}

function initCompareMode() {
  $('#compare-section').removeClass('hidden');
}

function highlightWinner(tableBody) {
  $(tableBody).find('tr').each((_, row) => {
    const cells = $(row).find('td');
    const left = parseFloat(cells.eq(1).text().replace(/[^0-9]/g, '')) || 0;
    const right = parseFloat(cells.eq(2).text().replace(/[^0-9]/g, '')) || 0;
    cells.removeClass('highlight-win');
    if (left > right) {
      cells.eq(1).addClass('highlight-win');
    } else if (right > left) {
      cells.eq(2).addClass('highlight-win');
    }
  });
}
