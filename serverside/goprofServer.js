console.log("starting up GoProf server");

var io = require("socket.io")();
var https = require("https");
var fs = require("fs");
var mysql = require("mysql");
var nodemailer = require("nodemailer");
const request = require("request");
//var htmlToText = require('nodemailer-html-to-text').htmlToText;
var md5 = require("md5");
var moment = require("moment");
moment.locale("fr");

var stripe = require("stripe")("sk_live_6OjfNR3fOLHyESBCJXeKlcVm");

var paymentInProgress = {}; //contient les id des hours en cours de paiement, evite les double paiements

//twilio
var AccessToken = require("twilio").jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;

//var graph = require('fbgraph'); //facebook api

//Urban Airship Push notifications
//var UA = require("urban-airship");
//var ua = new UA("8w3tVUH4Sr2rrFUTNaj8Uw", "291GEau_QmOAQJzCnjTyfw", "YyHt3xqeTLaZlOWVwfyyQQ");

//Notifications
var onesignal = require("simple-onesignal");
onesignal.configure(
  "3612cea5-dbb2-4869-95e5-3aacef3c9cea",
  "YTQ5OGVjNzgtOTNhMy00NGVmLTg4NmMtMzA0ODgyOTQ1NjNk"
);

//TokBox
var OpenTok = require("opentok"),
  opentok = new OpenTok("45819672", "4f3add85b76dd0221c36f987990371fd7b615d6a");
//create session
/*
var testSession;
opentok.createSession(function(err, session) {
  if (err) return console.log(err);
  testSession = session;
});
*/

//13 07 33

/*
var options = {
    key:    fs.readFileSync('../ssl/keys/b3552_3e7c1_5d626d7e71e6a39f50139db8ca18ec9f.key'),
    cert:   fs.readFileSync('../ssl/certs/goprof_fr_b3552_3e7c1_1532119663_7f8d33bd36c5c062c40755f0a2ec9776.crt')
    //ca: [ fs.readFileSync('ssl/COMODORSADomainValidationSecureServerCA.crt'), fs.readFileSync('ssl/COMODORSAAddTrustCA.crt'), fs.readFileSync('ssl/AddTrustExternalCARoot.crt') ]

};

*/

var twilio = {
  account_sid: "ACe813dca827aa393c516a0105fc58b355",
  api_key: "SK068271d0802104dbf745ba7026686689",
  api_secret: "W3teSneT9yzP4DoXmKWYsZupkIAxaUuy",
};

var options = {
  ca: fs.readFileSync("goprof_fr.ca-bundle"),
  key: fs.readFileSync("goprof_fr.key"),
  cert: fs.readFileSync("goprof_fr.crt"),
};

//mailTransporter

var transporter = nodemailer.createTransport({
  host: "whm.limesky.net",
  port: 465,
  auth: { user: "goprof@goprof.fr", pass: "o0)cBGW7~gI+" },
});

//sessions
var sessions = {};

//Database setup

// var db = mysql.createConnection({
//   host: "localhost",
//   user: "goprof_server",
//   password: "RVTEpg2qyb",
//   database: "goprof_app",
// });
var db = mysql.createConnection({
  host: "mr473386-001.dbaas.ovh.net",
  user: "renaud",
  password: "Renaud007",
  database: "goprof_appli",
  port: 35755,
});
db.connect(function (err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  console.log("connected as id " + db.threadId);
});
db.query("SET NAMES 'utf8';", function (err, rows, fields) {});

//create socket io server port 8910
var server = require("https").createServer(options, (req, res) => {
  var urls = req.url.split("/").filter((elm) => elm);
  if (urls[0] == "rp") {
    //reset password
    db.query(
      "select * from `users` WHERE id = ? ;",
      [urls[1] * 1],
      (err, rows, fields) => {
        if (rows.length == 1) {
          if (md5(rows[0].mail + rows[0].pass) == urls[2]) {
            // ok!
            //créer new pass
            var newpass = generatepass(6);
            //update db
            db.query("UPDATE `users` SET `pass`= ? WHERE `id`= ? ;", [
              md5(newpass + "somesalt"),
              rows[0].id,
            ]);

            //envoyer mail
            var message = {
              from: "goprof@goprof.fr",
              to: rows[0].mail,
              subject: "Goprof - récupération mot de passe",
              html:
                "Nous avons bien noté le changement de votre mot de passe. Votre nouveau mot de passe est : " +
                newpass +
                " . N'oubliez pas de le changer lors de votre prochaine utilisation de goprof",
            };
            console.log(transporter.sendMail(message));

            //afficher message
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(
              "Nous venons de vous envoyer votre nouveau mot de passe par e-mail, n'oubliez pas le le changer une fois connecté. \n"
            );
          } else {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(
              "Le token de sécurité est invalide, merci de contacter Goprof\n"
            );
          }
        }
      }
    );
  }
});
server.listen(8840);
var io = require("socket.io").listen(server);

//store sockets
var sockets = [];

//drawing lines

var pages = [];
var lastPageID = 0;

//First respond, create default socket data & add to sockets
io.sockets.on("connection", function (socket) {
  console.log(" ----------------");
  console.log("| new connection |");
  console.log(" ----------------");

  sockets.push(socket);

  socket.user = { id: 0 };

  //socket events

  socket.on("register", _register);

  socket.on("login", _login);
  socket.on("connectData", _connectData);
  socket.on("setUserData", _setUserData);
  socket.on("setUserProfilePic", _setUserProfilePic);

  socket.on("getStripeData", _getStripeData);
  socket.on("setStripeData", _setStripeData);

  socket.on("logout", _logout);
  socket.on("disconnect", _disconnect);
  socket.on("resetpass", _resetpass);

  socket.on("drawLine", _drawLine);
  socket.on("createPage", _createPage);
  socket.on("switchPage", _switchPage);
  socket.on("undoDraw", _undoDraw);

  socket.on("getAgenda", _getAgenda);
  socket.on("getDispo", _getDispo);
  socket.on("getNotifications", _getNotifications);
  socket.on("getPages", _getPages);
  socket.on("openPage", _openPage);

  socket.on("saveToFiles", _saveToFiles);

  /* Credit cards */
  socket.on("addNewCreditCard", _addNewCreditCard);
  socket.on("deleteCreditCard", _deleteCreditCard);
  socket.on("getCreditCards", _getCreditCards);

  /* instant messaging */
  socket.on("getConversations", _getConversations);
  socket.on("newConversation", _newConversation);
  socket.on("getMessages", _getMessages);
  socket.on("sendMessage", _sendMessage);

  /* Video library */
  socket.on("getVideos", _getVideos);

  /* Profs */
  socket.on("getProfs", _getProfs);
  socket.on("reserver", _reserver);
  socket.on("getProfAgenda", _getProfAgenda);
  socket.on("addhours", _addhours);
  socket.on("deletehour", _deletehour);
  socket.on("newQuote", _newQuote);
  socket.on("getQuote", _getQuote);

  socket.on("getDemandes", _getDemandes);
  socket.on("answerDemande", _answerDemande);

  //dashboardEvents
  socket.on("adm_login", _adm_login);
  socket.on("adm_getModel", _adm_getModel);
  socket.on("adm_saveDBRow", _adm_saveDBRow);
  socket.on("adm_saveNewPage", _adm_saveNewPage);
  socket.on("adm_deletePage", _adm_deletePage);

  //Connect from game
  socket.on("game_login", _game_login);
  socket.on("game_savestars", _game_savestars);
});

/* Socket eventActions  this = calling socket */

