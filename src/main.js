import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

// Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyAv5H0-jgze_z1dvT8mHFRwusYXAiTSJgw",
//   authDomain: "digitalrakhi-f8060.firebaseapp.com",
//   databaseURL: "https://digitalrakhi-f8060-default-rtdb.firebaseio.com",
//   projectId: "digitalrakhi-f8060",
//   storageBucket: "digitalrakhi-f8060.appspot.com",
//   messagingSenderId: "360526523502",
//   appId: "1:360526523502:web:3e1af0fd17e9bb1ca5ca7f",
//   measurementId: "G-FPJ5LHJEVS"
// };

const firebaseConfig = {
  apiKey: "AIzaSyAC-DP2RYDI-McBGCOKM-u0wxcy-PPnoK4",
  authDomain: "fir-7d7e0.firebaseapp.com",
  databaseURL: "https://fir-7d7e0-default-rtdb.firebaseio.com",
  projectId: "fir-7d7e0",
  storageBucket: "fir-7d7e0.firebasestorage.app",
  messagingSenderId: "27046342061",
  appId: "1:27046342061:web:90d9050919b217f1b8c524"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

// Add viewport handling for mobile keyboard
let originalViewportHeight = window.innerHeight;
let isKeyboardOpen = false;

function handleViewportChange() {
  const currentHeight = window.innerHeight;
  const heightDifference = originalViewportHeight - currentHeight;
  
  // If height decreased significantly, keyboard is likely open
  if (heightDifference > 150) {
    if (!isKeyboardOpen) {
      console.log('Keyboard opened, viewport height changed from', originalViewportHeight, 'to', currentHeight);
      isKeyboardOpen = true;
    }
  } else {
    // If height returned to original or close to it, keyboard is closed
    if (isKeyboardOpen) {
      console.log('Keyboard closed, restoring original viewport height');
      isKeyboardOpen = false;
      
      // Force viewport to return to original state
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
      }
      
      // Small delay to ensure viewport meta tag takes effect
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }
  }
}

// Listen for viewport changes
window.addEventListener('resize', handleViewportChange);
window.addEventListener('orientationchange', () => {
  // Update original height on orientation change
  setTimeout(() => {
    originalViewportHeight = window.innerHeight;
    console.log('Orientation changed, new original height:', originalViewportHeight);
  }, 500);
});

// Initialize original height
document.addEventListener('DOMContentLoaded', () => {
  originalViewportHeight = window.innerHeight;
  console.log('Initial viewport height:', originalViewportHeight);
  
  // Add input event handlers for better keyboard detection
  const inputs = document.querySelectorAll('input[type="text"]');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      console.log('Input focused, keyboard likely opening');
      // Allow natural viewport adjustment for keyboard
    });
    
    input.addEventListener('blur', () => {
      console.log('Input blurred, keyboard likely closing');
      // Force restore original layout after a delay
      setTimeout(() => {
        if (isKeyboardOpen) {
          console.log('Forcing viewport restoration after input blur');
          isKeyboardOpen = false;
          
          // Force viewport to return to original state
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
          }
          
          // Scroll to top and force layout recalculation
          window.scrollTo(0, 0);
          
          // Additional force refresh after a longer delay
          setTimeout(() => {
            window.scrollTo(0, 0);
          }, 300);
        }
      }, 100);
    });
  });
});

document.addEventListener('DOMContentLoaded', function() {

  const maxMobileWidth = 500;

    if (window.innerWidth > maxMobileWidth) {
        window.location.href = '/mobile-only.html'; 
        return; // Stop further execution since this is a non-mobile device
    }


  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  let pageSessionStart = Date.now(); // Track session start for both main and token pages

  if (token) {
    // Track token page visit
    posthog.capture('token_page_visited', { token });

    // Track session duration when leaving token page
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - pageSessionStart;
      posthog.capture('session_duration', { 
        page_type: 'receiver', 
        duration_seconds: Math.floor(sessionDuration / 1000) 
      });
    });

    showReceiverSide(token);
  } else {
    // Track main page visit
    posthog.capture('page_view', { page_type: 'main' });

    // Track session duration when leaving main page
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - pageSessionStart;
      posthog.capture('session_duration', { 
        page_type: 'sender', 
        duration_seconds: Math.floor(sessionDuration / 1000) 
      });
    });

    setupForm();
  }
});

