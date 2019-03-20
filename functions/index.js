"use strict";

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const express = require("express");
const cookieParser = require("cookie-parser")();
const cors = require("cors")({ origin: true });
const app = express();

const validateFirebaseIdToken = (req, res, next) => {
  console.log("Check if request is authorized with Firebase ID token");

  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")) &&
    !(req.cookies && req.cookies.__session)
  ) {
    console.error(
      "No Firebase ID token was passed as a Bearer token in the Authorization header.",
      "Make sure you authorize your request by providing the following HTTP header:",
      "Authorization: Bearer <Firebase ID Token>",
      'or by passing a "__session" cookie.'
    );
    res.status(403).send("Unauthorized");
    return;
  }
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else if (req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send("Unauthorized");
    return;
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedIdToken => {
      console.log("ID Token correctly decoded", decodedIdToken);
      req.user = decodedIdToken;
      return next();
    })
    .catch(error => {
      console.error("Error while verifying Firebase ID token:", error);
      res.status(403).send("Unauthorized");
    });
};

app.use(cors);
app.use(cookieParser);
app.use(validateFirebaseIdToken);

app.get("/hello", (req, res) => {
  const newDate = new Date();
  res.status(200).json({
    date: newDate
  });
  res.send(`seconds: ${newDate.getSeconds()}`);
});

exports.app = functions.https.onRequest(app);
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

//Adds tags from a post to tags collection
exports.onPostCreate = functions.firestore
  .document("posts/{postId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();

    return data.tags.forEach(tag => {
      console.log("adding tag", tag);
      db.collection("tags").doc(tag.toLowerCase()).set({
        tag: tag
      });
    });
  });

//Sends notification when someone @'s you in a post
exports.onPostCreateAtting = functions.firestore
  .document("posts/{postId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();
    var userToken = "";
    var username;
    var value = "oof";
    var userRef = db.collection("users").doc(data.userID);

    userRef.get().then((postUserDoc) => {
      username = postUserDoc.data().displayName;
    });



    data.taggedUsers.forEach(taggedUser => {
      db.collection("users")
      .doc(taggedUser)
      .get()
      .then(function(userDoc) {
        //USER DOC
        console.log("userDoc", userDoc.data());

        db.collection("tokens").doc(userDoc.data().uid)
        .get()
        .then(function(tokenDoc) {
          //TOKEN DOC
          console.log("tokenDoc", tokenDoc.data());
          userToken = tokenDoc.data().token;

          var message = {
            data: {
              title: `Jambox`,
              body: `You were tagged in a post by ${username}`
            },
            token: userToken
          };
          console.log(message);

          admin
            .messaging()
            .send(message)
            .then(respone => {
              console.log("Successfully sent message:", respone);
              value = "nice";
            })
            .catch(error => {
              console.log("Error sending message", error);
              value = "oof";
            });
            admin
                  .firestore()
                  .collection("notifications")
                  .add({
                    userId: userDoc.data().uid,
                    createdAt: newcreatedAt,
                    body: `You were tagged in a post by ${username}`,
                    type: "tagged",
                    read: false
              });
        });
      })
      .catch(function(error) {
        console.log("Error getting document:", error);
      });

    });

    return value;
  });

//Sends notification when someone likes your post
exports.onPostLike = functions.firestore
  .document("likes/{likeId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();
    const newcreatedAt = new Date();
    var userRef = db.collection("users").doc(data.userId);
    var postRef = db.collection("posts").doc(data.postId);
    var userToken = "";

    return postRef
      .get()
      .then(function(postdoc) {
        //POST DOC
        if (postdoc.data().UserID != data.userId) {
          console.log("postdoc: ", postdoc.data());
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

                var message = {
                  data: {
                    title: "Jambox",
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
                admin
                  .firestore()
                  .collection("notifications")
                  .add({
                    userId: postdoc.data().UserID,
                    createdAt: newcreatedAt,
                    body: `${username} liked your post!`,
                    type: "like",
                    read: false
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

//Sends notification when someone messages you
exports.onMessageAdd = functions.firestore
  .document("messages/{messageId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();
    var privateChatsRef = db.collection("privatechats").doc(data.chatRoomID);
    var groupChatsRef = db.collection("groupchats").doc(data.chatRoomID);
    var senderRef = db.collection("users").doc(data.senderID);

    return privateChatsRef
      .get()
      .then(function(privateChatDoc) {
        //PRIVATE CHAT DOC
        if (privateChatDoc.exists) {
          console.log("privatechatdoc ", privateChatDoc.data());
          privateChatDoc.data().members.forEach(member => {
            if (member != data.senderID) {
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
                    admin
                      .firestore()
                      .collection("notifications")
                      .add({
                        userId: member,
                        createdAt: newcreatedAt,
                        body: `${username}: ${data.message}`,
                        chatRoomID: data.chatRoomID,
                        type: "message",
                        read: false
                      });
                    
                  });
                });
            }
            //end loop
          });
        } else {
          groupChatsRef.get().then(function(groupChatDoc) {
            console.log("groupchatdoc ", groupChatDoc.data());
            groupChatDoc.data().members.forEach(member => {
              if (member != data.senderID) {
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
                      admin
                        .firestore()
                        .collection("notifications")
                        .add({
                          userId: member,
                          createdAt: newcreatedAt,
                          body: `${username}: ${data.message}`,
                          chatRoomID: data.chatRoomID,
                          type: "message",
                          read: false
                        });
                    });
                  });
              }
              //end loop
            });
          });
        }
      })
      .catch(function(error) {
        console.log("Error getting document: ", error);
      });
  });

//Sends notification when someone follows you
exports.onFollowAdd = functions.firestore
  .document("relationships/{relationshipId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();
    const newcreatedAt = new Date();
    var tokenRef = db.collection("tokens").doc(data.followedId);
    var followerRef = db.collection("users").doc(data.followerId);

    return tokenRef
      .get()
      .then(function(tokenDoc) {
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
          admin
            .firestore()
            .collection("notifications")
            .add({
              userId: data.followedId,
              createdAt: newcreatedAt,
              body: `${username} started following you!`,
              type: "follow",
              read: false
            });
        });
      })
      .catch(function(error) {
        console.log("Error getting document: ", error);
      });
  });

//Sends notification when someone comments on your post
exports.onCommentAdd = functions.firestore
  .document("comments/{commentId}")
  .onCreate((snap, context) => {
    const db = admin.firestore();
    const data = snap.data();
    const newcreatedAt = new Date();
    var postRef = db.collection("posts").doc(data.postId);

    return postRef
      .get()
      .then(function(postDoc) {
        //POSTDOC
        console.log(postDoc.data());
        if (postDoc.data().UserID != data.userID) {
          db.collection("tokens")
            .doc(postDoc.data().UserID)
            .get()
            .then(function(tokenDoc) {
              var userToken = tokenDoc.data().token;
              var username = data.postedBy;

              var message = {
                data: {
                  title: `Jambox`,
                  body: `${username} commented on your post!`
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

              admin
                .firestore()
                .collection("notifications")
                .add({
                  userId: postDoc.data().UserID,
                  createdAt: newcreatedAt,
                  body: `${username} commented on your post!`,
                  type: "comment",
                  read: false
                });
            });
        }
      })
      .catch(function(error) {
        console.log("Error getting document: ", error);
      });
  });

//Returns follower count for a specific person
exports.getUsersFollowerCount = functions.https.onRequest((req, res) => {
  const followedId = req.uid;
  const db = admin.firestore();
  var followers = db.collection("relationships");
  var query = followers.where("followedid", "==", followedId).get();

  return query.length;
});