function _register(post) {
  console.log(post);

  if (!validateEmail(post.mail)) {
    this.emit("userAlert", { message: "L'adresse e-mail n'est pas correct" });
    return;
  }

  db.query(
    "select * from `users` WHERE mail = ? ;",
    [post.mail],
    (err, rows, fields) => {
      if (rows.length > 0) {
        this.emit("userAlert", {
          message: "l'adresse mail est déja utilisé pour un compte goProf",
        });
      } else {
        //everything ok, add to db and send loginOk to user

        //ELEVE :

        if (post.prof == 0)
          db.query(
            "INSERT INTO `users` (`mail`, `pass`, `fname`, `lname`, `phone`, `classe`, `schoolcode`, `need_math`, `need_histoire`, `need_francais`, `need_geo`, `need_anglais`, `need_espagnol`, `need_allemand`, `need_physique`, `need_svt`, `dob_d`, `dob_m`, `dob_y`, `address_line1`, `address_city`, `address_postal_code` ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);",
            [
              post.mail,
              md5(post.pass + "somesalt"),
              post.fname,
              post.lname,
              post.phone,
              post.classe,
              post.schoolcode,
              post.need_math,
              post.need_histoire,
              post.need_francais,
              post.need_geo,
              post.need_anglais,
              post.need_espagnol,
              post.need_allemand,
              post.need_physique,
              post.need_svt,
              post.dob_d,
              post.dob_m,
              post.dob_y,
              post.address_line1,
              post.address_city,
              post.address_postal_code,
            ],
            (err, info) => {
              //créer le compte sur stripe pour attacher les payments

              stripe.customers.create(
                {
                  email: post.mail,
                  description: "goprof#" + info.insertId,
                },
                (err, customer) => {
                  db.query(
                    "UPDATE `users` SET `stripe_id`= ? WHERE `id`= ? ;",
                    [customer.id, info.insertId],
                    (err, rows, fields) => {
                      //login
                      db.query(
                        "select * from `users` WHERE mail = ? AND pass = ? ;",
                        [post.mail, md5(post.pass + "somesalt")],
                        (err, rows, fields) => {
                          if (rows.length == 1) {
                            this.user = rows[0];
                            tickLastSeenUser(this.user.id);

                            //remove serverside data
                            delete this.user.pass;
                            this.user.pass = "dummypass";
                            this.user.pass2 = "dummypass";

                            //add socket session id for game
                            this.user.sid = this.user.id + Date.now();

                            this.emit("loginOK", this.user);

                            //notifier utilisateur
                            this.emit("userAlert", {
                              message: "Compte crée avec succès!",
                            });

                            //ajouter le compte au devices pour un autoconnect la prochaine fois
                            if (this.uuid)
                              db.query(
                                "UPDATE `devices` SET `user_id`= ? WHERE `uuid`= ? ;",
                                [rows[0].id, this.uuid]
                              );
                          }
                        }
                      );
                    }
                  );
                }
              );
            }
          );

        //Prof :

        if (post.prof == 1)
          db.query(
            "INSERT INTO `users` (`prof`,`mail`, `pass`, `fname`, `lname`, `classe`, `schoolcode`, `need_math`, `need_histoire`, `need_francais`, `need_geo`, `need_anglais`, `need_espagnol`, `need_allemand`, `need_physique`, `need_svt`, `dob_d`, `dob_m`, `dob_y`, `address_line1`, `address_city`, `address_postal_code`, `bio` ) VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);",
            [
              post.mail,
              md5(post.pass + "somesalt"),
              post.fname,
              post.lname,
              "PROF",
              post.schoolcode,
              post.need_math,
              post.need_histoire,
              post.need_francais,
              post.need_geo,
              post.need_anglais,
              post.need_espagnol,
              post.need_allemand,
              post.need_physique,
              post.need_svt,
              post.dob_d,
              post.dob_m,
              post.dob_y,
              post.address_line1,
              post.address_city,
              post.address_postal_code,
              post.bio,
            ],
            (err, info) => {
              //créer le compte sur stripe pour attacher les payments

              stripe.accounts.create(
                {
                  country: "FR",
                  type: "custom",
                  account_token: post.stripeToken.id,
                },
                (err, account) => {
                  console.log(account);
                  console.log(err);
                  db.query(
                    "UPDATE `users` SET `stripe_account`= ? WHERE `id`= ? ;",
                    [account.id, info.insertId],
                    (err, rows, fields) => {
                      //login
                      db.query(
                        "select * from `users` WHERE mail = ? AND pass = ? ;",
                        [post.mail, md5(post.pass + "somesalt")],
                        (err, rows, fields) => {
                          if (rows.length == 1) {
                            this.user = rows[0];
                            tickLastSeenUser(this.user.id);

                            //remove serverside data
                            delete this.user.pass;
                            this.user.pass = "dummypass";
                            this.user.pass2 = "dummypass";

                            //add socket session id for game
                            this.user.sid = this.user.id + Date.now();

                            this.emit("loginOK", this.user);

                            //notifier utilisateur
                            this.emit("userAlert", {
                              message: "Compte crée avec succès!",
                            });

                            //ajouter le compte au devices pour un autoconnect la prochaine fois
                            if (this.uuid)
                              db.query(
                                "UPDATE `devices` SET `user_id`= ? WHERE `uuid`= ? ;",
                                [rows[0].id, this.uuid]
                              );
                          }
                        }
                      );
                    }
                  );
                }
              );
            }
          );
      }
    }
  );
}

function _setUserData(post) {
  console.log(post);
  //update local socket data
  this.user.lname = post.lname;
  this.user.fname = post.fname;
  this.user.mail = post.mail;
  this.user.bio = post.bio;
  this.user.classe = post.classe;
  this.user.need_math = post.need_math;
  this.user.need_histoire = post.need_histoire;
  this.user.need_francais = post.need_francais;
  this.user.need_geo = post.need_geo;
  this.user.need_anglais = post.need_anglais;
  this.user.need_espagnol = post.need_espagnol;
  this.user.need_allemand = post.need_allemand;
  this.user.need_physique = post.need_physique;
  this.user.need_svt = post.need_svt;

  this.user.hour_rate = post.hour_rate;
  this.user.available = post.available;

  db.query(
    "UPDATE `users` SET `lname`= ?,`fname`= ?,`mail`= ?,`bio`= ?,`hour_rate`= ?,`classe`= ?,`need_math`= ?,`need_histoire`= ?,`need_francais`= ?,`need_geo`= ?,`need_anglais`= ?,`need_espagnol`= ?,`need_allemand`= ?,`need_physique`= ?,`need_svt`= ?,`available`= ? WHERE `id`= ?;",
    [
      post.lname,
      post.fname,
      post.mail,
      post.bio,
      post.hour_rate,
      post.classe,
      post.need_math,
      post.need_histoire,
      post.need_francais,
      post.need_geo,
      post.need_anglais,
      post.need_espagnol,
      post.need_allemand,
      post.need_physique,
      post.need_svt,
      post.available,
      this.user.id,
    ],
    (err, info) => {
      if (err) console.log(err);
      this.emit("userAlert", {
        message: "Merci, Vos données ont étés mis a jour.",
      });
    }
  );

  //mot de passe
  if (post.pass != "dummypass")
    db.query(
      "UPDATE `users` SET `pass`= ?  WHERE `id`= ?;",
      [md5(post.pass + "somesalt"), this.user.id],
      (err, info) => {
        if (err) console.log(err);
      }
    );
}

function _pushNotification(userID, message) {
  //message est un objet qui contient .fr .nl et .en
  //pour du multilingue, ajouter le filter language https://documentation.onesignal.com/v3.0/reference#create-notification

  //console.log('sending push message to userID'+userID);
  //console.log(message);

  /*
	onesignal.sendMessage({
		contents: {en : message, fr:message }, 
		filters : [{field:'tag', relation:'=', key:'userid', value:userID}]
	}, function(err, resp) {
		if(err) {
			console.log(' error sending push notification ');
			console.log(err)
		} else {
			console.log('successfully sent');
			console.log(resp);
		}
	});
*/

  console.log("send notif");

  var data = {
    app_id: "3612cea5-dbb2-4869-95e5-3aacef3c9cea",
    contents: { en: message, fr: message },
    filters: [{ field: "tag", relation: "=", key: "userid", value: userID }],
    ios_badgeType: "SetTo",
    ios_badgeCount: 1,
    content_available: true,
  };

  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: "Basic YTQ5OGVjNzgtOTNhMy00NGVmLTg4NmMtMzA0ODgyOTQ1NjNk",
    },
  };

  var https = require("https");
  var req = https.request(options, function (res) {
    res.on("data", function (data) {
      console.log("Response:");
      console.log(JSON.parse(data));
    });
  });

  req.on("error", function (e) {
    console.log("ERROR:");
    console.log(e);
  });

  req.write(JSON.stringify(data));
  req.end();
}

function _mailNotification(userID, text) {
  db.query(
    "SELECT * FROM `users` WHERE id = ?;",
    [userID],
    (err, rows, fields) => {
      if (rows && rows.length == 1) {
        var message = {
          from: "goprof@goprof.fr",
          to: rows[0].mail,
          subject: "Goprof - notification",
          html:
            "<p>Salut !<br>" +
            text +
            "<br><br>Bonne journée !<br><strong>L'equipe GOPROF</strong></p>",
        };
        transporter.sendMail(message);
      }
    }
  );
}

function _addNewCreditCard(post) {
  console.log("adding credit card");
  console.log(post);
  stripe.customers.createSource(
    this.user.stripe_id,
    {
      source: post.token,
    },
    (err, card) => {
      console.log(err);
      console.log(card);
      _getCreditCards.call(this);
    }
  );
}

function _deleteCreditCard(post) {
  console.log("adding credit card");
  console.log(post);
  stripe.customers.deleteSource(
    this.user.stripe_id,
    post.card_id,
    (err, confirm) => {
      _getCreditCards.call(this);
    }
  );
}

function _getCreditCards() {
  stripe.customers.listSources(this.user.stripe_id,  {object: 'card', limit: 10}, (err, cards) => {
    console.log(cards);
    if (!cards) cards = [];
    console.log(cards);
    this.emit("updateModel", {
      name: "creditCardsModel",
      data: { cards: cards },
    });
  });
}

function _setUserProfilePic(post) {
  console.log("setUserProfilePic..");
  if (post.image.substr(0, 4) == "data") {
    //base64 data! we have new image, would be http if not
    console.log("yes data!");
    if (this.user.id > 0) {
      fs.writeFile(
        "../public_html/profilepics/" + this.user.id + ".jpg",
        post.image.replace(/^data:image\/jpg;base64,/, ""),
        "base64",
        (err) => {
          console.log(err);
          this.emit("userAlert", {
            message: "Merci, Votre image de profil a été mise à jour!.",
          });
        }
      );
    }
  }
}

