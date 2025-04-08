document.addEventListener('DOMContentLoaded', function() {
    // Music player functionality
    const progressBar = document.querySelector('.progress-bar');
    const currentTimeElement = document.querySelector('.player-bar span:first-child');
    const durationElement = document.querySelector('.player-bar span:last-child');
    const playPauseBtn = document.querySelector('.player-controle img[alt="Play/Pause"]');
    
    // Mock song data
    const currentSong = {
      title: "Blinding Lights",
      artist: "The Weeknd",
      duration: 200, // in seconds
      currentTime: 0,
      isPlaying: false,
      albumCover: "img/card1img.jpeg"
    };
    
    // Update player with current song info
    const albumCover = document.createElement('img');
    albumCover.src = currentSong.albumCover;
    albumCover.alt = "Album Cover";
    albumCover.style.height = "56px";
    albumCover.style.width = "56px";
    albumCover.style.borderRadius = "4px";
    
    const songInfo = document.createElement('div');
    songInfo.innerHTML = `
      <h3 style="font-size: 0.875rem; font-weight: 600;">${currentSong.title}</h3>
      <p style="font-size: 0.75rem; opacity: 0.7;">${currentSong.artist}</p>
    `;
    
    const likeBtn = document.createElement('i');
    likeBtn.className = "fa-regular fa-heart";
    likeBtn.style.marginLeft = "1rem";
    likeBtn.style.cursor = "pointer";
    likeBtn.style.opacity = "0.7";
    likeBtn.addEventListener('mouseenter', () => likeBtn.style.opacity = "1");
    likeBtn.addEventListener('mouseleave', () => likeBtn.style.opacity = "0.7");
    likeBtn.addEventListener('click', () => {
      likeBtn.classList.toggle('fa-regular');
      likeBtn.classList.toggle('fa-solid');
      likeBtn.style.color = likeBtn.classList.contains('fa-solid') ? "#1DB954" : "";
    });
    
    const albumSection = document.querySelector('.album');
    albumSection.appendChild(albumCover);
    albumSection.appendChild(songInfo);
    albumSection.appendChild(likeBtn);
    
    // Format time from seconds to MM:SS
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    // Update progress bar and time display
    function updatePlayer() {
      progressBar.value = (currentSong.currentTime / currentSong.duration) * 100;
      currentTimeElement.textContent = formatTime(currentSong.currentTime);
      durationElement.textContent = formatTime(currentSong.duration);
    }
    
    // Initialize player
    updatePlayer();
    
    // Play/pause functionality
    playPauseBtn.src = currentSong.isPlaying ? "img/player_icon3.png" : "img/player_icon2.png";
    playPauseBtn.alt = currentSong.isPlaying ? "Pause" : "Play";
    
    playPauseBtn.addEventListener('click', function() {
      currentSong.isPlaying = !currentSong.isPlaying;
      this.src = currentSong.isPlaying ? "img/player_icon3.png" : "img/player_icon2.png";
      this.alt = currentSong.isPlaying ? "Pause" : "Play";
      
      if (currentSong.isPlaying) {
        simulatePlayback();
      }
    });
    
    // Simulate playback when playing
    function simulatePlayback() {
      if (currentSong.isPlaying && currentSong.currentTime < currentSong.duration) {
        setTimeout(() => {
          currentSong.currentTime += 1;
          updatePlayer();
          simulatePlayback();
        }, 1000);
      } else if (currentSong.currentTime >= currentSong.duration) {
        currentSong.isPlaying = false;
        playPauseBtn.src = "img/player_icon2.png";
        playPauseBtn.alt = "Play";
      }
    }
    
    // Seek functionality
    progressBar.addEventListener('input', function() {
      currentSong.currentTime = (this.value / 100) * currentSong.duration;
      updatePlayer();
    });
    
    // Previous/next functionality
    const prevBtn = document.querySelector('.player-controle img[alt="Previous"]');
    const nextBtn = document.querySelector('.player-controle img[alt="Next"]');
    
    prevBtn.addEventListener('click', function() {
      resetPlayer();
      // In a real app, you would load the previous song here
      alert("Previous song would play in a real implementation");
    });
    
    nextBtn.addEventListener('click', function() {
      resetPlayer();
      // In a real app, you would load the next song here
      alert("Next song would play in a real implementation");
    });
    
    function resetPlayer() {
      currentSong.currentTime = 0;
      currentSong.isPlaying = false;
      playPauseBtn.src = "img/player_icon2.png";
      playPauseBtn.alt = "Play";
      updatePlayer();
    }
    
    // Shuffle and repeat buttons
    const shuffleBtn = document.querySelector('.player-controle img[alt="Shuffle"]');
    const repeatBtn = document.querySelector('.player-controle img[alt="Repeat"]');
    
    let isShuffled = false;
    let isRepeated = false;
    
    shuffleBtn.addEventListener('click', function() {
      isShuffled = !isShuffled;
      this.style.opacity = isShuffled ? "1" : "0.7";
      // In a real app, you would implement shuffle logic here
    });
    
    repeatBtn.addEventListener('click', function() {
      isRepeated = !isRepeated;
      this.style.opacity = isRepeated ? "1" : "0.7";
      // In a real app, you would implement repeat logic here
    });
    
    // Volume control (would be in the .controle section)
    const volumeSection = document.querySelector('.controle');
    volumeSection.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: flex-end; height: 100%; gap: 0.5rem; padding-right: 1rem;">
        <i class="fa-solid fa-volume-high" style="opacity: 0.7; font-size: 0.875rem;"></i>
        <input type="range" min="0" max="100" value="80" style="width: 100px; max-width: 120px;" class="volume-bar">
      </div>
    `;
    
    const volumeBar = document.querySelector('.volume-bar');
    volumeBar.addEventListener('input', function() {
      // In a real app, you would adjust the volume here
    });
    
    // Card hover effects
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        const img = this.querySelector('.card-img');
        img.style.transform = 'scale(1.03)';
        img.style.transition = 'transform 0.3s ease';
      });
      
      card.addEventListener('mouseleave', function() {
        const img = this.querySelector('.card-img');
        img.style.transform = 'scale(1)';
      });
    });
    
    // Play song when card is clicked
    cards.forEach(card => {
      card.addEventListener('click', function() {
        const cardTitle = this.querySelector('.card-title').textContent;
        const cardInfo = this.querySelector('.card-info').textContent;
        const cardImg = this.querySelector('.card-img').src;
        
        // Update current song info
        currentSong.title = cardTitle;
        currentSong.artist = cardInfo.split('...')[0];
        currentSong.albumCover = cardImg;
        currentSong.currentTime = 0;
        currentSong.duration = 180 + Math.floor(Math.random() * 60); // Random duration between 3-4 minutes
        currentSong.isPlaying = true;
        
        // Update player UI
        albumCover.src = cardImg;
        songInfo.innerHTML = `
          <h3 style="font-size: 0.875rem; font-weight: 600;">${currentSong.title}</h3>
          <p style="font-size: 0.75rem; opacity: 0.7;">${currentSong.artist}</p>
        `;
        playPauseBtn.src = "img/player_icon3.png";
        playPauseBtn.alt = "Pause";
        updatePlayer();
        simulatePlayback();
      });
    });
  });