function setupForm() {
  const form = document.getElementById('rakhiForm');
  let lastAudioBlob = null;
  // Patch: capture audio blob after recording
  const audioPlayback = document.getElementById('audioPlayback');
  if (audioPlayback) {
    audioPlayback.addEventListener('loadedmetadata', () => {
      // Try to fetch the blob from the audio src if possible
      fetch(audioPlayback.src)
        .then(res => res.blob())
        .then(blob => { lastAudioBlob = blob; })
        .catch(() => { lastAudioBlob = null; });
    });
  }
  
  // Get the input fields
  const sisterNameInput = document.getElementById('sisterName');
  const brotherNameInput = document.getElementById('brotherName');
  const termsCheckbox = document.getElementById('terms');
  
  // Auto-check the terms checkbox since it's hidden
  if (termsCheckbox) {
    termsCheckbox.checked = true;
  }

  // Track when both names are completed
  function checkNamesCompleted() {
    if (sisterNameInput.value.trim() && brotherNameInput.value.trim()) {
      posthog.capture('names_completed', {
        sister_name_length: sisterNameInput.value.trim().length,
        brother_name_length: brotherNameInput.value.trim().length
      });
    }
  }

  // Add event listeners to track name completion
  if (sisterNameInput) {
    sisterNameInput.addEventListener('blur', checkNamesCompleted);
  }
  if (brotherNameInput) {
    brotherNameInput.addEventListener('blur', checkNamesCompleted);
  }

  // Add Next button functionality
  const nextButton = document.querySelector('button[onclick*="Next button clicked"]');
  if (nextButton) {
    nextButton.addEventListener('click', function() {
      // Track next button clicked
      posthog.capture('next_button_clicked', {
        has_sister_name: !!sisterNameInput.value.trim(),
        has_brother_name: !!brotherNameInput.value.trim()
      });

      // Change background image
      const senderContainer = document.getElementById('senderContainer');
      senderContainer.style.backgroundImage = "url('Images/sender2.webp')";
      
      // Hide name input fields
      const nameInputs = document.querySelectorAll('#sisterName, #brotherName');
      nameInputs.forEach(input => {
        input.parentElement.style.display = 'none';
      });
      
      // Hide Next button
      nextButton.parentElement.style.display = 'none';
      
      // Show voice recorder UI
      const voiceRecorderUI = document.getElementById('voiceRecorderUI');
      if (voiceRecorderUI) {
        voiceRecorderUI.parentElement.style.display = 'flex';
      }
      
      // DON'T show Submit button yet - wait for recording completion
      // const submitButton = document.querySelector('button[type="submit"]');
      // if (submitButton) {
      //   submitButton.parentElement.style.display = 'block';
      // }
      
      // Show terms and conditions
      const termsWrapper = document.querySelector('input[id="terms"]').parentElement.parentElement;
      if (termsWrapper) {
        termsWrapper.style.display = 'block';
      }
    });
  }

  if (form) {
    // Create a named function for the form submit handler
    const formSubmitHandler = async function(event) {
      event.preventDefault();

      const sisterName = document.getElementById('sisterName').value.trim();
      const brotherName = document.getElementById('brotherName').value.trim();
      const termsAccepted = document.getElementById('terms').checked;
console.log('loggin', sisterName, brotherName, termsAccepted)

      // Track form validation errors
      if (!sisterName || !brotherName || !termsAccepted) {
        posthog.capture('form_validation_error', {
          missing_sister_name: !sisterName,
          missing_brother_name: !brotherName,
          missing_terms_acceptance: !termsAccepted
        });
        alert('Please fill out all fields and accept the terms.');
        return;
      }

      // Track form submission
      posthog.capture('form_submitted', {
        has_audio_recording: !!(recordedAudioBlob && recordedAudioBlob.size > 0)
      });

      // Get submit button and change text to "Wait"
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.textContent = 'Wait';
        submitButton.disabled = true;
        console.log('Button text changed to: Wait');
      }

      const token = generateRandomToken();
      let audioURL = null;
      let uniqueLink = '';

      try {
        // Use the recorded audio blob if available
        if (recordedAudioBlob && recordedAudioBlob.size > 0) {
          console.log('Using recorded audio blob for upload', recordedAudioBlob);
          lastAudioBlob = recordedAudioBlob;
        }
        
        // If there is a recording, upload it to Firebase Storage
        if (lastAudioBlob && lastAudioBlob.size > 0) {
          console.log('Uploading audio blob to Firebase', lastAudioBlob);
          
          // Update button text to show upload in progress
          if (submitButton) {
            submitButton.textContent = 'Uploading...';
          }
          
          try {
            const audioStorageRef = storageRef(storage, `recordings/${token}.webm`);
            await uploadBytes(audioStorageRef, lastAudioBlob);
            audioURL = await getDownloadURL(audioStorageRef);
            console.log('Audio uploaded successfully, URL:', audioURL);
          } catch (audioError) {
            console.error('Audio upload failed:', audioError);
            posthog.capture('audio_upload_failed', {
              error_message: audioError.message,
              file_size: lastAudioBlob.size
            });
            // Continue without audio
          }
          
          // Update button text after upload completes
          if (submitButton) {
            submitButton.textContent = 'Generating Link...';
          }
        } else {
          console.warn('No audio blob available for upload');
        }

        const newPostRef = push(ref(database, 'rakhis'));
        await set(newPostRef, {
          sisterName,
          brotherName,
          token,
          audioURL: audioURL || null,
          createdAt: new Date().toISOString()
        });
        console.log('Data saved to Firebase with audio URL:', audioURL);

        // Generate the unique link
        uniqueLink = `${window.location.origin}${window.location.pathname}?token=${token}`;
        console.log('Generated unique link:', uniqueLink);
        
        // Track successful link generation
        posthog.capture('link_generated_successfully', {
          has_audio: !!audioURL,
          token
        });
        
        // Enable the button and change text to "Click to Share"
        if (submitButton) {
          submitButton.textContent = 'Click to Share';
          submitButton.disabled = false;
          
          // Remove the form submit event
          form.removeEventListener('submit', formSubmitHandler);
          
          // Add a new click handler for sharing
          submitButton.addEventListener('click', async function() {
            // Track sharing attempt
            posthog.capture('sharing_attempted');

            // Disable button during sharing
            submitButton.disabled = true;
            submitButton.textContent = 'Sharing...';
            
            try {
              // First copy to clipboard when user clicks the share button
              
              // Short delay to ensure user sees the clipboard message
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Try native sharing
              const sharingSuccess = await attemptNativeSharing(uniqueLink);
              
              if (sharingSuccess) {
                showCopyFeedback('Opening sharing options...');
                // Give the sharing dialog time to appear before redirecting
                await new Promise(resolve => setTimeout(resolve, 1500));
              } else {
                showCopyFeedback('Link copied! You can paste and share it.');
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
              
              // Redirect to thank-you page
        window.location.href = 'thank-you.html';
            } catch (err) {
              console.error('Error in sharing:', err);
              posthog.capture('share_failed', {
                error_message: err.message
              });
              showCopyFeedback('Error sharing. Link is copied to clipboard.');
              submitButton.disabled = false;
              submitButton.textContent = 'Try Sharing Again';
            }
          });
        }
      } catch (error) {
        console.error('Error saving data or generating link:', error);
        posthog.capture('form_submission_failed', {
          error_message: error.message
        });
        alert('Failed to process your request. Please try again.');
        
        // Reset button on error
        if (submitButton) {
          submitButton.textContent = 'Send';
          submitButton.disabled = false;
        }
      }
    };
    
    // Add the named event handler
    form.addEventListener('submit', formSubmitHandler);
  }
}

