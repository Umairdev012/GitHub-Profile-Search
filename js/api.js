const API_BASE = 'https://api.github.com';

function handleAjaxError(jqXHR) {
  const error = new $.Deferred();
  error.reject(jqXHR);
  return error.promise();
}

function fetchUser(username) {
  return $.ajax({
    url: `${API_BASE}/users/${encodeURIComponent(username)}`,
    method: 'GET',
    dataType: 'json',
    headers: {
      Accept: 'application/vnd.github+json',
    },
  }).fail(handleAjaxError);
}

function fetchRepos(username, page = 1, perPage = 12) {
  return $.ajax({
    url: `${API_BASE}/users/${encodeURIComponent(username)}/repos`,
    method: 'GET',
    dataType: 'json',
    data: {
      sort: 'stars',
      per_page: perPage,
      page,
    },
    headers: {
      Accept: 'application/vnd.github+json',
    },
  }).fail(handleAjaxError);
}

function fetchFollowers(username) {
  return $.ajax({
    url: `${API_BASE}/users/${encodeURIComponent(username)}/followers`,
    method: 'GET',
    dataType: 'json',
    data: {
      per_page: 8,
    },
    headers: {
      Accept: 'application/vnd.github+json',
    },
  }).fail(handleAjaxError);
}

function fetchFollowing(username) {
  return $.ajax({
    url: `${API_BASE}/users/${encodeURIComponent(username)}/following`,
    method: 'GET',
    dataType: 'json',
    data: {
      per_page: 8,
    },
    headers: {
      Accept: 'application/vnd.github+json',
    },
  }).fail(handleAjaxError);
}

function getRateLimit() {
  return $.ajax({
    url: `${API_BASE}/rate_limit`,
    method: 'GET',
    dataType: 'json',
    headers: {
      Accept: 'application/vnd.github+json',
    },
  }).fail(handleAjaxError);
}
