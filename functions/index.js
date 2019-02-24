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
  .onCreate((snapshot, context) => {
        const data = snap.data();
    console.log(data)
    const post = admin.firestore().collection("posts").doc(data.postId).get();
    const userId = post.UserID

    const token = admin.firestore().collection("tokens").doc(userId).get();
    const userToken = token.token

    const liker = admin.firestore().collection("users").doc(data.userId).get();
    const likerName = liker.displayName


    const payload = {
      notification: {
        title: 'Jambox App',
        body: likerName + ' liked your post'
      }
    };

    admin.messaging().sendToDevice(userToken, payload)
  });