function showReceiverSide(token) {
  const senderContainer = document.getElementById('senderContainer');
  const receiverContainer = document.getElementById('receiverContainer');
  const cameraContainer = document.getElementById('camera-container');
  const playVoiceBtn = document.getElementById('playVoiceBtn');
  const playVoiceWrapper = document.getElementById('playVoiceWrapper');
  const playVoiceText = document.getElementById('playVoiceText');
  let audio = null;

  senderContainer.style.display = 'none';
  receiverContainer.style.display = 'flex';

  // Set initial state - hide wrapper until audio loads
  if (playVoiceWrapper) {
    playVoiceWrapper.style.display = 'none'; // Hide completely until audio is ready
  }
  
  if (playVoiceBtn) {
    playVoiceBtn.classList.add('hidden');
  }

  // Fetch data and initialize both greeting and audio in parallel
  const rakhiRef = ref(database, 'rakhis');
  onValue(rakhiRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const rakhiData = Object.values(data).find((entry) => entry.token === token);
      if (rakhiData) {
        console.log('Rakhi data found, initializing greeting and audio in parallel');
        
        // Update greeting
        document.getElementById('greeting').innerHTML = `
          <span class="greeting-title">HEY </span><br>
          <span class="greeting-title" id="brotherNameTitle">${rakhiData.brotherName}!</span><br>
          <span class="greeting-message"> your sibling has sent you a digital rakhi with a special surprise.</span>
        `;

        document.getElementById('greeting-overlay').innerHTML = `
          <span class="greeting-title">HEY</span><br>
          <span class="greeting-message">${rakhiData.brotherName}! your sibling has sent you a digital rakhi with a special surprise.</span>
        `;

        // Adjust font size for long names
        const brotherNameTitle = document.getElementById('brotherNameTitle');
        if (brotherNameTitle) {
          brotherNameTitle.style.fontSize = '2vh';
          console.log('Set font size to 2vh for brother name');
        }
        
        // Initialize audio immediately in parallel with greeting display
        initializeAudio(rakhiData, receiverContainer, cameraContainer, playVoiceBtn, playVoiceWrapper, playVoiceText);
      } else {
        document.getElementById('greeting').innerText = 'No Rakhi information found.';
        document.getElementById('greeting-overlay').innerText = 'No Rakhi information found.';
      }
    }
  }, (error) => {
    console.error('Error fetching data:', error);
    document.getElementById('greeting').innerText = 'Failed to retrieve Rakhi information.';
    document.getElementById('greeting-overlay').innerText = 'Failed to retrieve Rakhi information.';
  });
}

