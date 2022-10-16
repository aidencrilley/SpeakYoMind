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

let toggleClap = (speechRef, uid)=>{
  speechRef.transaction((sObj) => {
    if (!sObj) {
      sObj = {claps: 0};
    }
    if (sObj.claps && sObj.likes_by_user[uid]) {
      sObj.claps--;
      sObj.claps_by_user[uid] = null;
    } else {
      sObj.claps++;
      if (!sObj.claps_by_user) {
        sObj.claps_by_user = {};
      }
      sObj.claps_by_user[uid] = true;
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
        <button class="btn btn-outline-primary btn-sm clap-button" data-speechid="${uuid}">${sObj.claps} claps</button>
        <p class="card-text"><small class="text-muted">Spoken at ${new Date(sObj.timestamp).toLocaleString()}</small></p>
      </div>
    </div>
  </div>
</div>`);
  rtbd.ref(db, "/claps").child(uuid).child("claps").on("value", (ss) => {
    $(`.clap-button[data-speechid=${uuid}]`).html(`${ss.val() || 0} claps`);
  });
}

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
			claps: 0,
    }

    if (s === "") {
      alert("Enter a speech before sending!");
    }
    else {
      rtdb.push(speechesRef, speech);
      $("#speechcontent").val('');
    }
  });
}

/*rtdb.onChildAdded(speechesRef, (ss) => {
	let sObj = ss.val();
	renderSpeech(sObj);
});*/

function renderLogin() {
  $("#gSignOut").hide();
  $("#speechfeed").hide();
  $("#gSignIn").show();
  $("#sendspeech").hide();
}

function renderPage(loggedIn) {
  let myUid = loggedIn.uid;

  $("#speechfeed").show();
  $("#gSignIn").hide();
  $("#sendspeech").show();
  sendSpeech(loggedIn);

  rtdb.onChildAdded(speechesRef, (ss) => {
    let sObj = ss.val();
    renderSpeech(sObj, ss.key);
    $(".clap-button").off("click");
    $(".clap-button").on("click", (evt) => {
      let clickedSpeech = $(evt.currentTarget).attr("data-speechid");
      let clapsRef = rtdb.ref(db, "/claps").child(clickedSpeech);
      toggleClap(clapsRef, myUid);
    });
  });
}

onAuthStateChanged(auth, (user) => {
	if (user) {
		// If there is a user, the following will happen
    /*$("#speechfeed").show();
    $("#gSignIn").hide();
    $("#sendspeech").show();
    sendSpeech(user);*/
    renderPage(user);
  }
	else {
    // If there is no user, the speechfeed and ability to speak should be hidden
    /*$("#gSignOut").hide();
    $("#speechfeed").hide();
    $("#gSignIn").show();
    $("#sendspeech").hide();*/
    renderLogin();
	}
});

$("#gSignIn").on("click", () => {
  signInGoogle();
});

$("#gSignOut").on("click", () => {
  signOut(auth);
});