function _getStripeData() {
  console.log("retrieving stripedata");

  stripeModel = {
    account: null,
    balance: null,
    pendingTransactions: null,
    availableTransactions: null,
  };

  if (this.user.prof == 1) {
    //si c'est un prof
    stripe.accounts.retrieve(this.user.stripe_account, (err, account) => {
      stripeModel.account = account;
      stripe.balanceTransactions.list(
        { limit: 100 },
        { stripeAccount: this.user.stripe_account },
        (err, balanceTransactions) => {
          stripeModel.pendingTransactions = balanceTransactions.data
            .filter((transaction) => transaction.status == "pending")
            .map((transaction) => {
              transaction.created = moment
                .unix(transaction.created)
                .format("dddd D MMM YYYY HH:mm");
              transaction.available_on = moment
                .unix(transaction.available_on)
                .format("dddd D MMM YYYY HH:mm");
              return transaction;
            });
          stripeModel.availableTransactions = balanceTransactions.data
            .filter((transaction) => transaction.status == "available")
            .map((transaction) => {
              transaction.created = moment
                .unix(transaction.created)
                .format("dddd D MMM YYYY HH:mm");
              transaction.available_on = transaction.available_on = moment
                .unix(transaction.available_on)
                .format("dddd D MMM YYYY HH:mm");
              return transaction;
            });
          stripe.balance.retrieve(
            { stripeAccount: this.user.stripe_account },
            (err, balance) => {
              stripeModel.balance = balance;
              this.emit("updateModel", {
                name: "stripeModel",
                data: stripeModel,
              });
              console.log(stripeModel);
            }
          );
        }
      );
    });
  } else {
    stripe.customers.retrieve(this.user.stripe_id, (err, account) => {
      stripeModel.account = account;

      this.emit("updateModel", { name: "stripeModel", data: stripeModel });
      console.log(stripeModel);
    });
  }
}
//FR76 1330 6003 8223 0773 7059 514

function _setStripeData(post) {
  if (this.user.prof == 1) {
    //si c'est un prof
    //db.query("UPDATE `users` SET `bank_iban`= ?, `bank_holder` = ?  WHERE `uuid`= ? ;",[rows[0].id , this.uuid]);
    stripe.accounts.update(this.user.stripe_account, {
      external_account: {
        object: "bank_account",
        country: "FR",
        currency: "EUR",
        account_holder_name: post.holder,
        account_number: post.iban,
      },
    });
    this.emit("userAlert", { message: "Vos données ont étés enregistrés!" });
    _getStripeData.call(this, {});
  }
}

function _connectData(post) {
  console.log(post);
  this.uuid = post.uuid;
  this.lang = post.lang || "en";
  //vérifier l'uuid'
  if (post.uuid.length > 0) {
    db.query(
      "select * from `devices` WHERE uuid = ?;",
      [post.uuid],
      (err, rows, fields) => {
        if (rows.length == 1) {
          //le device existe, on le connecte au compte si il est déja lié a un compte
          if (rows[0].user_id != 0) {
            console.log("autoconnect to userID : " + rows[0].user_id);
            db.query(
              "select * from `users` WHERE id = ? ;",
              [rows[0].user_id],
              (err, rows, fields) => {
                if (rows.length == 1) {
                  this.user = rows[0];
                  //remove serverside data
                  this.user.pass = "dummypass";
                  this.user.pass2 = "dummypass";
                  //add socket session id for game
                  this.user.sid = this.user.id + Date.now();

                  //emit login ok
                  this.emit("loginOK", this.user);

                  tickLastSeenUser(this.user.id);

                  //update user pages
                  _getPages.call(this, {});

                  //update conversations
                  _getConversations.call(this, {});
                }
              }
            );
          }
        } // n'existe pas encore, on l'ajoute
        else {
          db.query(
            "INSERT INTO `devices` (`uuid`, `region`, `language`, `deviceType`, `manufacturer`, `model`, `sdkVersion`) VALUES (?,?,?,?,?,?,?);",
            [
              this.uuid,
              post.region,
              post.language,
              post.deviceType,
              post.manufacturer,
              post.model,
              post.sdkVersion,
            ],
            function (err, info) {}
          );
        }
      }
    );
  }
}

function _login(post) {
  console.log(post);
  //check if username or mail already exists wit salt in password
  db.query(
    "select * from `users` WHERE mail = ? AND pass = ? ;",
    [post.mail, md5(post.pass + "somesalt")],
    (err, rows, fields) => {
      if (rows.length == 1) {
        this.user = rows[0];
        //remove serverside data
        this.user.pass = "dummypass";
        this.user.pass2 = "dummypass";
        //add socket session id for game
        this.user.sid = this.user.id + Date.now();
        //emit login ok
        this.emit("loginOK", this.user);

        tickLastSeenUser(this.user.id);
        //update user pages
        _getPages.call(this, {});
        //update conversations
        _getConversations.call(this, {});

        //ajouter le compte au devices pour un autoconnect la prochaine fois
        if (this.uuid)
          db.query("UPDATE `devices` SET `user_id`= ? WHERE `uuid`= ? ;", [
            rows[0].id,
            this.uuid,
          ]);
      } else {
        this.emit("userAlert", {
          message: "Mauvais login ou mot de passe!",
          wrong: "true",
        });
      }
    }
  );
}

function _logout(post) {
  if (this.user.id > 0) tickLastSeenUser(this.user.id);
  if (this.uuid)
    db.query("UPDATE `devices` SET `user_id`= ? WHERE `uuid`= ? ;", [
      "0",
      this.uuid,
    ]);
  this.user = { id: 0 };
  this.emit("logout");
  // retirer l'appareil du push service
  //ua.pushNotification("/api/named_users/disassociate", this.channelPayLoad, function(error) {});
}

function _disconnect(post) {
  console.log(this.user.id + "disconnected");
  if (this.user.id > 0) tickLastSeenUser(this.user.id);
  sockets.splice(sockets.indexOf(this), 1);
}
function _resetpass(post) {
  console.log("reset pass");
  //find user with e-mail
  db.query(
    "select * from `users` WHERE mail = ? ;",
    [post.mail],
    (err, rows, fields) => {
      if (rows.length == 1) {
        console.log("reset");
        var link =
          "https://goprof.fr:8840/rp/" +
          rows[0].id +
          "/" +
          md5(rows[0].mail + rows[0].pass);
        var message = {
          from: "goprof@goprof.fr",
          to: rows[0].mail,
          subject: "Goprof - récupération mot de passe",
          html:
            "Veuillez cliquer ou copier le lien afin de regénérér votre mot de passe goprof, vous pouvez ignorer ce message si vous n'etes pas a l'origine de cette demande. : <a href=\"" +
            link +
            '">' +
            link +
            "</a> ",
        };
        transporter.sendMail(message);
        this.emit("userAlert", {
          message: "Veuillez suivre la procédure reçue par e-mail.",
        });
      } else {
        console.log("else...");
        this.emit("userAlert", {
          message: "Aucun compte trouvé avec cette adresse e-mail...",
        });
      }
    }
  );
}

function _drawLine(post) {
  //send to all
  //io.emit('drawLine', post);

  // sending to all clients except sender
  this.broadcast.to(this.room).emit("drawLine", post);
}

function _undoDraw(post) {
  //send to all
  //io.emit('drawLine', post);

  // sending to all clients except sender
  this.broadcast.to(this.room).emit("undoDraw", post);
}

function _createPage(post) {
  console.log("create page");
  console.log(this.room);

  lastPageID++;

  var page = {};
  page.id = lastPageID;
  if (post.title) page.title = post.title;
  else page.title = "page #" + page.id;

  page.pageType = post.pageType;

  if (post.thumbnail) page.thumbnail = post.thumbnail;
  else page.thumbnail = "";

  if (post.src) page.src = post.src;

  if (this.room) io.to(this.room).emit("createPage", page);
}

function _switchPage(post) {
  console.log("switchpage");
  console.log(post);
  if (this.room) io.to(this.room).emit("switchPage", post);
}

function _getAgenda(post) {
  if (this.user.prof == 1) {
    //si c'est un prof
    db.query(
      "SELECT h.*, UNIX_TIMESTAMP(h.start) as start_uts, UNIX_TIMESTAMP(h.end) as end_uts, p.fname as prof_fname, p.lname as prof_lname, u.fname as user_fname, u.lname as user_lname FROM `hours` h LEFT JOIN `users` p on p.id = h.`prof_id` LEFT JOIN `users` u on u.id = h.`user_id` WHERE prof_id = ? AND h.start >= CURDATE() AND user_id IS NOT NULL;",
      [this.user.id],
      (err, rows, fields) => {
        rows.forEach((hour) => {});
        this.emit("updateModel", {
          name: "agendaModel",
          data: { hours: rows },
        });
      }
    );
  } //élève
  else {
    db.query(
      "SELECT h.*, UNIX_TIMESTAMP(h.start) as start_uts, UNIX_TIMESTAMP(h.end) as end_uts, p.fname as prof_fname, p.lname as prof_lname, u.fname as user_fname, u.lname as user_lname FROM `hours` h LEFT JOIN `users` p on p.id = h.`prof_id` LEFT JOIN `users` u on u.id = h.`user_id` WHERE user_id = ? AND h.start >= CURDATE();",
      [this.user.id],
      (err, rows, fields) => {
        rows.forEach((hour) => {});
        this.emit("updateModel", {
          name: "agendaModel",
          data: { hours: rows },
        });
      }
    );
  }
}

