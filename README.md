# AdityaType

AdityaType is a browser-based typing test and practice app with a soft neumorphic interface. It tracks speed and accuracy in real time while helping you turn recurring mistakes into focused practice.

## Features

- Time tests from 15 seconds to 15 minutes
- Word-count tests with 10, 25, 50, or 100 words
- Quote and code practice passages
- Custom text practice
- Mistake Vault for words you frequently mistype
- WPM, raw WPM, accuracy, elapsed time, and error tracking
- Session timeline chart and local test history
- Mechanical keyboard audio profiles: thocky, clicky, tactile, typewriter, and silent
- Interactive on-screen keyboard and restart shortcuts
- Shareable score summary through the browser Share API or clipboard fallback

## Run Locally

This is a static HTML, CSS, and JavaScript project. No build tools or package installation are required.

1. Clone the repository.
2. Start a local web server from the project directory. For example, with Python:

   ```bash
   python -m http.server 8000
   ```

3. Open [http://localhost:8000](http://localhost:8000) in a modern browser.

Opening `index.html` directly may work, but a local server is recommended for consistent browser behavior.

## Usage

1. Choose a test mode and its duration or word count.
2. Click the typing arena or press a key to begin.
3. Type the passage shown on screen.
4. Review your result, timeline, and accuracy when the test ends.
5. Use History to review saved sessions or Mistake Vault to practice recurring errors.

Press `Esc` or `Tab`, then `Enter` to restart. The restart button is also available below the typing arena.

## Project Structure

```text
.
├── index.html              # Application markup
├── styles.css              # Soft UI visual design and responsive layout
└── js/
    ├── app.js              # Test state, input handling, modes, and UI events
    ├── analytics.js        # History and performance charting
    ├── audio.js            # Web Audio keyboard sound profiles
    ├── mistakeVault.js     # Mistake tracking and targeted practice passages
    └── data/textCorpus.js  # Word, quote, and code passage data
```

## Data and Privacy

Test history and Mistake Vault entries are stored in your browser's `localStorage`. Nothing is sent to an application server. Clearing browser storage, using private browsing, or clearing the in-app History or Vault removes this data.

Font Awesome is loaded from its public CDN in `index.html`, so an internet connection is needed for those icons unless the stylesheet is replaced with a local copy.

## Browser Support

Use a current version of Chrome, Edge, Firefox, or Safari. Audio feedback requires Web Audio API support and may begin only after the first user interaction.

## License

No license has been selected for this project yet. Add a license before distributing or accepting external contributions.