// Separate function to initialize audio after greeting is displayed
function initializeAudio(rakhiData, receiverContainer, cameraContainer, playVoiceBtn, playVoiceWrapper, playVoiceText) {
  let audio = null;
  let audioHasPlayed = false; // Track if audio has been played once
  
  // Set up audio playback if audio URL exists
  if (rakhiData.audioURL) {
    console.log('Audio URL from Firebase:', rakhiData.audioURL);
    
    // Track audio state
    let isPlaying = false;
    let isLoaded = false;
    let playingCheckInterval = null;
    
    // Create audio element
    audio = new Audio();
    
    // Set audio properties before setting src to improve mobile compatibility
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous'; // Try to avoid CORS issues
    
    // Function to check if audio is actually playing
    function checkIfPlaying() {
      if (audio && !audio.paused && !audio.ended && audio.currentTime > 0) {
        console.log('Audio is actually playing - currentTime:', audio.currentTime);
        isPlaying = true;
        if (playVoiceText) playVoiceText.textContent = 'PLAYING';
      } else if (isPlaying && (audio.paused || audio.ended)) {
        console.log('Audio stopped playing');
        isPlaying = false;
        if (isLoaded) {
          if (audioHasPlayed) {
            if (playVoiceText) playVoiceText.textContent = 'TAP TO OPEN CAMERA';
          } else {
            if (playVoiceText) playVoiceText.textContent = 'Tap and wait to listen';
          }
        } else {
          if (playVoiceText) playVoiceText.textContent = 'LOADING';
        }
        if (playingCheckInterval) {
          clearInterval(playingCheckInterval);
          playingCheckInterval = null;
        }
      }
    }
    
    // Function to update button icon
    function updateButtonIcon() {
      const playIcon = playVoiceBtn.querySelector('.material-icons');
      if (playIcon) {
        if (audioHasPlayed && !isPlaying) {
          playIcon.textContent = 'restart_alt'; // Restart icon
        } else {
          playIcon.textContent = 'play_circle_filled'; // Play icon
        }
      }
    }
    
    // Add event listeners for audio
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      console.error('Audio error details:', audio.error);
      isPlaying = false;
      isLoaded = false;
      if (playVoiceBtn) playVoiceBtn.classList.remove('hidden'); // Show button even on error
      if (playVoiceText) {
        if (audioHasPlayed) {
          playVoiceText.textContent = 'TAP TO OPEN CAMERA';
        } else {
          playVoiceText.textContent = 'Tap and wait to listen';
        }
      }
      if (playingCheckInterval) {
        clearInterval(playingCheckInterval);
        playingCheckInterval = null;
      }
      updateButtonIcon();
      
      // Try to reload the audio with a different format if available
      if (!audio.src.includes('&audioFormat=mp3')) {
        console.log('Retrying with explicit MP3 format');
        const retryUrl = rakhiData.audioURL + '&audioFormat=mp3';
        audio.src = retryUrl;
        audio.load();
      }
    });
    
    audio.addEventListener('loadstart', () => {
      console.log('Audio loading started');
      isLoaded = false;
      if (playVoiceWrapper) playVoiceWrapper.style.display = 'flex'; // Show wrapper when loading starts
      if (playVoiceBtn) playVoiceBtn.classList.add('hidden'); // Keep button hidden while loading
      if (playVoiceText) playVoiceText.textContent = 'LOADING';
    });
    
    audio.addEventListener('canplaythrough', () => {
      console.log('Audio loaded successfully and can be played');
      isLoaded = true;
      // Show button only when audio is loaded
      if (playVoiceBtn) playVoiceBtn.classList.remove('hidden');
      if (!isPlaying) {
        if (audioHasPlayed) {
          if (playVoiceText) playVoiceText.textContent = 'TAP TO OPEN CAMERA';
        } else {
          if (playVoiceText) playVoiceText.textContent = 'Tap and wait to listen';
        }
      }
      updateButtonIcon();
    });
    
    audio.addEventListener('play', () => {
      console.log('Audio started playing - play event fired');
      isPlaying = true;
      if (playVoiceText) playVoiceText.textContent = 'PLAYING';
      updateButtonIcon();
      // Start checking playing state
      if (!playingCheckInterval) {
        playingCheckInterval = setInterval(checkIfPlaying, 100);
      }
    });
    
    audio.addEventListener('playing', () => {
      console.log('Audio is playing - playing event fired');
      isPlaying = true;
      if (playVoiceText) playVoiceText.textContent = 'PLAYING';
      updateButtonIcon();
    });
    
    audio.addEventListener('pause', () => {
      console.log('Audio paused');
      isPlaying = false;
      if (isLoaded) {
        if (audioHasPlayed) {
          if (playVoiceText) playVoiceText.textContent = 'TAP TO OPEN CAMERA';
        } else {
          if (playVoiceText) playVoiceText.textContent = 'Tap and wait to listen';
        }
      } else {
        if (playVoiceText) playVoiceText.textContent = 'LOADING';
      }
      if (playingCheckInterval) {
        clearInterval(playingCheckInterval);
        playingCheckInterval = null;
      }
      updateButtonIcon();
    });
    
    audio.addEventListener('ended', () => {
      console.log('Audio playback completed');
      
      // Track audio play completed
      posthog.capture('audio_play_completed', {
        duration: audio.duration || 0
      });
      
      isPlaying = false;
      audioHasPlayed = true; // Mark that audio has been played
      if (playVoiceText) playVoiceText.textContent = 'TAP TO OPEN CAMERA';
      if (playingCheckInterval) {
        clearInterval(playingCheckInterval);
        playingCheckInterval = null;
      }
      updateButtonIcon();
      
      // Re-enable container click event for camera initialization
      receiverContainer.style.pointerEvents = 'auto';
      
      // Set up container click handler for camera initialization
      receiverContainer.addEventListener('click', (e) => {
        if (audioHasPlayed && !isPlaying) {
          handleTap(receiverContainer, cameraContainer, rakhiData);
        }
      }, { once: true }); // Use once: true to prevent multiple handlers
    });
    
    // Set up play button click handler if button exists
    if (playVoiceBtn) {
      playVoiceBtn.onclick = (e) => {
        e.stopPropagation(); // Prevent the click from bubbling up to the container
        console.log('Play button clicked, attempting to play audio');
        
        // Track audio play attempted
        posthog.capture('audio_play_attempted');
        
        // Disable the container click event while audio is playing
        receiverContainer.style.pointerEvents = 'none';
        
        // Change text to playing immediately when clicked
        if (playVoiceText) playVoiceText.textContent = 'PLAYING';
        
        // Try to reset and reload audio if it failed before
        if (!isLoaded && audio.error) {
          console.log('Audio had error, trying to reload before playing');
          audio.load();
        }
        
        audio.currentTime = 0;
        audio.play().then(() => {
          console.log('Audio.play() promise resolved - audio should be playing');
          isPlaying = true;
          if (playVoiceText) playVoiceText.textContent = 'PLAYING';
          updateButtonIcon();
          // Start checking playing state
          if (!playingCheckInterval) {
            playingCheckInterval = setInterval(checkIfPlaying, 100);
          }
        }).catch(err => {
          console.error('Error playing audio:', err);
          isPlaying = false;
          alert('Could not play the audio. Please try again.');
          if (isLoaded) {
            if (audioHasPlayed) {
              if (playVoiceText) playVoiceText.textContent = 'TAP TO OPEN CAMERA';
            } else {
              if (playVoiceText) playVoiceText.textContent = 'Tap and wait to listen';
            }
          } else {
            if (playVoiceText) playVoiceText.textContent = 'LOADING';
          }
          receiverContainer.style.pointerEvents = 'auto';
          if (playingCheckInterval) {
            clearInterval(playingCheckInterval);
            playingCheckInterval = null;
          }
          updateButtonIcon();
        });
      };
    }
    
    // Set audio source after all event listeners are attached
    audio.src = rakhiData.audioURL;
    console.log('Starting audio load with src:', audio.src);
    audio.load();
  } else {
    console.log('No audio URL found, allowing direct tap to AR experience');
    // If no audio, allow tapping anywhere to start the experience
    if (playVoiceWrapper) playVoiceWrapper.style.display = 'flex'; // Show wrapper even without audio
    if (playVoiceText) playVoiceText.textContent = 'Tap here to capture your digital Rakhi';
    if (playVoiceBtn) playVoiceBtn.classList.remove('hidden'); // Show button anyway
    receiverContainer.addEventListener('click', (e) => {
      handleTap(receiverContainer, cameraContainer, rakhiData);
    });
  }
}


