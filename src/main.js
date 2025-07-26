import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue } from 'firebase/database';
import { getAnalytics, logEvent } from 'firebase/analytics';
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
  appId: "1:27046342061:web:90d9050919b217f1b8c524",
  measurementId: "G-DY0JWSZ4LW"
};


// Initialize Firebase and Analytics
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);
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
    logEvent(analytics, 'token_page_visit', { token });

    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - pageSessionStart;
      logEvent(analytics, 'token_page_session_duration', { duration_seconds: Math.floor(sessionDuration / 1000) });
    });

    showReceiverSide(token);
  } else {
    logEvent(analytics, 'main_page_visit');

    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - pageSessionStart;
      logEvent(analytics, 'main_page_session_duration', { duration_seconds: Math.floor(sessionDuration / 1000) });
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

  // Add Next button functionality
  const nextButton = document.querySelector('button[onclick*="Next button clicked"]');
  if (nextButton) {
    nextButton.addEventListener('click', function() {
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
      
      // Show Submit button
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.parentElement.style.display = 'block';
      }
      
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
      if (!sisterName || !brotherName || !termsAccepted) {
        alert('Please fill out all fields and accept the terms.');
        return;
      }

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
          
          const audioStorageRef = storageRef(storage, `recordings/${token}.webm`);
          await uploadBytes(audioStorageRef, lastAudioBlob);
          audioURL = await getDownloadURL(audioStorageRef);
          console.log('Audio uploaded successfully, URL:', audioURL);
          
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
        
        // Enable the button and change text to "Click to Share"
        if (submitButton) {
          submitButton.textContent = 'Click to Share';
          submitButton.disabled = false;
          
          // Remove the form submit event
          form.removeEventListener('submit', formSubmitHandler);
          
          // Add a new click handler for sharing
          submitButton.addEventListener('click', async function() {
            // Disable button during sharing
            submitButton.disabled = true;
            submitButton.textContent = 'Sharing...';
            
            try {
              // First copy to clipboard when user clicks the share button
              await copyToClipboard(uniqueLink);
              showCopyFeedback('Link copied to clipboard!');
              
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
              showCopyFeedback('Error sharing. Link is copied to clipboard.');
              submitButton.disabled = false;
              submitButton.textContent = 'Try Sharing Again';
            }
          });
        }
      } catch (error) {
        console.error('Error saving data or generating link:', error);
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

  // Set initial state - show wrapper but hide button until audio loads
  if (playVoiceWrapper) {
    playVoiceWrapper.style.display = 'flex';
    if (playVoiceText) playVoiceText.textContent = 'LOADING';
  }
  
  if (playVoiceBtn) {
    playVoiceBtn.classList.add('hidden'); // Hide button initially with a class
  }

  // Immediately start fetching data
  const rakhiRef = ref(database, 'rakhis');
  onValue(rakhiRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const rakhiData = Object.values(data).find((entry) => entry.token === token);
      if (rakhiData) {
        // Immediately update greeting
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
          const nameLength = rakhiData.brotherName.length;
          let fontSize = 2.5; // Default font size in vh
          
          if (nameLength > 25) {
            fontSize = 1.2;
          } else if (nameLength > 20) {
            fontSize = 1.5;
          } else if (nameLength > 15) {
            fontSize = 1.8;
          } else if (nameLength > 10) {
            fontSize = 2.0;
          }
          
          brotherNameTitle.style.fontSize = fontSize + 'vh';
          console.log(`Adjusted font size to ${fontSize}vh for name length: ${nameLength}`);
        }

        // Set up audio playback if audio URL exists - start loading immediately
        if (rakhiData.audioURL) {
          console.log('Audio URL from Firebase:', rakhiData.audioURL);
          
          // Track audio state
          let isPlaying = false;
          let isLoaded = false;
          let playingCheckInterval = null;
          
          // Create audio element and start loading immediately
          audio = new Audio(rakhiData.audioURL);
          
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
                if (playVoiceText) playVoiceText.textContent = 'Tap and wait to listen';
              } else {
                if (playVoiceText) playVoiceText.textContent = 'LOADING';
              }
              if (playingCheckInterval) {
                clearInterval(playingCheckInterval);
                playingCheckInterval = null;
              }
            }
          }
          
          // Add event listeners for audio
          audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            isPlaying = false;
            isLoaded = false;
            if (playVoiceBtn) playVoiceBtn.classList.remove('hidden'); // Show button even on error
            if (playVoiceText) playVoiceText.textContent = 'Tap and wait to listen';
            if (playingCheckInterval) {
              clearInterval(playingCheckInterval);
              playingCheckInterval = null;
            }
          });
          
          audio.addEventListener('loadstart', () => {
            console.log('Audio loading started');
            isLoaded = false;
            if (playVoiceBtn) playVoiceBtn.classList.add('hidden'); // Keep button hidden while loading
            if (playVoiceText) playVoiceText.textContent = 'LOADING';
          });
          
          audio.addEventListener('canplaythrough', () => {
            console.log('Audio loaded successfully and can be played');
            isLoaded = true;
            // Show button only when audio is loaded
            if (playVoiceBtn) playVoiceBtn.classList.remove('hidden');
            if (!isPlaying) {
              if (playVoiceText) playVoiceText.textContent = 'Tap and wait to listen';
            }
          });
          
          audio.addEventListener('play', () => {
            console.log('Audio started playing - play event fired');
            isPlaying = true;
            if (playVoiceText) playVoiceText.textContent = 'PLAYING';
            // Start checking playing state
            if (!playingCheckInterval) {
              playingCheckInterval = setInterval(checkIfPlaying, 100);
            }
          });
          
          audio.addEventListener('playing', () => {
            console.log('Audio is playing - playing event fired');
            isPlaying = true;
            if (playVoiceText) playVoiceText.textContent = 'PLAYING';
          });
          
          audio.addEventListener('pause', () => {
            console.log('Audio paused');
            isPlaying = false;
            if (isLoaded) {
              if (playVoiceText) playVoiceText.textContent = 'Tap and wait to listen';
            } else {
              if (playVoiceText) playVoiceText.textContent = 'LOADING';
            }
            if (playingCheckInterval) {
              clearInterval(playingCheckInterval);
              playingCheckInterval = null;
            }
          });
          
          audio.addEventListener('ended', () => {
            console.log('Audio playback completed, launching AR experience');
            isPlaying = false;
            if (playVoiceText) playVoiceText.textContent = 'Tap and wait to listen';
            if (playingCheckInterval) {
              clearInterval(playingCheckInterval);
              playingCheckInterval = null;
            }
            // Short delay before launching camera experience
            setTimeout(() => {
              handleTap(receiverContainer, cameraContainer, rakhiData);
            }, 500);
          });
          
          // Set up play button click handler if button exists
          if (playVoiceBtn) {
            playVoiceBtn.onclick = (e) => {
              e.stopPropagation(); // Prevent the click from bubbling up to the container
              console.log('Play button clicked, attempting to play audio');
              
              // Disable the container click event while audio is playing
              receiverContainer.style.pointerEvents = 'none';
              
              // Change text to playing immediately when clicked
              if (playVoiceText) playVoiceText.textContent = 'PLAYING';
              isPlaying = true;
              
              audio.currentTime = 0;
              audio.play().then(() => {
                console.log('Audio.play() promise resolved - audio should be playing');
                isPlaying = true;
                if (playVoiceText) playVoiceText.textContent = 'PLAYING';
                // Start checking playing state
                if (!playingCheckInterval) {
                  playingCheckInterval = setInterval(checkIfPlaying, 100);
                }
              }).catch(err => {
                console.error('Error playing audio:', err);
                isPlaying = false;
                alert('Could not play the audio. Please try again.');
                if (isLoaded) {
                  if (playVoiceText) playVoiceText.textContent = 'Tap and wait to listen';
                } else {
                  if (playVoiceText) playVoiceText.textContent = 'LOADING';
                }
                receiverContainer.style.pointerEvents = 'auto';
                if (playingCheckInterval) {
                  clearInterval(playingCheckInterval);
                  playingCheckInterval = null;
                }
              });
            };
          }
        } else {
          console.log('No audio URL found, allowing direct tap to AR experience');
          // If no audio, allow tapping anywhere to start the experience
          if (playVoiceText) playVoiceText.textContent = 'TAP TO EXPERIENCE';
          if (playVoiceBtn) playVoiceBtn.classList.remove('hidden'); // Show button anyway
          receiverContainer.addEventListener('click', (e) => {
            handleTap(receiverContainer, cameraContainer, rakhiData);
          });
        }
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