function _getDispo(post) {
  var start_m = moment().startOf("day");
  var end_m = moment().endOf("day");

  if (post.jour > 0) {
    start_m.add(post.jour, "day");
    end_m.add(post.jour, "day");
  }
  var startsql = start_m.format("YYYY-MM-DD HH:mm:ss");
  var endsql = end_m.format("YYYY-MM-DD HH:mm:ss");

  if (this.user.prof == 0) {
    //si c'est un élève
    db.query(
      "SELECT h.id, h.prof_id, `fixed_price`, u.`fname`, u.`lname`, u.`need_math`, u.`need_histoire`, u.`need_francais`, u.`need_geo`, u.`need_anglais`, u.`need_espagnol`, u.`need_allemand`, u.`need_physique`, u.`need_svt`,  UNIX_TIMESTAMP(start) as start_uts, UNIX_TIMESTAMP(end) as end_uts FROM `hours` h INNER JOIN `users` u on h.`prof_id` = u.`id` WHERE `visible` = 1 AND `user_id` IS NULL AND start > ? AND end < ?;",
      [startsql, endsql],
      (err, rows, fields) => {
        this.emit("updateModel", { name: "dispoModel", data: { hours: rows } });
      }
    );
  }
}

function _saveToFiles(post) {
  console.log("savetofiles");
  //écrire les infos + petite vignette dans la DB
  console.log(
    db.query(
      "INSERT INTO `pages` (`user_id`, `thumbnail`, `title`) VALUES (?,?,?);",
      [this.user.id, post.thumbnail, post.title],
      (err, info) => {
        console.log(err);
        //write file
        fs.writeFile("./pages/" + info.insertId + ".goprofpage", post.src);
      }
    ).sql
  );
}

/* Messaging */
function _getConversations(post) {
  console.log("getting conversations");
  db.query(
    "SELECT conversation_id, UNIX_TIMESTAMP(last_access) as last_access_uts  FROM `conversation_members` WHERE `user_id` = ?;",
    [this.user.id],
    (err, conversations, fields) => {
      //on récupère le last access pour cet utilisateur, plus tard on connais le last message time, on peut donc savoir si il faut indiquer une pastille new ou pas.
      console.log(err);
      conversationIDS = [];
      conversationPointers = {};
      conversations.forEach((conversation) => {
        conversation.id = conversation.conversation_id;
        conversation.members = [];
        conversation.last_message_time_uts = null;
        conversation.text = ""; //last message
        conversationIDS.push(conversation.conversation_id);
        conversationPointers["conv" + conversation.id] = conversation;
      });
      //retrieve conversations infos
      console.log(conversationIDS.join(","));
      //si pas de messages on renvoi le model vide..
      if (conversationIDS.length == 0) {
        this.emit("updateModel", {
          name: "conversationsModel",
          data: { conversations: [] },
        });

        return;
      }

      db.query(
        "SELECT id, UNIX_TIMESTAMP(last_message_time) as last_message_time_uts ,text FROM `conversations` WHERE `id` IN(?);",
        [conversationIDS],
        (err, rows, fields) => {
          console.log(err);
          console.log(rows);

          rows.forEach((row) => {
            console.log("aconv" + row.id);
            if (conversationPointers["conv" + row.id]) {
              conversationPointers["conv" + row.id].text = row.text;
              conversationPointers["conv" + row.id].last_message_time_uts =
                row.last_message_time_uts;
            }
          });
          //ajouter les membres
          db.query(
            "SELECT u.`id`, u.`fname`, u.`lname`, u.`classe`, UNIX_TIMESTAMP(cm.`last_access`) as last_access_uts , cm.`conversation_id` FROM `conversation_members` cm LEFT JOIN `users` u on cm.user_id = u.id  WHERE `conversation_id` IN(?);",
            [conversationIDS],
            (err, rows, fields) => {
              console.log(err);
              rows.forEach((row) => {
                console.log("bconv" + row.conversation_id);
                conversationPointers["conv" + row.conversation_id].members.push(
                  {
                    id: row.id,
                    fname: row.fname,
                    lname: row.lname,
                    classe: row.classe,
                    last_access_uts: row.last_access_uts,
                  }
                );
              });

              this.emit("updateModel", {
                name: "conversationsModel",
                data: { conversations: conversations },
              });
            }
          );
        }
      );
    }
  );
}

function _newConversation(post) {
  var users = [];
  users.push(this.user.id);
  users.push(post.userID);
  db.query(
    "SELECT conversation_id FROM conversation_members GROUP BY conversation_id HAVING SUM(user_id IN (?)) = 2 AND COUNT(*) = 2;",
    [users],
    (err, rows, fields) => {
      //la conversation existe déja!
      if (rows.length > 0) {
        _getMessages.call(this, { conversation_id: rows[0].conversation_id });
      } //sinon on la crée
      else {
        opentok.createSession((err, session) => {
          db.query(
            "INSERT INTO `conversations` (`id`, `otSession`) VALUES (NULL,?);",
            [session.sessionId],
            (err, info) => {
              var conversation_id = info.insertId;
              db.query(
                "INSERT INTO `conversation_members` (`conversation_id`,`user_id`) VALUES ?;",
                [
                  [
                    [conversation_id, this.user.id],
                    [conversation_id, post.userID],
                  ],
                ],
                (err, info) => {
                  _getMessages.call(this, { conversation_id: conversation_id });
                }
              );
            }
          );
        });
      }
    }
  );
}

function _getMessages(post) {
  //security : check that user has permissions to the requested conversation_id! -> eventuellement depuis la liste des membres ci-dessous

  db.query(
    "SELECT * FROM `messages` WHERE `conversation_id` = ? ORDER BY id ASC;",
    [post.conversation_id],
    (err, messages, fields) => {
      //ajouter les membres
      db.query(
        "SELECT u.`id`, u.`fname`, u.`lname`, u.`classe`, UNIX_TIMESTAMP(cm.`last_access`) as last_access_uts, cm.`conversation_id` FROM `conversation_members` cm LEFT JOIN `users` u on cm.user_id = u.id  WHERE `conversation_id`  = ?;",
        [post.conversation_id],
        (err, users, fields) => {
          //récupérer les données de la conversation
          db.query(
            "SELECT * FROM `conversations` WHERE `id` = ? ORDER BY id ASC;",
            [post.conversation_id],
            (err, conversations, fields) => {
              this.emit("updateMessages", {
                conversation_id: post.conversation_id,
                messages: messages,
                members: users,
                conversation: conversations[0],
              });

              //if conversation changed, set conversation id and serve new opentok data
              if (this.openConversationID != post.conversation_id) {
                /*
					console.log('sending new tokboxdata!');
					this.openConversationID = post.conversation_id;
					//update tokbox data
					var token = opentok.generateToken(conversations[0].otSession, {
						role :       'publisher',
						expireTime : (new Date().getTime() / 1000)+(14 * 24 * 60 * 60) // in two week
					});
					console.log({tok : token, sid:conversations[0].otSession, api:"45819672"});
					this.emit('tokBoxData', {tok : token, sid:conversations[0].otSession, api:"45819672"});
					*/

                //update Twilio model
                var twilioToken = new AccessToken(
                  twilio.account_sid,
                  twilio.api_key,
                  twilio.api_secret
                );
                twilioToken.identity = this.user.fname + " " + this.user.lname;
                const grant = new VideoGrant();
                twilioToken.addGrant(grant); // Grant token access to the Video API features
                this.emit("twilioData", twilioToken.toJwt());

                //socket join this room ( = OT session id )

                if (this.room) {
                  if (this.room != "room" + conversations[0].id) {
                    this.leave(this.room);
                    this.room = "room" + conversations[0].id;
                    this.join(this.room);
                  }
                } else {
                  this.room = "room" + conversations[0].id;
                  this.join(this.room);
                }
              }
            }
          );
        }
      );
      //update db tables
      db.query(
        "UPDATE `conversation_members` SET `last_access` = CURRENT_TIMESTAMP WHERE `conversation_id` = ? AND `user_id` = ? LIMIT 1",
        [post.conversation_id, this.user.id],
        function (err, info) {}
      );
    }
  );
}