async function handleTap(receiverContainer, cameraContainer, rakhiData) {
  try {
    // Show loading state on the button
    const playVoiceText = document.getElementById('playVoiceText');
    if (playVoiceText) {
      playVoiceText.textContent = 'Loading...';
    }

    // Show camera loading indicator first, but keep camera container hidden until initialization succeeds
    const cameraLoading = document.getElementById('camera-loading');
    if (cameraLoading) {
      cameraLoading.style.display = 'flex';
    }
    
    // Prepare camera container but keep it invisible until camera is ready
    cameraContainer.style.display = 'flex';
    cameraContainer.style.opacity = '0';
    cameraContainer.style.backgroundColor = '#000'; // Set black background to avoid white screen
    
    // Fade out receiver container
    receiverContainer.style.opacity = 0;
    
    // Hide receiver container after fade out
    setTimeout(() => {
      receiverContainer.style.display = 'none';
    }, 500);

    // Initialize camera kit (this takes time)
    await startCameraKit(rakhiData);

    // If we got here, camera initialization was successful
    
    // Hide loading indicator
    if (cameraLoading) {
      cameraLoading.style.display = 'none';
    }
    
    // Show camera container with fade in
    cameraContainer.style.opacity = '1';
    cameraContainer.style.transition = 'opacity 0.5s ease-in-out';

  } catch (error) {
    console.error('Error initializing camera:', error);
    
    // Hide loading indicator
    const cameraLoading = document.getElementById('camera-loading');
    if (cameraLoading) {
      cameraLoading.style.display = 'none';
    }
    
    // Hide camera container on error
    cameraContainer.style.display = 'none';
    
    // Show receiver container again
    receiverContainer.style.display = 'flex';
    receiverContainer.style.opacity = '1';
    receiverContainer.style.transition = 'opacity 0.5s ease-in-out';
    
    // Reset the text if there's an error
    const playVoiceText = document.getElementById('playVoiceText');
    if (playVoiceText) {
      playVoiceText.textContent = 'Camera not available. Tap to try again.';
    }
    
    // Show error message to user
    showCopyFeedback('Camera access failed. Please check permissions and try again.');
  }
}


function generateRandomToken() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) { // Generate a 16-character random token
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

async function handleSharing(link) {
  try {
    console.log('Sharing link:', link);
    
    // Show a message that we're preparing the image
    showCopyFeedback('Preparing image with link...');
    
    // Always download the image with link
    console.log('Downloading image with link');
    
    // Fetch the thumb.jpg image
    fetch('./Images/thumb.jpg')
      .then(response => response.blob())
      .then(blob => {
        // Create image and add text
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height + 100; // Extra space for text
          
          const ctx = canvas.getContext('2d');
          // Draw image
          ctx.drawImage(img, 0, 0);
          
          // Draw text with link
          ctx.fillStyle = '#6D3900';
          ctx.font = '16px Trajan';
          ctx.textAlign = 'center';
          ctx.fillText('Check out this digital Rakhi I have sent you! ', canvas.width/2, img.height + 30);
          ctx.fillText(link, canvas.width/2, img.height + 60);
          
          // Convert to blob and download
          canvas.toBlob(blob => {
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = 'rakhi_invitation.jpg';
            downloadLink.click();
            
            // Show success message
            showCopyFeedback('Image downloaded!');
            
            // Redirect after a delay
            setTimeout(() => {
              window.location.href = 'thank-you.html';
            }, 2000);
          }, 'image/jpeg');
        };
        img.src = URL.createObjectURL(blob);
      })
      .catch(err => {
        console.warn('Failed to download image:', err);
        showCopyFeedback('Download failed! Redirecting...');
        setTimeout(() => {
          window.location.href = 'thank-you.html';
        }, 1500);
      });
    
  } catch (err) {
    console.error('Error in sharing flow:', err);
    showCopyFeedback('Error occurred! Redirecting...');
    setTimeout(() => {
      window.location.href = 'thank-you.html';
    }, 1500);
  }
}

