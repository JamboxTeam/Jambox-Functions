const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

//Adds a created time to created message
exports.addCreatedAtMessage = functions.firestore
  .document("messages/{messageId}")
  .onCreate((snap, context) => {
    const newcreatedAt = new Date();

    return admin.firestore()
      .collection("messages")
      .doc(snap.id)
      .set({
        createdAt: newcreatedAt
      }, { merge: true })
      .catch(err => console.log(err))
  });

//Adds a created time to created comment
exports.addCreatedAtComment = functions.firestore
  .document("comments/{commentId}")
  .onCreate((snap, context) => {
    const newcreatedAt = new Date();

    return admin.firestore()
      .collection("comments")
      .doc(snap.id)
      .set({
        createdAt: newcreatedAt
      }, { merge: true })
      .catch(err => console.log(err))
  });

//Adds a created time to created user
exports.addCreatedAtUser = functions.firestore
  .document("users/{userId}")
  .onCreate((snap, context) => {
    const newcreatedAt = new Date();

    return admin.firestore()
      .collection("users")
      .doc(snap.id)
      .set({
        createdAt: newcreatedAt
      }, { merge: true })
      .catch(err => console.log(err))
  });

//Adds a craeted time to craeted post
exports.addCreatedAtPost = functions.firestore
  .document("posts/{postId}")
  .onCreate((snap, context) => {
    const newcreatedAt = new Date();

    return admin.firestore()
      .collection("posts")
      .doc(snap.id)
      .set({
        createdAt: newcreatedAt
      }, { merge: true })
      .catch(err => console.log(err))
  });

exports.onPostLike = functions.firestore.document("likes/{likeId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();
    var userRef = db.collection("users").doc(data.userId);
    var postRef = db.collection("posts").doc(data.postId);
    var username = '';
    var userToken = '';
    var postUserID;

    postRef.get().then(function (postdoc) {
      if (postdoc.exists) {
        console.log(postdoc)
        postUserID = postdoc.data().UserID;
      }
      else {
        console.log("No such document");
      }
    }).catch(function (error) {
      console.log("Error getting document: ", error);
    });

    db.collection("tokens").doc(postUserID).get().then(function (tokenDoc) {
      if (tokenDoc.exists) {
        console.log(tokenDoc)
        userToken = tokenDoc.data().token;
      }
      else {
        console.log("No such document");
      }
    }).catch(function (error) {
      console.log("Error getting document: ", error);
    });

    userRef.get().then(function (userDoc) {
      if (userDoc.exists) {
        console.log(userDoc)
        username = userDoc.data().displayName;
      }
      else {
        console.log("No such document");
      }
    }).catch(function (error) {
      console.log("Error getting document: ", error);
    });

    var message = {
      data: {
        title: 'Jambox App',
        body: `${username} liked your post!`
      },
      token: userToken
    };
    console.log(message)

    return admin.messaging().send(message)
      .then((respone) => {
        console.log('Successfully sent message:', respone);
      })
      .catch((error) => {
        console.log('Error sending message', error)
      });
  });