function _getNotifications(post) {
  db.query(
    "SELECT *, UNIX_TIMESTAMP(received) as received_uts, UNIX_TIMESTAMP(eventDate) as eventDate_uts FROM `notifications` WHERE `user_id` = ? ORDER BY id DESC;",
    [this.user.id],
    (err, rows, fields) => {
      this.emit("updateModel", {
        name: "notificationsModel",
        data: { notifications: rows },
      });
    }
  );
}
function _getPages(post) {
  db.query(
    "SELECT *, UNIX_TIMESTAMP(created) as created_uts FROM `pages` WHERE `user_id` = ? OR `user_id` = 0 ORDER BY id DESC;",
    [this.user.id],
    (err, rows, fields) => {
      this.emit("updateModel", { name: "pagesModel", data: { pages: rows } });
    }
  );
}
function _openPage(post) {
  db.query(
    "SELECT *, UNIX_TIMESTAMP(created) as created_uts FROM `pages` WHERE `user_id` in (?,0) AND id = ? ORDER BY id DESC;",
    [this.user.id, post.id],
    (err, rows, fields) => {
      if (rows) {
        var page = rows[0];
        if (page)
          fs.readFile("./pages/" + post.id + ".goprofpage", (err, data) => {
            if (err) {
              console.log(err);
              return;
            }
            page.src = data.toString();
            _createPage.call(this, page);
          });
      }
    }
  );
}

