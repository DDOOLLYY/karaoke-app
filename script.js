// Spotify Web Playback SDK
let player;

// Initialize Spotify Player
window.onSpotifyWebPlaybackSDKReady = () => {
  player = new Spotify.Player({
    name: 'Karaoke App',
    getOAuthToken: (cb) => {
      // You'll get this token from Spotify Developer Dashboard
      // For now, we'll use a placeholder
      cb('YOUR_ACCESS_TOKEN_HERE');
    },
    volume: 0.5
  });

  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
  });

  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  player.addListener('player_state_changed', (state) => {
    if (!state) return;

    const currentTime = state.position / 1000; // seconds
    updateLyrics(currentTime);
  });

  player.connect();
};

// Search for a song
async function searchSong() {
  const query = document.getElementById('songInput').value.trim();
  if (!query) return alert('Please enter a song name!');

  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN_HERE'
    }
  });

  const data = await response.json();
  const track = data.tracks.items[0];

  if (!track) return alert('Song not found!');

  // Play the track
  const trackUri = track.uri;
  player.play({ uris: [trackUri] });

  // Load lyrics (we'll use a placeholder for now)
  loadLyrics(track.name, track.artists[0].name);
}

// Load lyrics (for demo, we'll use a fake LRC)
function loadLyrics(songTitle, artist) {
  const lyrics = {
    "Bohemian Rhapsody": [
      "[00:00.00]Is this the real life?",
      "[00:05.00]Is this just fantasy?",
      "[00:10.00]Caught in a landslide",
      "[00:15.00]No escape from reality",
      "[00:20.00]Open your eyes",
      "[00:25.00]Look up to the skies and see"
    ],
    "Imagine": [
      "[00:00.00]Imagine there's no heaven",
      "[00:05.00]It's easy if you try",
      "[00:10.00]No hell below us",
      "[00:15.00]Above us only sky"
    ]
  };

  const key = `${songTitle} ${artist}`.toLowerCase();
  const lines = lyrics[songTitle] || lyrics["Imagine"] || ["[00:00.00]Lyrics not available"];

  document.getElementById('lyrics').innerHTML = lines.map(line => `<div>${line.replace(/$.*?$/, '')}</div>`).join('');

  // Store lines for syncing
  window.lyricsLines = lines.map(line => {
    const timeMatch = line.match(/$(\d{2}):(\d{2})\.(\d{2})$/);
    const minutes = parseInt(timeMatch[1]);
    const seconds = parseInt(timeMatch[2]);
    const millis = parseInt(timeMatch[3]);
    const totalSeconds = minutes * 60 + seconds + millis / 100;
    return { time: totalSeconds, text: line.replace(/$.*?$/, '') };
  });
}

// Update which line is currently playing
function updateLyrics(currentTime) {
  const lines = window.lyricsLines || [];
  const currentLine = lines.find(line => line.time > currentTime);

  const lyricsDiv = document.getElementById('lyrics');
  const allLines = lyricsDiv.querySelectorAll('div');

  allLines.forEach((line, i) => {
    line.classList.remove('current');
    if (i === (currentLine ? lines.indexOf(currentLine) : 0)) {
      line.classList.add('current');
    }
  });
}
