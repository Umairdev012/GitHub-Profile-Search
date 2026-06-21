# DevFinder

DevFinder is a production-ready GitHub profile search web app built with HTML, CSS, and JavaScript. It uses the GitHub REST API to display user profiles, repositories, followers, following, and visual stats. Compare two developers side by side, toggle between dark and light themes, and explore search history saved locally.

## Features

- Search GitHub users by username
- View profile information, repositories, followers, following, and stats
- Sort repositories by stars, forks, update date, or name
- Load more repositories
- Language usage chart and activity summary
- Search history with suggestion cards
- Compare two GitHub profiles
- Dark/Light theme toggling with persistent preference
- Error states for user not found, rate limiting, and network issues
- Responsive layout for desktop and mobile
- Toast notifications and animated UI interactions

## Project Structure

```
github-profile-search/
├── index.html
├── css/
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── api.js
│   ├── profile.js
│   ├── repos.js
│   └── ui.js
└── README.md
```

## Usage

1. Open `index.html` in your browser.
2. Enter a GitHub username and click `Search`.
3. Explore profile details, repositories, followers, following, and stats.
4. Use the Compare button to compare two profiles side by side.

## Notes

- The app uses jQuery for AJAX requests.
- GitHub API rate limiting is 60 requests per hour for unauthenticated users.
- Search history, theme, and last searched user are stored in `localStorage`.