// Native sharing function with fallbacks
async function attemptNativeSharing(link) {
  try {
    // Try Web Share API (works on most mobile browsers)
    if (navigator.share) {
      console.log('Using Web Share API');
      
      // Track sharing method used
      posthog.capture('sharing_method_used', { method: 'native_share_api' });
      
      try {
        await navigator.share({
          title: 'Rakhi in 30 secs',
          text: 'Check out this digital Rakhi I have sent you! ',
          url: link
        });
        console.log('Web Share API successful');
        return true;
      } catch (shareError) {
        // If user cancelled sharing, don't treat as error
        if (shareError.name !== 'AbortError') {
          console.warn('Web Share API error:', shareError);
        }
        return false;
      }
    }
    
    // If Web Share API is not available, download the thumb image as fallback
    console.log('Web Share API not available, downloading thumb image');
    
    // Track sharing method used
    posthog.capture('sharing_method_used', { method: 'image_download' });
    
    // Create a notification that we're downloading the image
    showCopyFeedback('Downloading image with link...');
    
    // Fetch the thumb.jpg image
    fetch('./Images/thumb.jpg')
      .then(response => response.blob())
      .then(blob => {
        // Create a link to download the image
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'rakhi_invitation.jpg';
        
        // Append text to the image using canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height + 100; // Extra space for text
          
          const ctx = canvas.getContext('2d');
          // Draw image
          ctx.drawImage(img, 0, 0);
          
          // Draw text with link
          ctx.fillStyle = '#6D3900';
          ctx.font = '16px Trajan';
          ctx.textAlign = 'center';
          ctx.fillText('Check out this digital Rakhi I have sent you! ', canvas.width/2, img.height + 30);
          ctx.fillText(link, canvas.width/2, img.height + 60);
          
          // Convert to blob and download
          canvas.toBlob(blob => {
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = 'rakhi_invitation.jpg';
            downloadLink.click();
          }, 'image/jpeg');
        };
        img.src = URL.createObjectURL(blob);
      })
      .catch(err => {
        console.warn('Failed to download image:', err);
        // If image download fails, just show a message that the link was copied
        showCopyFeedback('Link copied to clipboard!');
      });
    
    return false;
  } catch (err) {
    console.warn('Native sharing failed:', err);
    return false;
  }
}