async function handleTap(receiverContainer, cameraContainer, rakhiData) {
  try {
    await startCameraKit(rakhiData);

    cameraContainer.style.display = 'flex';
    receiverContainer.style.opacity = 0;
    cameraContainer.style.opacity = 1;
    setTimeout(() => {
      receiverContainer.style.display = 'none';
    }, 1000);

  } catch (error) {
    console.error('Error initializing camera:', error);
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
    
    // Show a message that the link is being prepared
    showCopyFeedback('Preparing link...');
    
    // First, try to copy to clipboard using the most reliable methods
    const clipboardSuccess = await copyToClipboard(link);
    
    if (clipboardSuccess) {
      // Show success message for clipboard copy
      showCopyFeedback('Link copied to clipboard!');
      
      // Short delay to ensure user sees the clipboard message
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Then try native sharing
    const sharingSuccess = await attemptNativeSharing(link);
    
    // If sharing was successful, show a message
    if (sharingSuccess) {
      showCopyFeedback('Opening sharing options...');
      
      // Give the sharing dialog time to appear before redirecting
      await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
      // If sharing wasn't successful but clipboard was, show a longer message
      if (clipboardSuccess) {
        showCopyFeedback('Link copied! You can now paste and share it.');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Redirect to thank-you page
    window.location.href = 'thank-you.html';
  } catch (err) {
    console.error('Error in sharing flow:', err);
    
    // Even if there's an error, show a message that the link was copied (if it was)
    showCopyFeedback('Link saved! Redirecting...');
    
    // Short delay before redirect
    await new Promise(resolve => setTimeout(resolve, 1500));
    window.location.href = 'thank-you.html';
  }
}

// Modern clipboard copy function with fallbacks
async function copyToClipboard(text) {
  try {
    // Try the modern async Clipboard API first (most reliable on modern browsers)
    if (navigator.clipboard && window.isSecureContext) {
      console.log('Using modern clipboard API');
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // iOS Safari specific fallback (most reliable on iOS)
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent)) {
      console.log('Using iOS Safari clipboard fallback');
      const tempTextarea = document.createElement('textarea');
      tempTextarea.value = text;
      tempTextarea.style.position = 'fixed';
      tempTextarea.style.opacity = '0';
      tempTextarea.style.zIndex = '-1';
      tempTextarea.style.pointerEvents = 'none';
      tempTextarea.style.left = '-9999px'; // Position off-screen
      tempTextarea.setAttribute('readonly', ''); // Prevent keyboard from appearing on mobile
      
      document.body.appendChild(tempTextarea);
      
      // Handle iOS Safari
      const range = document.createRange();
      range.selectNodeContents(tempTextarea);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      tempTextarea.setSelectionRange(0, text.length);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(tempTextarea);
      
      if (successful) return true;
    }
    
    // General fallback for other browsers
    console.log('Using general clipboard fallback');
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    return true;
  } catch (err) {
    console.warn('Clipboard copy failed:', err);
    return false;
  }
}

// Native sharing function with fallbacks
async function attemptNativeSharing(link) {
  try {
    // Detect device/browser
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    
    // Try Web Share API first (works on most mobile browsers)
    if (navigator.share) {
      console.log('Using Web Share API');
      try {
        await navigator.share({
          title: 'Digital Rakhi - Send Your Love',
          text: 'Check out this digital Rakhi I sent you! Celebrate the eternal bond of love.',
          url: link
        });
        console.log('Web Share API successful');
        return true;
      } catch (shareError) {
        // If user cancelled sharing, don't treat as error
        if (shareError.name !== 'AbortError') {
          console.warn('Web Share API error:', shareError);
        }
        // Continue to fallbacks
      }
    }
    
    // Mobile-specific fallbacks
    if (isMobile) {
      console.log('Using mobile-specific sharing fallbacks');
      
      // Try multiple sharing options for mobile
      const shareUrls = [
        // WhatsApp (works on both iOS and Android)
        `whatsapp://send?text=${encodeURIComponent('Check out this digital Rakhi I sent you! ' + link)}`,
        
        // SMS (works on iOS and Android)
        `sms:?body=${encodeURIComponent('Check out this digital Rakhi I sent you! ' + link)}`,
        
        // Email (universal fallback)
        `mailto:?subject=${encodeURIComponent('Digital Rakhi')}&body=${encodeURIComponent('Check out this digital Rakhi I sent you! ' + link)}`
      ];
      
      // Try each sharing option until one works
      for (let i = 0; i < shareUrls.length; i++) {
        try {
          const shareWindow = window.open(shareUrls[i], '_blank');
          if (shareWindow) {
            console.log('Opened sharing option:', shareUrls[i]);
            return true;
          }
        } catch (e) {
          console.warn('Failed to open sharing option:', shareUrls[i], e);
        }
      }
    }
    
    // If we get here, all sharing attempts failed, but we still have the clipboard copy
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
  cameraContainer.style.opacity = 1;

  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    let mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 2160, height: 2160, facingMode: 'environment' }
    });

    const session = await cameraKit.createSession();
    const lens = await cameraKit.lensRepository.loadLens('20ef7516-0029-41be-a6b2-37a3602e56b6', 'fdd0879f-c570-490e-9dfc-cba0f122699f');
    await session.applyLens(lens, {
      launchParams: {
        greeting_text: `Hey ${rakhiData.brotherName}!`,
        brother_name: `${rakhiData.brotherName}`,
        message: "Share this moment with your sibling on social media!"
      }
    });

    const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
    await session.setSource(source);

    // Set the render size based on the actual screen resolution
    session.source.setRenderSize(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
    session.play();

    // Define liveOutput correctly from the session output
    const liveOutput = session.output.live;

    const canvas = document.getElementById('canvas');
    if (canvas) {
      drawVideoToCanvas(liveOutput, canvas);
    } else {
      cameraContainer.appendChild(liveOutput);
    }

    document.getElementById('captureButton').addEventListener('click', () => captureScreenshot(canvas));
  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
  }
}

