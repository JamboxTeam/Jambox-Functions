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
    const data = snap.data();
    var postId = data.postId;
    var userId;
    var userToken;
    var likerName;
    console.log(data)

    admin.firestore().collection("posts").doc(postId).get().then(post => {
      userId = post.UserID
      console.log(userId)
    });

    admin.firestore().collection("tokens").doc(userId).get().then(token => {
      userToken = token.token
      console.log(userToken)
    });

    admin.firestore().collection("users").doc(data.userId).get().then(user => {
      likerName = user.displayName
      console.log(likerName)
    });

    // const message = {
    //   data: {
    //     title: 'Jambox App',
    //     body: `${likerName} liked your post!`
    //   },
    //   token: userToken
    // };
    // console.log(message)

    const payload = {
      notification: {
        title: 'Jambox App',
        body: likerName + ' liked your post'
      }
    };
    console.log(payload)

    admin.messaging().sendToDevice(userToken, payload)
      .then((respone) => {
        console.log('Successfully sent message:', respone);
      })
      .catch((error) => {
        console.log('Error sending message', error)
      });

    // admin.messaging().send(message)
    //   .then((respone) => {
    //     console.log('Successfully sent message:', respone);
    //   })
    //   .catch((error) => {
    //     console.log('Error sending message', error)
    //   });
  });