function _getDemandes(post) {
  if (this.user.prof != 1) return;
  db.query(
    "SELECT h.id, UNIX_TIMESTAMP(start) as start_uts, UNIX_TIMESTAMP(end) as end_uts, u.fname, u.lname FROM `hours` h LEFT JOIN `users` u on h.user_id = u.id WHERE `prof_id` = ? AND `user_id` IS NOT NULL AND confirmed = 0 ORDER BY h.id DESC;",
    [this.user.id],
    (err, rows, fields) => {
      this.emit("updateModel", {
        name: "demandesModel",
        data: { demandes: rows },
      });
    }
  );
}
function _answerDemande(post) {
  if (this.user.prof != 1) return;
  if (post.accept) {
    //accepté
    //protection double paiement en cours
    if (paymentInProgress[post.hour_id]) {
      this.emit("userAlert", {
        message:
          "Un paiement est déja en cours d'execution, veuillez patienter..",
      });
      return;
    } else paymentInProgress[post.hour_id] = true;

    db.query(
      "SELECT h.*, u.`stripe_id` FROM `hours` h LEFT JOIN `users` u on h.user_id = u.id WHERE h.`id` = ? AND h.`prof_id` = ? ;",
      [post.hour_id, this.user.id],
      (err, rows, fields) => {
        if (!rows) return;
        var hour = rows[0];
        if (hour.payment_id != null) {
          this.emit("userAlert", { message: "Ce cours a déja été prélevé" });
          return;
        }
        stripe.customers.retrieve(hour.stripe_id, (err, account) => {
          balance = -account.balance;
          var to_pay = -account.balance - hour.fixed_price * 100;

          if (to_pay < 0) {
            to_pay = Math.abs(to_pay);
            if (to_pay < hour.fixed_price * 100) {
              request.post(
                "https://api.stripe.com/v1/customers/" +
                  hour.stripe_id +
                  "/balance_transactions",
                {
                  headers: {
                    Authorization: "Bearer sk_live_6OjfNR3fOLHyESBCJXeKlcVm",
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  form: {
                    amount: hour.fixed_price * 100 - to_pay,
                    currency: "eur",
                    description: "Credit utilisé sur GoProf #" + hour.id,
                  },
                }
              );
              hour.priceInCents = hour.fixed_price * 100 - to_pay;
              hour.priceInCentsForTeacher = Math.round(
                hour.priceInCents * 0.85
              );
              stripe.charges.create({
                amount: hour.priceInCents,
                currency: "eur",
                customer: "cus_H4Tb5NCPvsGn1P",
                source: "card_1GWKfSGxrLoFOHTXSg7UCY1g", // obtained with Stripe.js
                description: "Crédit utilisé pour GoProf #" + hour.id,
                destination: {
                  amount: hour.priceInCentsForTeacher,
                  account: this.user.stripe_account,
                },
              });
            }
            hour.priceInCents = to_pay;
            hour.priceInCentsForTeacher = Math.round(hour.priceInCents * 0.85);
            stripe.charges.create(
              {
                amount: hour.priceInCents,
                currency: "eur",
                customer: hour.stripe_id,
                source: hour.stripe_card, // obtained with Stripe.js
                description: "GoProf #" + hour.id,
                destination: {
                  amount: hour.priceInCentsForTeacher,
                  account: this.user.stripe_account,
                },
              },
              (err, charge) => {
                console.log(charge);
                if (err) {
                  this.emit("userAlert", {
                    message:
                      "Problème lors du prélèvement, veuillez contacter GoProf..",
                  });
                  console.log(err);
                } else if (charge.paid) {
                  db.query(
                    "UPDATE `hours` SET `confirmed` = 1, `payment_id` = ? WHERE id = ? LIMIT 1",
                    [charge.id, post.hour_id],
                    (err, info) => {
                      this.emit("userAlert", { message: "Paiement reçu." });
                      _getDemandes.call(this, {});
                      _pushNotification(
                        hour.user_id,
                        "Votre demande de cours a été validée par le professeur."
                      );
                      paymentInProgress[post.hour_id] = false;
                      db.query(
                        "SELECT * FROM `users` WHERE id = ?;",
                        [hour.user_id],
                        (err, rows, fields) => {
                          if (rows && rows.length == 1) {
                            var path_image =
                              "../public_html/profilepics/" +
                              this.user.id +
                              ".jpg";
                            var image = this.user.id + ".jpg";
                            if (!fs.existsSync(path_image)) {
                              image = "0.jpg";
                              path_image = "../public_html/profilepics/0.jpg";
                            }
                            var message = {
                              from: "goprof@goprof.fr",
                              to: rows[0].mail,
                              subject:
                                this.user.fname +
                                " accepte de vous donner des cours",
                              html:
                                '\
													<p style="text-align: center;"><img src="cid:logo_app@goprof.com" width="30%"></p>\
													' +
                                this.user.fname +
                                ' accepte de vous donner des cours.\
													<br>\
													<br>\
													<p style="text-align: center;"><img src="cid:logo_prof@goprof.com" width="80px"></p>\
													<br>\
													<br>\
													Vous pouvez contacter un autre prof sur l’application GoProf.\
													<br>\
													Vous pouvez prendre contact via la messagerie de l’application GoProf afin de préciser vos\
													besoins et définir un horaire/jour pour débuter votre cours.\
													<br>\
													Le cours peut débuter tout de suite si vous êtes tout(e) deux disponibles.\
													<br>\
													<br>\
													Toute l\'équipe GoProf',
                              attachments: [
                                {
                                  filename: "logo.png",
                                  path: "./logo.png",
                                  cid: "logo_app@goprof.com",
                                },
                                {
                                  filename: image,
                                  path: path_image,
                                  cid: "logo_prof@goprof.com",
                                },
                              ],
                            };
                            transporter.sendMail(message);
                          }
                        }
                      );
                    }
                  );
                } else
                  this.emit("userAlert", {
                    message: "Impossible de prélever l'élève..",
                  });
                paymentInProgress[post.hour_id] = false;
              }
            );
          } else {
            request.post(
              "https://api.stripe.com/v1/customers/" +
                hour.stripe_id +
                "/balance_transactions",
              {
                headers: {
                  Authorization: "Bearer sk_live_6OjfNR3fOLHyESBCJXeKlcVm",
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                form: {
                  amount: hour.fixed_price * 100,
                  currency: "eur",
                  description: "Credit utilisé sur GoProf #" + hour.id,
                },
              }
            );
            hour.priceInCents = hour.fixed_price * 100;
            hour.priceInCentsForTeacher = Math.round(hour.priceInCents * 0.85);
            stripe.charges.create(
              {
                amount: hour.priceInCents,
                currency: "eur",
                customer: "cus_H4Tb5NCPvsGn1P",
                source: "card_1GWKfSGxrLoFOHTXSg7UCY1g", // obtained with Stripe.js
                description: "Crédit utilisé pour GoProf #" + hour.id,
                destination: {
                  amount: hour.priceInCentsForTeacher,
                  account: this.user.stripe_account,
                },
              },
              (err, charge) => {
                console.log(charge);
                if (err) {
                  this.emit("userAlert", {
                    message:
                      "Problème lors du prélèvement, veuillez contacter GoProf..",
                  });
                  console.log(err);
                } else if (charge.paid) {
                  db.query(
                    "UPDATE `hours` SET `confirmed` = 1, `payment_id` = ? WHERE id = ? LIMIT 1",
                    [charge.id, post.hour_id],
                    (err, info) => {
                      this.emit("userAlert", { message: "Paiement reçu." });
                      _getDemandes.call(this, {});
                      _pushNotification(
                        hour.user_id,
                        "Votre demande de cours a été validée par le professeur."
                      );
                      paymentInProgress[post.hour_id] = false;
                      //mail notification
                      db.query(
                        "SELECT * FROM `users` WHERE id = ?;",
                        [hour.user_id],
                        (err, rows, fields) => {
                          if (rows && rows.length == 1) {
                            var path_image =
                              "../public_html/profilepics/" +
                              this.user.id +
                              ".jpg";
                            var image = this.user.id + ".jpg";
                            if (!fs.existsSync(path_image)) {
                              image = "0.jpg";
                              path_image = "../public_html/profilepics/0.jpg";
                            }
                            var message = {
                              from: "goprof@goprof.fr",
                              to: rows[0].mail,
                              subject:
                                this.user.fname +
                                " accepte de vous donner des cours",
                              html:
                                '\
													<p style="text-align: center;"><img src="cid:logo_app@goprof.com" width="30%"></p>\
													' +
                                this.user.fname +
                                ' accepte de vous donner des cours.\
													<br>\
													<br>\
													<p style="text-align: center;"><img src="cid:logo_prof@goprof.com" width="80px"></p>\
													<br>\
													<br>\
													Vous pouvez prendre contact via la messagerie de l’application GoProf afin de préciser vos\
													besoins et définir un horaire/jour pour débuter votre cours.\
													<br>\
													Le cours peut débuter tout de suite si vous êtes tout(e) deux disponibles\
													<br>\
													<br>\
													Toute l\'équipe GoProf',
                              attachments: [
                                {
                                  filename: "logo.png",
                                  path: "./logo.png",
                                  cid: "logo_app@goprof.com",
                                },
                                {
                                  filename: image,
                                  path: path_image,
                                  cid: "logo_prof@goprof.com",
                                },
                              ],
                            };
                            transporter.sendMail(message);
                          }
                        }
                      );
                    }
                  );
                } else
                  this.emit("userAlert", {
                    message: "Impossible de prélever l'élève..",
                  });
                paymentInProgress[post.hour_id] = false;
              }
            );
          }
        });
      }
    );
  } // refusé
  else {
    db.query(
      "SELECT h.*, u.`stripe_id` FROM `hours` h LEFT JOIN `users` u on h.user_id = u.id WHERE h.`id` = ? AND h.`prof_id` = ? ;",
      [post.hour_id, this.user.id],
      (err, rows, fields) => {
        db.query(
          "UPDATE `hours` SET `user_id` = NULL WHERE id = ? LIMIT 1",
          [post.hour_id],
          (err, info) => {
            if (!rows) return;
            var hour = rows[0];

            _getDemandes.call(this);
            _pushNotification(
              hour.user_id,
              "Votre demande de cours a été refusée par le professeur."
            );
            //mail notification
            db.query(
              "SELECT * FROM `users` WHERE id = ?;",
              [hour.user_id],
              (err, rows, fields) => {
                if (rows && rows.length == 1) {
                  var path_image =
                    "../public_html/profilepics/" + this.user.id + ".jpg";
                  var image = this.user.id + ".jpg";
                  if (!fs.existsSync(path_image)) {
                    image = "0.jpg";
                    path_image = "../public_html/profilepics/0.jpg";
                  }
                  var message = {
                    from: "goprof@goprof.fr",
                    to: rows[0].mail,
                    subject: this.user.fname + " n'est pas disponible",
                    html:
                      '\
								<p style="text-align: center;"><img src="cid:logo_app@goprof.com" width="30%"></p>\
								' +
                      this.user.fname +
                      ' ne peut malheureusement pas donner suite à votre demande de cours.\
								<br>\
								<br>\
								<p style="text-align: center;"><img src="cid:logo_prof@goprof.com" width="80px"></p>\
								<br>\
								<br>\
								Vous pouvez contacter un autre prof sur l’application GoProf.\
								<br>\
								Vous pouvez effectuer plusieurs demandes simultanées, même si plusieurs professeurs\
								vous répondent positivement, vous pourrez n’en choisir qu’un seul et n’être débité qu\'une\
								seule fois.\
								<br>\
								<br>\
								Toute l\'équipe GoProf',
                    attachments: [
                      {
                        filename: "logo.png",
                        path: "./logo.png",
                        cid: "logo_app@goprof.com",
                      },
                      {
                        filename: image,
                        path: path_image,
                        cid: "logo_prof@goprof.com",
                      },
                    ],
                  };
                  transporter.sendMail(message);
                }
              }
            );
          }
        );
      }
    );
  }
}

function _sendMessage(post) {
  //security : check that user has permissions to post to conversation_id!
  console.log("sending message");

  db.query(
    "INSERT INTO `messages` (`user_id`,`conversation_id`,`type`,`content`) VALUES (?,?,?,?);",
    [this.user.id, post.conversation_id, "text", post.message],
    (err, info) => {
      //update senders model directly
      _getMessages.call(this, { conversation_id: post.conversation_id });

      //update db tables
      db.query(
        "UPDATE `conversations` SET `last_message_time` = CURRENT_TIMESTAMP, `text` = ? WHERE `id` = ? LIMIT 1",
        [post.message, post.conversation_id],
        function (err, info) {}
      );

      //notify every socket linked to conversation
      db.query(
        "SELECT user_id FROM `conversation_members` WHERE `conversation_id` = ?;",
        [post.conversation_id],
        (err, members, fields) => {
          console.log(err);
          members.forEach((member) => {
            var userDevices = socketsByUserId(member.user_id);
            userDevices.forEach((socket) => {
              //notifier si l'utilisateur
              socket.emit("updateConversation", {
                conversation_id: post.conversation_id,
                message: post.message,
                sender: {
                  id: this.user.id,
                  fname: this.user.fname,
                  lname: this.user.lname,
                },
              });
            });
            console.log("socket count:" + userDevices.length);
            //notifier destinataire par push si il n'est pas connecté
            if (userDevices.length == 0 && member.user_id != this.user.id) {
              console.log("sending notification to user ID : ");
              console.log(member.user_id);

              _pushNotification(
                member.user_id,
                this.user.fname + " " + this.user.lname + " : " + post.message
              );

              //mail notification
              db.query(
                "SELECT * FROM `users` WHERE id = ?;",
                [member.user_id],
                (err, rows, fields) => {
                  if (rows && rows.length == 1) {
                    var path_image =
                      "../public_html/profilepics/" + this.user.id + ".jpg";
                    var image = this.user.id + ".jpg";
                    if (!fs.existsSync(path_image)) {
                      image = "0.jpg";
                      path_image = "../public_html/profilepics/0.jpg";
                    }
                    var message = {
                      from: "goprof@goprof.fr",
                      to: rows[0].mail,
                      subject:
                        rows[0].fname +
                        ", vous avez reçu un message de " +
                        this.user.fname,
                      html:
                        '\
								<p style="text-align: center;"><img src="cid:logo_app@goprof.com" width="30%"></p>\
								' +
                        this.user.fname +
                        ' vous a écrit.\
								<br>\
								<br>\
								<p style="text-align: center;"><img src="cid:logo_prof@goprof.com" width="80px"></p>\
								<br>\
								<p style="text-align: center;"><em>' +
                        post.message +
                        "</em></p>\
								<br>\
								<br>\
								Vous pouvez vous connecter à l'application GoProf pour répondre à " +
                        this.user.fname +
                        "\
								<br>\
								<br>\
								Toute l'équipe GoProf",
                      attachments: [
                        {
                          filename: "logo.png",
                          path: "./logo.png",
                          cid: "logo_app@goprof.com",
                        },
                        {
                          filename: image,
                          path: path_image,
                          cid: "logo_prof@goprof.com",
                        },
                      ],
                    };
                    transporter
                      .sendMail(message)
                      .then(function (e) {
                        console.log(e);
                      })
                      .catch(function (e) {
                        console.log(e);
                      });
                  }
                }
              );
            }
          });
        }
      );
    }
  );
}

/* Video Library */
function _getVideos(post) {
  // renvoyer les videos dans l'ordre d'importance pour l'élève + indiquer si vu ou non
  //renvoyer des stats peut-etre, nombre de vues etc...

  db.query(
    "SELECT v.*, va.nom, va.url FROM `videos` v LEFT JOIN `videos_auteurs` va on v.`auteur_id` = va.`id`;",
    [],
    (err, rows, fields) => {
      rows.forEach((video) => {
        video.videoURL =
          "https://www.videos.goprof.fr/720/" + video.id + ".mp4";
        video.imageURL =
          "https://www.videos.goprof.fr/720/" + video.id + ".jpg";
      });
      this.emit("updateModel", { name: "videosModel", data: { videos: rows } });
    }
  );
}

/* Profs */
function _getProfs(post) {
  // renvoyer les videos dans l'ordre d'importance pour l'élève + indiquer si vu ou non
  //renvoyer des stats peut-etre, nombre de vues etc...

  db.query("SELECT * FROM `users` WHERE prof = 1;", [], (err, rows, fields) => {
    rows.forEach((prof) => {
      prof.online = userIsOnline(prof.id);
    });
    this.emit("updateModel", { name: "profsModel", data: { profs: rows } });
  });
}
/* Reserver */
function _reserver(post) {
  //trouver le bon hour
  console.log("reserver..");
  console.log(post);

  db.query(
    "SELECT * FROM `hours` WHERE id = ? AND prof_id = ?;",
    [post.hour.id, post.prof.id],
    (err, rows, fields) => {
      if (rows.length == 1) {
        //check if dispo
        if (rows[0].user_id == null) {
          db.query(
            "UPDATE `hours` SET `user_id` = ?, `stripe_card` = ? WHERE id = ?;",
            [this.user.id, post.card.id, rows[0].id],
            (err, info) => {
              //notifier eleve
              db.query(
                "INSERT INTO `notifications` (`user_id`, `type`, `eventDate`, `title`, `text`) VALUES (?,?,?,?,?);",
                [
                  this.user.id,
                  "request",
                  rows[0].start,
                  "demande de cours",
                  "Votre demande de cours a bien été reçue.",
                ],
                (err, info) => {
                  _getNotifications.call(this);
                }
              );

              //notifier prof
              db.query(
                "INSERT INTO `notifications` (`user_id`, `type`, `eventDate`, `title`, `text`) VALUES (?,?,?,?,?);",
                [
                  rows[0].prof_id,
                  "prof_request",
                  rows[0].start,
                  "demande de cours",
                  "Vous avez une demande de cours.",
                ],
                (err, info) => {
                  //notify every socket linked to conversation

                  var userDevices = socketsByUserId(rows[0].prof_id);
                  userDevices.forEach((socket) => {
                    socket.emit("userAlert", {
                      type: "profnewrequest",
                      message: "Vous avez une nouvelle demande de cours...",
                    });
                  });
                  //mail notification
                  db.query(
                    "SELECT * FROM `users` WHERE id = ?;",
                    [rows[0].prof_id],
                    (err, rows_mail, fields) => {
                      if (rows_mail && rows_mail.length == 1) {
                        var path_image =
                          "../public_html/profilepics/" + this.user.id + ".jpg";
                        var image = this.user.id + ".jpg";
                        if (!fs.existsSync(path_image)) {
                          image = "0.jpg";
                          path_image = "../public_html/profilepics/0.jpg";
                        }
                        var message = {
                          from: "goprof@goprof.fr",
                          to: rows_mail[0].mail,
                          subject:
                            post.prof.fname +
                            ", vous avez reçu une nouvelle demande de cours",
                          html:
                            '\
											<p style="text-align: center;"><img src="cid:logo_app@goprof.com" width="30%"></p>\
											' +
                            this.user.fname +
                            ' souhaite prendre un cours avec vous.\
											<br>\
											<br>\
											<p style="text-align: center;"><img src="cid:logo_prof@goprof.com" width="80px"></p>\
											<br>\
											<br>\
											Vous pouvez vous connecter à l\'application GoProf dans le menu "mes demandes" pour \
											accepter ou refuser de dispenser votre cours.\
											<br>\
											<br>\
											Toute l\'équipe GoProf',
                          attachments: [
                            {
                              filename: "logo.png",
                              path: "./logo.png",
                              cid: "logo_app@goprof.com",
                            },
                            {
                              filename: image,
                              path: path_image,
                              cid: "logo_prof@goprof.com",
                            },
                          ],
                        };
                        transporter.sendMail(message);
                      }
                    }
                  );
                  //_mailNotification(rows[0].prof_id, "Vous avez une nouvelle demande de cours.")

                  //notif prof
                  _pushNotification(
                    rows[0].prof_id,
                    "Vous avez une nouvelle demande de cours."
                  );
                }
              );
            }
          );
        }
      }
    }
  );

  //verifier s'il est dispo

  //notifier l'élève

  //notifier le prof
}

function _getProfAgenda(post) {
  //pour élève et prof
  db.query(
    "SELECT *, UNIX_TIMESTAMP(start) as start_uts, UNIX_TIMESTAMP(end) as end_uts FROM `hours` WHERE prof_id = ? AND `visible` = 1 AND start >= CURDATE();",
    [post.userID],
    (err, rows, fields) => {
      rows.forEach((hour) => {
        hour.available = true;
        if (hour.user_id) hour.available = false;
        delete hour.start;
        delete hour.end;
        delete hour.user_id;
        delete hour.stripe_id;
        delete hour.rating;
        delete hour.user_comment;
        delete hour.prof_comment;
      });
      this.emit("updateModel", {
        name: "openProfAgendaModel",
        data: { hours: rows },
      });
    }
  );
}

function _addhours(post) {
  //pour prof
  var records = [];
  var dayKeys = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  var loop = moment();
  var end = moment(loop).add(post.noDays, "days");

  while (loop.isBefore(end)) {
    //check si la journée est concernée
    var dayKey = parseInt(loop.format("d"));
    if (post.days[dayKeys[dayKey]]) {
      //ajouter les heures manuellement;
      if (post.hours.h6)
        records.push([
          loop.format("YYYY-MM-DD 06:00:00"),
          loop.format("YYYY-MM-DD 07:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h7)
        records.push([
          loop.format("YYYY-MM-DD 07:00:00"),
          loop.format("YYYY-MM-DD 08:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h8)
        records.push([
          loop.format("YYYY-MM-DD 08:00:00"),
          loop.format("YYYY-MM-DD 09:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h9)
        records.push([
          loop.format("YYYY-MM-DD 09:00:00"),
          loop.format("YYYY-MM-DD 10:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h10)
        records.push([
          loop.format("YYYY-MM-DD 10:00:00"),
          loop.format("YYYY-MM-DD 11:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h11)
        records.push([
          loop.format("YYYY-MM-DD 11:00:00"),
          loop.format("YYYY-MM-DD 12:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h12)
        records.push([
          loop.format("YYYY-MM-DD 12:00:00"),
          loop.format("YYYY-MM-DD 13:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h13)
        records.push([
          loop.format("YYYY-MM-DD 13:00:00"),
          loop.format("YYYY-MM-DD 14:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h14)
        records.push([
          loop.format("YYYY-MM-DD 14:00:00"),
          loop.format("YYYY-MM-DD 15:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h15)
        records.push([
          loop.format("YYYY-MM-DD 15:00:00"),
          loop.format("YYYY-MM-DD 16:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h16)
        records.push([
          loop.format("YYYY-MM-DD 16:00:00"),
          loop.format("YYYY-MM-DD 17:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h17)
        records.push([
          loop.format("YYYY-MM-DD 17:00:00"),
          loop.format("YYYY-MM-DD 18:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h18)
        records.push([
          loop.format("YYYY-MM-DD 18:00:00"),
          loop.format("YYYY-MM-DD 19:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h19)
        records.push([
          loop.format("YYYY-MM-DD 19:00:00"),
          loop.format("YYYY-MM-DD 20:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
      if (post.hours.h20)
        records.push([
          loop.format("YYYY-MM-DD 20:00:00"),
          loop.format("YYYY-MM-DD 21:00:00"),
          this.user.id,
          this.user.hour_rate,
        ]);
    }

    //change loop to next day
    loop.add(1, "days");
  }

  if (post.add) {
    db.query(
      "INSERT IGNORE INTO `hours` (`start`,`end`,`prof_id`, `fixed_price`) VALUES ?;",
      [records],
      (err, info) => {
        //_getAgenda.call(this);
      }
    );
  } else {
    db.query(
      "DELETE FROM `hours` WHERE (`start`,`end`,`prof_id`, `fixed_price`) IN (?) AND `user_id` IS NULL",
      [records],
      (err, info) => {
        //_getAgenda.call(this);
      }
    );
  }
}
function _deletehour(hour_id) {
  //pour prof
  db.query(
    "DELETE FROM `hours` WHERE id = ? AND prof_id = ? AND `user_id` IS NULL",
    [hour_id, this.user.id],
    (err, info) => {
      _getProfAgenda.call(this, { userID: this.user.id });
    }
  );
}
function _newQuote(post) {
  //pour prof
  db.query(
    "INSERT INTO `hours` (`start`,`end`,`prof_id`,`visible`, `fixed_price`) VALUES (?,?,?,?,?);",
    [post.start, post.end, this.user.id, 0, post.price],
    (err, info) => {
      //send message to conversation info.insertId
      db.query(
        "INSERT INTO `messages` (`user_id`,`conversation_id`,`type`,`content`) VALUES (?,?,?,?);",
        [this.user.id, post.conversation_id, "quote", info.insertId],
        (err, info) => {
          //update senders model directly
          _getMessages.call(this, { conversation_id: post.conversation_id });

          //update db tables
          db.query(
            "UPDATE `conversations` SET `last_message_time` = CURRENT_TIMESTAMP, `text` = ? WHERE `id` = ? LIMIT 1",
            ["offre", post.conversation_id],
            function (err, info) {}
          );

          //notify every socket linked to conversation
          db.query(
            "SELECT user_id FROM `conversation_members` WHERE `conversation_id` = ?;",
            [post.conversation_id],
            (err, members, fields) => {
              console.log(err);
              members.forEach((member) => {
                var userDevices = socketsByUserId(member.user_id);
                userDevices.forEach((socket) => {
                  //notifier si l'utilisateur
                  socket.emit("updateConversation", {
                    conversation_id: post.conversation_id,
                    message: "Nouvelle offre.",
                    sender: {
                      id: this.user.id,
                      fname: this.user.fname,
                      lname: this.user.lname,
                    },
                  });
                });
              });
            }
          );
        }
      );
    }
  );
}

function _getQuote(post) {
  console.log(
    db.query(
      "SELECT id, user_id, UNIX_TIMESTAMP(start) as start_uts, UNIX_TIMESTAMP(end) as end_uts,`prof_id`, `confirmed`, `fixed_price` FROM `hours` WHERE id = ?;",
      [post.quote_id],
      (err, rows, fields) => {
        console.log(err);
        this.emit("updateModel", {
          name: "openQuoteModel",
          data: { quote: rows[0] },
        });
      }
    ).sql
  );
}

/*  Utilities  */

function tickLastSeenUser(user_id) {
  db.query(
    "UPDATE `users` SET `lastseen` = CURRENT_TIMESTAMP WHERE `id`= ? ;",
    [user_id]
  );
}

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function socketsByUserId(id) {
  return sockets.filter(
    function (socket) {
      return socket.user.id == id;
    }.bind(this)
  );
}

function userIsOnline(id) {
  return Math.random() < 0.5;
}

function generatepass(length) {
  var chars = "abcdfghkmnprstuwxyz2345689ab";
  var pass = "";
  for (var i = 0; i < length; i++) {
    pass += chars[Math.round(Math.random() * 25)];
  }
  return pass;
}

/*
Exports

Accesible dans le inspector sur : 
process.mainModule.exports

*/
exports.sessions = sessions;

/* DashBoard */

function isAuthorized(socket) {
  if (socket.admin) return true;
  else {
    socket.emit("setView", "login");
    return false;
  }
}

function _adm_login(post) {
  console.log("trying to login in adm mode!");
  if (post.user == "Renaud" && post.pass == "Remus3000") {
    this.admin = true;
    this.emit("setView", "users");

    //_adm_getModel.call(this,{requestedModel : "categoriesModel"});

    this.emit("updateModel", {
      name: "menuModel",
      data: {
        items: [
          { label: "Utilisateurs", icon: "fa-address-book-o", href: "/users" },
          { label: "Videos", icon: "fa-video-camera", href: "/videos" },
          { label: "Fiches", icon: "fa-files-o", href: "/pages" },
          { label: "Réservations", icon: "fa-book", href: "/reservations" },
          { label: "Paiements", icon: "fa-credit-card", href: "/paiements" },
          { label: "Litiges", icon: "fa-balance-scale", href: "/litiges" },
          { label: "Statistiques", icon: "fa-line-chart", href: "/stats" },
          { label: "Gestion jeu", icon: "fa-gamepad", href: "/jeu" },
        ],
      },
    });
  } else {
    this.emit("notify", {
      titleText: "Login échoué",
      text: "Merci de vérifier login et pass",
      type: "error",
    });
  }
}

function _adm_getModel(post) {
  if (!isAuthorized(this)) return;

  console.log("received model request:");
  console.log(post);

  if (post.requestedModel == "usersModel") {
    db.query(
      "SELECT *, UNIX_TIMESTAMP(created) as created, UNIX_TIMESTAMP(lastseen) as lastseen FROM users ORDER BY ID ASC;",
      [],
      (err, rows, fields) => {
        this.emit("updateModel", { name: "usersModel", data: { users: rows } });
      }
    );
  }
  if (post.requestedModel == "pagesModel") {
    db.query(
      "SELECT *, UNIX_TIMESTAMP(created) as created FROM pages WHERE user_id = 0 ORDER BY ID DESC;",
      [],
      (err, rows, fields) => {
        this.emit("updateModel", { name: "pagesModel", data: { pages: rows } });
      }
    );
  }
  if (post.requestedModel == "videosModel") {
    db.query(
      "SELECT *, UNIX_TIMESTAMP(`date`) as date_uts FROM videos ORDER BY priority ASC;",
      [],
      (err, rows, fields) => {
        db.query(
          "SELECT * FROM videos_auteurs ORDER BY id ASC;",
          [],
          (err, auteurs, fields) => {
            this.emit("updateModel", {
              name: "videosModel",
              data: { videos: rows, auteurs: auteurs },
            });
          }
        );
      }
    );
  }
}

function _adm_saveDBRow(post) {
  if (!isAuthorized(this)) return;

  console.log("received model save:");
  console.log(post);

  if (post.table == "users") {
    console.log([
      post.object.mail,
      post.object.username,
      post.object.phone,
      post.object.created,
      post.object.mothertongue,
      post.object.languages,
      post.object.fname,
      post.object.description,
      post.object.birthdate,
      post.object.gender,
      post.object.deleted,
      post.object.lname,
      post.object.job,
      post.object.url,
      post.object.lastseen,
      post.object.currency,
      post.object.id,
    ]);
    console.log(
      db.query(
        "UPDATE `users` SET `mail` = ? , `username` = ?, `schoolcode` = ?, `phone` = ? , created = FROM_UNIXTIME(?) , mothertongue = ?, languages = ?, fname = ?, description = ?, birthdate = FROM_UNIXTIME(?), gender = ?, deleted = ?, lname = ?, job = ?, url = ?, lastseen = FROM_UNIXTIME(?), currency = ? WHERE `id` = ? ;",
        [
          post.object.mail,
          post.object.username,
          post.object.schoolcode,
          post.object.phone,
          post.object.created,
          post.object.mothertongue,
          post.object.languages,
          post.object.fname,
          post.object.description,
          post.object.birthdate,
          post.object.gender,
          post.object.deleted,
          post.object.lname,
          post.object.job,
          post.object.url,
          post.object.lastseen,
          post.object.currency,
          post.object.id,
        ],
        (error, results, fields) => {
          if (error) console.log(error);
          //notifier utilisateur
          this.emit("notify", {
            title: "Modifié avec succès!",
            timer: 1500,
            type: "success",
            showConfirmButton: false,
          });
        }
      ).sql
    );
  }
  if (post.table == "videos") {
    console.log(
      db.query(
        "UPDATE `videos` SET `titre` = ? , `matiere` = ?, `priority` = ? , auteur_id = ?, description = ? WHERE `id` = ? ;",
        [
          post.object.titre,
          post.object.matiere,
          post.object.priority,
          post.object.auteur_id,
          post.object.description,
          post.object.id,
        ],
        (error, results, fields) => {
          if (error) console.log(error);
          //notifier utilisateur
          this.emit("notify", {
            title: "Modifié avec succès!",
            timer: 1500,
            type: "success",
            showConfirmButton: false,
          });
        }
      ).sql
    );
  }
}

function _adm_saveNewPage(post) {
  if (!isAuthorized(this)) return;

  console.log("received page");
  console.log(post);

  db.query(
    "INSERT INTO `pages` (`user_id`, `thumbnail`, `title`) VALUES (0,?,?);",
    [post.page.thumbnail, post.page.title],
    (error, info) => {
      if (error) console.log(error);

      //sauver le fichier source
      fs.writeFile(
        "./pages/" + info.insertId + ".goprofpage",
        post.page.source
      );

      //notifier utilisateur
      this.emit("notify", {
        title: "Fiche crée avec succès!",
        timer: 1500,
        type: "success",
        showConfirmButton: false,
      });

      _adm_getModel.call(this, { requestedModel: "pagesModel" });
    }
  );
}

function _adm_deletePage(post) {
  if (!isAuthorized(this)) return;

  db.query("DELETE FROM `pages` WHERE id = ?", [post.id], (err, info) => {
    _adm_getModel.call(this, { requestedModel: "pagesModel" });
  });
}

function _adm_sendMessage(post) {
  // broadcast to all may be slow...
  //targetted user
  db.query(
    "INSERT INTO `messages` (`from`, `to`, `message`, `type`) VALUES (?,?,?,?);",
    [1, post.to_id, post.message, "text"],
    (err, info) => {
      //refresh admin
      _adm_getModel.call(this, {
        requestedModel: "conversationModel",
        a_id: post.to_id,
        b_id: 1,
      });

      //refresh remote sockets
      var receivers = socketsByUserId(post.to_id);
      for (var i = 0; i < receivers.length; i++) {
        receivers[i].emit("getLastMessages");
      }
      if (receivers.length == 0) {
        _pushNotification(post.to_id, "GoProf : " + post.message);
      }
    }
  );
}

// Game methods

function _game_login(post) {
  //dev override
  if (post.sid == "dev") {
    this.emit("userdata", {
      fname: "John",
      lname: "Doe",
      stars: ["thales02", "thales07"],
    });
    return;
  }

  //find socket with corresponding UID
  this.appSocket = sockets.find((s) => {
    return s.user.sid == post.sid;
  });
  if (this.appSocket) {
    //found emiting user session

    //assigne this socket to the appsocket as well..
    this.appSocket.gameSocket = this;

    this.emit("userdata", {
      fname: this.appSocket.user.fname,
      lname: this.appSocket.user.lname,
      stars: ["thales02", "thales07"],
    });
  } else {
    //wrong login, send error
  }
}

function _game_savestars(post) {
  console.log("updating stars on user");
  if (!this.appSocket) return;

  console.log("updating stars on user " + this.appSocket.user.id);
  console.log(post);
  db.query(
    "UPDATE `users` SET `stars` = ? WHERE `id` = ? LIMIT 1",
    [post.stars.join(","), this.appSocket.user.id],
    function (err, info) {}
  );
}

function printAllRooms() {
  console.log(io.sockets.adapter.rooms);
  setTimeout(() => {
    printAllRooms();
  }, 4000);
}
//printAllRooms();
