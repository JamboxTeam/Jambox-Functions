const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

//Adds a created time to created message
exports.addCreatedAtMessage = functions.firestore
  .document("messages/{messageId}")
  .onCreate((snap, context) => {
    const newcreatedAt = new Date();

    return admin
      .firestore()
      .collection("messages")
      .doc(snap.id)
      .set(
        {
          createdAt: newcreatedAt
        },
        { merge: true }
      )
      .catch(err => console.log(err));
  });

//Adds a created time to created comment
exports.addCreatedAtComment = functions.firestore
  .document("comments/{commentId}")
  .onCreate((snap, context) => {
    const newcreatedAt = new Date();

    return admin
      .firestore()
      .collection("comments")
      .doc(snap.id)
      .set(
        {
          createdAt: newcreatedAt
        },
        { merge: true }
      )
      .catch(err => console.log(err));
  });

//Adds a created time to created user
exports.addCreatedAtUser = functions.firestore
  .document("users/{userId}")
  .onCreate((snap, context) => {
    const newcreatedAt = new Date();

    return admin
      .firestore()
      .collection("users")
      .doc(snap.id)
      .set(
        {
          createdAt: newcreatedAt
        },
        { merge: true }
      )
      .catch(err => console.log(err));
  });

//Adds a craeted time to craeted post
exports.addCreatedAtPost = functions.firestore
  .document("posts/{postId}")
  .onCreate((snap, context) => {
    const newcreatedAt = new Date();

    return admin
      .firestore()
      .collection("posts")
      .doc(snap.id)
      .set(
        {
          createdAt: newcreatedAt
        },
        { merge: true }
      )
      .catch(err => console.log(err));
  });

exports.onPostLike = functions.firestore
  .document("likes/{likeId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();
    var userRef = db.collection("users").doc(data.userId);
    var postRef = db.collection("posts").doc(data.postId);
    var userToken = "";

    return postRef
      .get()
      .then(function(postdoc) {
        //POST DOC
        if (postdoc.exists) {
          console.log("postdoc: ", postdoc.data().UserID);
          db.collection("tokens")
            .doc(postdoc.data().UserID)
            .get()
            .then(function(tokendoc) {
              //TOKEN DOC
              console.log("tokenDoc: ", tokendoc.data().token);
              userToken = tokendoc.data().token;
              userRef.get().then(function(userdoc) {
                //USER DOC
                console.log("userDoc: ", userdoc);
                let username = userdoc.data().displayName;
                console.log("username: ", username);

                var message = {
                  data: {
                    title: "Jambox App",
                    body: `${username} liked your post!`
                  },
                  token: userToken
                };
                console.log(message);

                admin
                  .messaging()
                  .send(message)
                  .then(respone => {
                    console.log("Successfully sent message:", respone);
                  })
                  .catch(error => {
                    console.log("Error sending message", error);
                  });
              });
            });
        } else {
          console.log("No such document!");
        }
      })
      .catch(function(error) {
        console.log("Error getting document:", error);
      });
  });

exports.onMessageAdd = functions.firestore
  .document("messages/{messageId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();
    var privateChatsRef = db.collection("privatechats").doc(data.chatRoomID);
    var senderRef = db.collection("users").doc(data.senderID);

    return privateChatsRef
      .get()
      .then(function(privateChatDoc) {
        //PRIVATE CHAT DOC
        if (privateChatDoc.exists) {
          console.log("privatechatdoc ", privateChatDoc.data());
          privateChatDoc.data().members.forEach(member => {
            if(member != data.senderID){
            db.collection("tokens")
              .doc(member)
              .get()
              .then(function(tokenDoc) {
                //TOKEN DOC
                console.log("tokenDoc", tokenDoc.data());
                let userToken = tokenDoc.data().token;
                senderRef.get().then(function(senderDoc) {
                  //SENDER DOC
                  console.log("senderDoc", senderDoc.data());
                  let username = senderDoc.data().displayName;

                  let time = new Date().setSeconds() - createdAt.seconds;

                  var message = {
                    data: {
                      title: `${username}`,
                      body: `${data.message} ${time}`
                    },
                    token: userToken
                  };
                  console.log(message);

                  admin
                    .messaging()
                    .send(message)
                    .then(respone => {
                      console.log("Successfully sent message:", respone);
                    })
                    .catch(error => {
                      console.log("Error sending message", error);
                    });
                });
              });
            }
              //end loop
          });
        } else {
          console.log("No such document");
        }
      })
      .catch(function(error) {
        console.log("Error getting document: ", error);
      });
  });