function drawVideoToCanvas(videoElement, canvas) {
  const context = canvas.getContext('2d');

  const logo = new Image();
  logo.src = 'Images/logo.png'; // Path to your logo

  // Set the canvas dimensions to match the video
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;

  function drawFrame() {
    // Clear the canvas before drawing
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the video frame on the canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    
   // Calculate the logo dimensions and position based on the given CSS-like properties
   const logoHeight = canvas.height * 0.08;  // 8% of canvas height
   const logoWidth = logo.naturalWidth * (logoHeight / logo.naturalHeight); // Maintain aspect ratio

   const logoX = canvas.width - logoWidth - (canvas.width * 0.01); // 1% from the right
   const logoY = canvas.height * 0.007; // 0.7% from the top

   // Draw the logo on the canvas
   context.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Request the next frame
    requestAnimationFrame(drawFrame);
  }

  // Start drawing frames
  requestAnimationFrame(drawFrame);
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

    logEvent(analytics, 'image_capture');

    const file = new File([blob], 'digital_rakhi.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: 'Digital Rakhi',
        text: 'Check out this cool digital Rakhi!',
      }).then(() => {
        // Redirect to the Thank You page after sharing
        window.location.href = 'thank-your.html';
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    } else {
      downloadImage(blob);
      // Optionally, you can redirect after the download if needed
      // window.location.href = 'thank-your.html';
    }
  }, 'image/png');
}


function downloadImage(blob) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'digital_rakhi.png';
  link.click();

  // Add a delay to ensure the download is initiated before redirecting
  setTimeout(() => {
    window.location.href = 'thank-your.html'; // Redirect to the Thank You page
  }, 3000); // 1-second delay, adjust if needed
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