// Show feedback to user that link was copied
function showCopyFeedback(message) {
  // Create feedback element
  const feedback = document.createElement('div');
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-size: 16px;
    text-align: center;
    animation: fadeIn 0.3s ease-out;
  `;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  // Add to document
  document.body.appendChild(feedback);
  
  // Remove after 2 seconds with fade out
  setTimeout(() => {
    feedback.style.animation = 'fadeOut 0.3s ease-in';
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
  }
    }, 300);
  }, 2000);
}

async function startCameraKit(rakhiData) {
  const cameraContainer = document.getElementById('camera-container');
  
  try {
    console.log('Starting Camera Kit initialization...');
    
    // Step 1: Bootstrap Camera Kit
    console.log('Bootstrapping Camera Kit...');
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });
    console.log('Camera Kit bootstrapped successfully');

    // Step 2: Request camera permission and get media stream with flexible constraints
    console.log('Requesting camera access...');
    let mediaStream;
    try {
      // First try with ideal resolution that works on most devices
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      console.log('Requesting camera with constraints:', constraints);
      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted');
      
    } catch (permissionError) {
      console.error('Camera permission denied:', permissionError);
      throw permissionError;
    }

    // Step 3: Create session and load lens
    console.log('Creating session and loading lens...');
    const session = await cameraKit.createSession();
    
    // Add error event listener to help with debugging
    session.events.addEventListener("error", (event) => {
      console.error("Camera Kit session error:", event.detail);
    });
    
    const lens = await cameraKit.lensRepository.loadLens('20ef7516-0029-41be-a6b2-37a3602e56b6', 'fdd0879f-c570-490e-9dfc-cba0f122699f');
    console.log('Lens loaded successfully');
    
    // Step 4: Apply lens with parameters
    await session.applyLens(lens, {
      launchParams: {
        greeting_text: `Hey ${rakhiData.brotherName}!`,
        brother_name: `${rakhiData.brotherName}`,
        message: "Share this moment with your sibling on social media!"
      }
    });
    console.log('Lens applied with parameters');

    // Step 5: Set up source and rendering with appropriate size
    const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
    await session.setSource(source);

    // Set render size based on device capabilities
    // Use a smaller render size for better performance
    // Camera Kit render size sets the resolution at which Lenses are rendered
    // This is separate from the display size which is controlled by CSS
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (isPortrait) {
      // Portrait mode - common for phones
      // Use smaller render sizes (480x640) for better performance
      source.setRenderSize(480, 640);
      console.log('Set portrait render size: 480x640');
    } else {
      // Landscape mode
      // Use smaller render sizes (640x480) for better performance
      source.setRenderSize(640, 480);
      console.log('Set landscape render size: 640x480');
    }
    
    // Start the session
    session.play();

    // Step 6: Set up canvas rendering
    const liveOutput = session.output.live;
    const canvas = document.getElementById('canvas');
    if (canvas) {
      // Make sure canvas exists before drawing to it
      drawVideoToCanvas(liveOutput, canvas);
    } else {
      // Fallback to direct output
      cameraContainer.appendChild(liveOutput);
    }

    // Step 7: Set up capture button
    document.getElementById('captureButton').addEventListener('click', () => captureScreenshot(canvas));
    
    console.log('Camera Kit initialization completed successfully');
    
  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
    throw error; // Re-throw to handle in calling function
  }
}

function drawVideoToCanvas(videoElement, canvas) {
  const context = canvas.getContext('2d');

  // Create logo image and wait for it to load before starting drawing
  const logo = new Image();
  logo.crossOrigin = "anonymous"; // Avoid CORS issues
  
  // Set canvas display size via CSS (this doesn't affect render resolution)
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  
  // Set internal canvas dimensions to match the render size (smaller for better performance)
  // This is the actual resolution the canvas will render at
  canvas.width = 640;
  canvas.height = 480;
  
  // Flag to track if logo is loaded
  let logoLoaded = false;
  
  // Wait for logo to load before starting animation
  logo.onload = () => {
    logoLoaded = true;
    // Start drawing frames once logo is loaded
    requestAnimationFrame(drawFrame);
  };
  
  // Set logo source after attaching onload handler
  logo.src = 'Images/logo.png';
  
  // Handle logo loading error
  logo.onerror = (err) => {
    console.warn('Logo failed to load:', err);
    logoLoaded = true; // Continue without logo
    requestAnimationFrame(drawFrame);
  };

  function drawFrame() {
    // Skip if canvas is not visible or attached to DOM
    if (!canvas.isConnected) {
      return; // Stop animation if canvas is removed
    }
    
    // Clear the canvas before drawing
    context.clearRect(0, 0, canvas.width, canvas.height);

    try {
      // Draw the video frame on the canvas
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Only draw logo if it's loaded
      if (logoLoaded) {
        // Calculate the logo dimensions and position based on the given CSS-like properties
        const logoHeight = canvas.height * 0.08;  // 8% of canvas height
        const logoWidth = logo.naturalWidth * (logoHeight / logo.naturalHeight); // Maintain aspect ratio
        
        const logoX = canvas.width - logoWidth - (canvas.width * 0.01); // 1% from the right
        const logoY = canvas.height * 0.007; // 0.7% from the top
        
        // Draw the logo on the canvas
        context.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
      }
      
      // Request the next frame
      requestAnimationFrame(drawFrame);
    } catch (err) {
      console.error('Error drawing to canvas:', err);
      // Try to recover by requesting another frame
      setTimeout(() => requestAnimationFrame(drawFrame), 500);
    }
  }
  
  // If logo fails to load after 2 seconds, start drawing anyway
  setTimeout(() => {
    if (!logoLoaded) {
      console.warn('Logo load timeout - starting without logo');
      logoLoaded = true;
      requestAnimationFrame(drawFrame);
    }
  }, 2000);
}


function captureScreenshot(canvas) {
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('Failed to create blob from canvas');
      return;
    }

    // Track photo captured
    posthog.capture('photo_captured');

    // Create a URL for the blob to display in the preview
    const imageUrl = URL.createObjectURL(blob);
    
    // Show the preview container and hide the camera container
    const cameraContainer = document.getElementById('camera-container');
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('previewImage');
    
    // Set the preview image source
    previewImage.src = imageUrl;
    
    // Ensure the image is loaded before showing the preview
    previewImage.onload = () => {
      // Hide camera container and show preview
      cameraContainer.style.display = 'none';
      previewContainer.style.display = 'flex';
      
      // Force layout recalculation to ensure everything is positioned correctly
      window.scrollTo(0, 0);
    };
    
    // Store the blob for later use
    window.capturedImageBlob = blob;
  }, 'image/png');
}

// Add event listeners for share and retake buttons
document.addEventListener('DOMContentLoaded', () => {
  // Event listeners will be set up after canvas is initialized
  // The original captureButton event listener is already set up in startCameraKit function
  
  // Share button event listener
  document.getElementById('shareButton').addEventListener('click', () => {
    // Track photo sharing attempted
    posthog.capture('photo_shared');
    
    const blob = window.capturedImageBlob;
    if (!blob) {
      console.error('No image captured');
      return;
    }
    
    const file = new File([blob], 'digital_rakhi.png', { type: 'image/png' });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: 'Digital Rakhi',
        text: 'Check out this cool digital Rakhi!',
      }).then(() => {
        // Track successful photo sharing
        posthog.capture('sharing_method_used', { method: 'photo_share', context: 'ar_photo' });
        
        // Track thank you page reached
        posthog.capture('thank_you_page_reached', { context: 'photo_share' });
        
        // Redirect to the Thank You page after sharing
        window.location.href = 'thank-your.html';
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    } else {
      downloadImage(blob);
    }
  });
  
  // Retake button event listener
  document.getElementById('retakeButton').addEventListener('click', () => {
    // Track photo retaken
    posthog.capture('photo_retaken');
    
    // Hide preview container and show camera container
    document.getElementById('preview-container').style.display = 'none';
    const cameraContainer = document.getElementById('camera-container');
    cameraContainer.style.display = 'block';
    
    // Force layout recalculation to ensure camera is positioned correctly
    window.scrollTo(0, 0);
    
    // Clear the stored blob
    window.capturedImageBlob = null;
  });
});

function downloadImage(blob) {
  // Track image download
  posthog.capture('sharing_method_used', { method: 'photo_download', context: 'ar_photo' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'digital_rakhi.png';
  link.click();

  // Add a delay to ensure the download is initiated before redirecting
  setTimeout(() => {
    // Track thank you page reached
    posthog.capture('thank_you_page_reached', { context: 'photo_download' });
    
    window.location.href = 'thank-your.html'; // Redirect to the Thank You page
  }, 3000); // 3-second delay, adjust if needed
}

// Voice Recording Functionality
// --- Voice Recorder UI Elements ---
const holdRecordBtn = document.getElementById('holdRecordBtn');
const timerContainer = document.getElementById('timerContainer');
const recordTimer = document.getElementById('recordTimer');
const afterRecordBtns = document.getElementById('afterRecordBtns');
const playRecordingBtn = document.getElementById('playRecordingBtn');
const cancelRecordingBtn = document.getElementById('cancelRecordingBtn');
let mediaRecorder = null;
let audioChunks = [];
let recordStartTime = null;
let recordTimerInterval = null;
let recordedAudioBlob = null;
let recordedAudioUrl = null;
let audioPlayer = null;
let isRecording = false;

function resetVoiceRecorderUI() {
  holdRecordBtn.style.display = 'flex';
  timerContainer.style.display = 'none';
  afterRecordBtns.style.display = 'none';
  recordTimer.textContent = '10'; // Reset to 10 seconds
  recordedAudioBlob = null;
  recordedAudioUrl = null;
  isRecording = false;
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer = null;
  }
  
  // Hide Submit button when recording is cancelled/reset
  const submitButton = document.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.parentElement.style.display = 'none';
  }
}

function updateRecordTimerAndProgress() {
  const elapsed = (Date.now() - recordStartTime) / 1000;
  const maxDuration = 10;
  const remainingSeconds = maxDuration - elapsed;
  
  // Format the countdown timer (10 to 0) - just show the number
  recordTimer.textContent = remainingSeconds <= 0 ? '0' : `${Math.ceil(remainingSeconds)}`;
  
  if (elapsed >= maxDuration) {
    stopVoiceRecording();
  }
}

function startVoiceRecording() {
  console.log('Voice recording started');
  
  // Track recording started
  posthog.capture('recording_started');
  
  audioChunks = [];
  recordStartTime = Date.now();
  timerContainer.style.display = 'block';
  holdRecordBtn.style.display = 'none';
  afterRecordBtns.style.display = 'none';
  recordTimer.textContent = '10'; // Start with 10 seconds
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Your browser does not support audio recording.');
    console.error('MediaDevices or getUserMedia not supported');
    resetVoiceRecorderUI();
    return;
  }
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      // Try to use a more widely supported audio format
      const options = { 
        mimeType: 'audio/webm;codecs=opus'
      };
      
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.warn('MediaRecorder with options failed, trying without options', e);
      mediaRecorder = new MediaRecorder(stream);
      }
      
      // Request data every second instead of only on stop
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        recordedAudioBlob = new Blob(audioChunks, { type: mimeType });
        recordedAudioUrl = URL.createObjectURL(recordedAudioBlob);
        console.log('Voice recording stopped, blob created:', recordedAudioBlob);
        console.log('Audio MIME type:', mimeType);
        timerContainer.style.display = 'none';
        afterRecordBtns.style.display = 'flex';
        isRecording = false;
        
        // Show Submit button now that recording is completed
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.parentElement.style.display = 'block';
        }
      };
      
      mediaRecorder.onerror = (err) => {
        console.error('MediaRecorder error:', err);
        resetVoiceRecorderUI();
      };
      
      // Start recording and request data every second
      mediaRecorder.start(1000);
      isRecording = true;
      recordTimerInterval = setInterval(updateRecordTimerAndProgress, 100);
    })
    .catch(err => {
      alert('Could not access microphone.');
      console.error('getUserMedia error:', err);
      resetVoiceRecorderUI();
    });
}

function stopVoiceRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    clearInterval(recordTimerInterval);
    console.log('Voice recording manually stopped');
  }
}

if (holdRecordBtn) {
  holdRecordBtn.addEventListener('click', () => {
    if (!isRecording) {
    startVoiceRecording();
    } else {
      stopVoiceRecording();
    }
  });
}

if (playRecordingBtn) {
  playRecordingBtn.addEventListener('click', () => {
    if (recordedAudioUrl) {
      if (audioPlayer) {
        audioPlayer.pause();
      }
      audioPlayer = new Audio(recordedAudioUrl);
      audioPlayer.play();
      console.log('Playing recorded audio');
    }
  });
}
if (cancelRecordingBtn) {
  cancelRecordingBtn.addEventListener('click', () => {
    resetVoiceRecorderUI();
    console.log('Recording cancelled and UI reset');
  });
}
