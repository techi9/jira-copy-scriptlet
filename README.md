# Jira Copy

A Tampermonkey userscript that adds a copy button to Jira issue cards and pages. Click to copy the issue key and summary — works with Slack smart links.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Open `userscript.user.js` from this repo
3. Tampermonkey will prompt you to install — click **Install**

Also can be installed via Adguard desktop.

## What it does

Adds a small copy icon next to issue keys on:

- Agile board cards (hover to reveal)
- Version/project page lists
- Single issue pages
- Detail panel

Clicking copies `AG-12345 Summary text` with rich HTML so Slack and Notion renders it as a smart link.
