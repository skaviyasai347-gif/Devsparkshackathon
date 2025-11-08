/* ======== 0. FIREBASE SETUP ======== */
// YOUR PERSONAL FIREBASE CONFIG IS NOW PASTED HERE:
const firebaseConfig = {
  apiKey: "AIzaSyCI3kGwJjd9GtRJt8br3m731IVsxlBAWSU",
  authDomain: "curelink-backend.firebaseapp.com",
  projectId: "curelink-backend",
  storageBucket: "curelink-backend.firebasestorage.app",
  messagingSenderId: "705909848845",
  appId: "1:705909848845:web:bbc706d8a4dce12fbcce44",
  measurementId: "G-ZWK3CRDG7B"
};

// Initialize Firebase (using the 'compat' libraries from your HTML)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ======== END OF FIREBASE SETUP ======== */


// This function runs when the entire page content is loaded
document.addEventListener('DOMContentLoaded', () => {

    /* ======== 1. LOGIC FOR: index.html (Splash Screen) ======== */
    // This makes the first splash page clickable.
    const splashPage = document.querySelector('.splash-page');
    if (splashPage) {
        splashPage.addEventListener('click', () => {
            // CORRECTED FLOW: Go to login.html first!
            window.location.href = 'login.html';
        });
    }

    /* ======== 2. LOGIC FOR: login.html (Login Form) ======== */
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        
        // --- Logic for User/Admin toggle ---
        const roleSelector = document.querySelector('.role-selector');
        if (roleSelector) {
            const roleButtons = document.querySelectorAll('.role-btn');
            roleSelector.addEventListener('click', (e) => {
                const clickedButton = e.target.closest('.role-btn');
                if (!clickedButton) return;
                roleButtons.forEach(btn => btn.classList.remove('active'));
                clickedButton.classList.add('active');
            });
        }

        // --- Firebase Sign Up & Login Logic ---
        loginForm.addEventListener('submit', (e) => {
            // 1. Stop the form from submitting normally
            e.preventDefault();

            // 2. Get all values from the form
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // 3. --- TRY TO SIGN UP THE NEW USER ---
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Sign up was successful!
                    const user = userCredential.user;

                    // 4. NOW, save their username to the database (Firestore)
                    // We use user.uid as the unique document ID
                    db.collection("users").doc(user.uid).set({
                        username: username,
                        email: email
                    })
                    .then(() => {
                        // Database save was successful!
                        
                        // 5. Save info for the welcome message
                        sessionStorage.setItem('curelink_username', username);
                        sessionStorage.setItem('curelink_userid', user.uid);
                        
                        // 6. Redirect to home page
                        alert('Account created successfully! Welcome!');
                        window.location.href = 'home.html';
                    })
                    .catch((dbError) => {
                        // Handle database save error
                        console.error("Error writing to database: ", dbError);
                        alert('Account created, but failed to save username: ' + dbError.message);
                    });

                })
                .catch((authError) => {
                    // Sign up failed. Let's see why...
                    
                    if (authError.code === 'auth/email-already-in-use') {
                        // --- 5. IF EMAIL EXISTS, TRY TO LOG IN INSTEAD ---
                        auth.signInWithEmailAndPassword(email, password)
                            .then((userCredential) => {
                                // Login was successful!
                                const user = userCredential.user;
                                
                                // 6. Fetch their saved username from the database
                                db.collection("users").doc(user.uid).get()
                                    .then((doc) => {
                                        if (doc.exists) {
                                            const savedUsername = doc.data().username;
                                            
                                            // 7. Save info for the welcome message
                                            sessionStorage.setItem('curelink_username', savedUsername);
                                            sessionStorage.setItem('curelink_userid', user.uid);
                                            
                                            // 8. Redirect to home page
                                            window.location.href = 'home.html';
                                        } else {
                                            // This case is rare, but good to handle
                                            alert('Logged in, but no user data found! Using email as name.');
                                            sessionStorage.setItem('curelink_username', email);
                                            sessionStorage.setItem('curelink_userid', user.uid);
                                            window.location.href = 'home.html';
                                        }
                                    })
                                    .catch((dbError) => {
                                         alert('Login success, but failed to fetch username: ' + dbError.message);
                                    });
                            })
                            .catch((loginError) => {
                                // Login failed (e.g., wrong password)
                                alert('Login failed: ' + loginError.message);
                            });
                        
                    } else {
                        // Another sign-up error (e.g., "Password should be at least 6 characters")
                        alert('Sign-up failed: ' + authError.message);
                    }
                });
        });
    }

    /* ======== 3. LOGIC FOR: ALL Dashboard Pages (Header & Menu) ======== */
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    
    if (hamburger && sidebar) {
        
        // --- Logic for Hamburger Menu ---
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // --- Logic for displaying username ---
        const usernameSpan = document.getElementById('welcome-username');
        const useridSpan = document.getElementById('welcome-userid');

        // 1. Get the saved name and ID from session storage
        const savedUsername = sessionStorage.getItem('curelink_username');
        const savedUserid = sessionStorage.getItem('curelink_userid');

        // 2. Display them in the header
        if (usernameSpan && savedUsername) {
            // If a name was saved, display it
            usernameSpan.textContent = savedUsername;
        } else if (usernameSpan) {
            // If no name was found (e.g., user went to home.html directly)
            usernameSpan.textContent = 'Guest';
        }
        
        if (useridSpan && savedUserid) {
            useridSpan.textContent = `ID: ${savedUserid}`;
        } else if (useridSpan) {
            // show only first 10 chars of ID
            useridSpan.textContent = 'ID: 00000';
        }
    }

    /* ======== 4. LOGIC FOR: ALL Dashboard Pages (Active Link Highlighter) ======== */
    // This highlights the correct link in the sidebar.
    
    // Get the current page's filename (e.g., "disease.html")
    const currentPage = window.location.pathname.split('/').pop();
    const sidebarLinks = document.querySelectorAll('.sidebar-menu li a');

    sidebarLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        // If the link's href matches the current page, make it 'active'
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    /* ======== 5. LOGIC FOR: upload.html (Drag & Drop) ======== */
    // This adds interactivity to the file upload box.
    const uploadBox = document.querySelector('.upload-box');
    if (uploadBox) {
        const fileInput = document.getElementById('symptom-upload');
        const uploadText = uploadBox.querySelector('p');
        
        // Click the hidden file input when the box (but not the button) is clicked
        uploadBox.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                fileInput.click();
            }
        });
        
        // Handle file selection
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                uploadText.textContent = `File selected: ${fileInput.files[0].name}`;
            }
        });
        
        // Add drag & drop visual feedback
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault(); // This is necessary to allow a drop
            uploadBox.style.backgroundColor = '#f0f9ff';
            uploadBox.style.borderColor = 'var(--primary-color)';
        });
        
        uploadBox.addEventListener('dragleave', () => {
            uploadBox.style.backgroundColor = '#fdfdff';
            uploadBox.style.borderColor = 'var(--border-color)';
        });
        
        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault(); // Prevent the browser from opening the file
            uploadBox.style.backgroundColor = '#fdfdff';
            uploadBox.style.borderColor = 'var(--border-color)';
            
            // Set the file input's files to the files that were dropped
            fileInput.files = e.dataTransfer.files;
            
            // Update the text
            if (fileInput.files.length > 0) {
                uploadText.textContent = `File selected: ${fileInput.files[0].name}`;
            }
        });
    }

});