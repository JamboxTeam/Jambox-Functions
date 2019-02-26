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

//Sends notification when someone likes your post
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
      .then(function (postdoc) {
        //POST DOC
        if (postdoc.exists && postdoc.data().UserID != data.userId) {
          console.log("postdoc: ", postdoc.data().UserID);
          db.collection("tokens")
            .doc(postdoc.data().UserID)
            .get()
            .then(function (tokendoc) {
              //TOKEN DOC
              console.log("tokenDoc: ", tokendoc.data().token);
              userToken = tokendoc.data().token;
              userRef.get().then(function (userdoc) {
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
      .catch(function (error) {
        console.log("Error getting document:", error);
      });
  });

//Sends notification when someone messages you
exports.onMessageAdd = functions.firestore
  .document("messages/{messageId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();
    var privateChatsRef = db.collection("privatechats").doc(data.chatRoomID);
    var senderRef = db.collection("users").doc(data.senderID);

    return privateChatsRef
      .get()
      .then(function (privateChatDoc) {
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

                  var message = {
                    data: {
                      title: `Jambox`,
                      body: `${username}: ${data.message}`
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
      .catch(function (error) {
        console.log("Error getting document: ", error);
      });
  });

//Sends notification when someone follows you
exports.onFollowAdd = functions.firestore
  .document("relationships/{relationshipId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();
    var tokenRef = db.collection("tokens").doc(data.followedId);
    var followerRef = db.collection("users").doc(data.followerId);

    return tokenRef.get().then(function(tokenDoc) {
    //TOKEN DOC
    console.log(tokenDoc.data());
      var userToken = tokenDoc.data().token;
      followerRef.get().then(function(followerDoc) {
      //FOLLOWER DOC
        var username = followerDoc.data().displayName;

        var message = {
          data: {
            title: `Jambox`,
            body: `${username} started following you!`
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
    })
    .catch(function (error) {
      console.log("Error getting document: ", error);
    });
  });

//Sends notification when someone comments on your post
exports.onCommentAdd = functions.firestore
  .document("comments/{commentId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();
    var postRef = db.collection("posts").doc(data.postId);

    return postRef.get().then(function(postDoc) {
    //POSTDOC
    console.log(postDoc);
    if(postDoc.data().UserID != data.UserID) {
      db.collection("tokens").doc(postDoc.data().UserID).get()
        .then(function(tokenDoc) {
          var userToken = tokenDoc.data().token;

          var message = {
            data: {
              title: `Jambox`,
              body: `Someone commented on your post!!`
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
        })
      }
    })
    .catch(function (error) {
      console.log("Error getting document: ", error);
    });
  });

//Returns follower count for a specific person
exports.getUsersFollowerCount = functions.https
  .onRequest((req, res) => {

  const followedId = req.uid;
  const db = admin.firestore();
  var followers = db.collection("relationships")
  var query = followers.where('followedid', '==', followedId).get()

  return query.length
});