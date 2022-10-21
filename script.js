// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.4/firebase-app.js";
import * as rtdb from "https://www.gstatic.com/firebasejs/9.9.4/firebase-database.js";
import { getAuth, signInWithPopup, signInWithRedirect, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.4/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDacaAM015ZKrDOslEe6CIBTZTOnmimtQg",
  authDomain: "speakyomind-f3358.firebaseapp.com",
  databaseURL: "https://speakyomind-f3358-default-rtdb.firebaseio.com",
  projectId: "speakyomind-f3358",
  storageBucket: "speakyomind-f3358.appspot.com",
  messagingSenderId: "553841138135",
  appId: "1:553841138135:web:e73d19c88447fa6ee05392"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let db = rtdb.getDatabase(app);
const auth = getAuth();
const user = auth.currentUser;

let speechesRef = rtdb.ref(db, "/speeches");
let speakersRef = rtdb.ref(db, "/speakers");

function renderLogin() {
  $("#gSignOut").hide();
  $("#speechfeed").hide();
  $("#gSignIn").show();
  $("#sendspeech").hide();
  $("#currSignedIn").hide();
}

function renderPage(loggedIn) {
  let myUid = loggedIn.uid;

  $("#speechfeed").show();
  $("#gSignIn").hide();
  $("#sendspeech").show();

  $("#topbar").prepend(`<div id="currSignedIn" class="p-2"><p>Signed in as <img src=${loggedIn.photoURL} style="width:30px;height:30px;"></div>`);

  sendSpeech(loggedIn);

  rtdb.onChildAdded(speechesRef, (ss) => {
    let sObj = ss.val();
    renderSpeech(sObj, ss.key);
    $(".clap-button").off("click");
    $(".clap-button").on("click", (evt) => {
      let clickedSpeech = $(evt.currentTarget).attr("data-speechid");
      let clapsRef = rtdb.ref(db, "/speeches/"+clickedSpeech+"/data");
      toggleClap(clapsRef, myUid);
    });
  });
}

function toggleClap(speechRef, uid) {
  // speechRef = /speeches/uuid/data
  // This allows us to access claps and clapusers as sObj.claps and sObj.clapusers
  rtdb.runTransaction(speechRef, (sObj) => {
    if (!sObj) {
      sObj = {
        claps: 0,
        clapusers: {},
      };
    }
    if (sObj.claps && sObj.clapusers[uid]) {
      sObj.claps--;
      sObj.clapusers[uid] = null;
    } else {
      sObj.claps++;
      if (!sObj.clapusers) {
        sObj.clapusers = {};
      }
      sObj.clapusers[uid] = true;
    }
    return sObj;
  });
}

let renderSpeech = (sObj, uuid) => {
  $("#allspeeches").prepend(`
  <div class="card mb-3 speech" data-uuid="${uuid}" style="max-width: 540px;">
  <div class="row g-0">
    <div class="col-md-4">
      <img src="${sObj.photo}" class="img-fluid rounded-start" alt="...">
    </div>
    <div class="col-md-8">
      <div class="card-body">
        <h5 class="card-title">${sObj.speaker}</h5>
        <p class="card-text">${sObj.content}</p>
        <button class="btn btn-outline-primary btn-sm clap-button" data-speechid="${uuid}">${sObj.data.claps} claps</button>
        <p class="card-text"><small class="text-muted">Spoken at ${new Date(sObj.timestamp).toLocaleString()}</small></p>
      </div>
    </div>
  </div>
</div>`);
  let clapRef = rtdb.ref(db,"/speeches/"+uuid+"/data/claps");
  rtdb.onValue(clapRef, (ss) => {
    $(`.clap-button[data-speechid=${uuid}]`).html(`${ss.val() || 0} claps`);
  });
};

function signInGoogle() {
  const provider = new GoogleAuthProvider();
  
  signInWithRedirect(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      // ...
    }).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
    });
}

function signOutGoogle() {
  signOut(auth);
}

function sendSpeech(user) {
  $("#speak").on("click", () => {
    var s = $("#speechcontent").val();

		let speech = {
			content: s,
			speaker: user.displayName,
      photo: user.photoURL,
			timestamp: Date.now(),
      data: {
			  claps: 0,
        clapusers: {},
      }
    };

    if (s === "") {
      alert("Enter a speech before sending!");
    }
    else {
      rtdb.push(speechesRef, speech);
      $("#speechcontent").val('');
    }
  });
}

onAuthStateChanged(auth, (user) => {
	if (user) {
		// If there is a user, the following will happen
    renderPage(user);
  }
	else {
    // If there is no user, the speechfeed and ability to speak should be hidden
    renderLogin();
	}
});

$("#gSignIn").on("click", () => {
  signInGoogle();
});

$("#gSignOut").on("click", () => {
  signOut(auth);
});
