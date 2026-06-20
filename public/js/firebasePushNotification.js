import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'
import {getMessaging,getToken,onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js"
const firebaseConfig = {
    apiKey: fcmApiKey,
    authDomain: fcmAuthDomain,
    projectId:fcmProjectId,
    messagingSenderId:fcmMessageSenderId,
    appId:fcmAppId
}
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

getToken(messaging, { vapidKey: fcmVAPID }).then((currentToken) => {
    if (currentToken) {
var data = {'token':currentToken};
        $.ajax({
            url: saveTokenUrl,
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            method: 'POST',
            data: data,
            dataType:'json',
            success: function(result) {
                if(result.statusCode == 400){
}else if(result.statusCode == 200){
}else{
}
            }
        });
    } else {
}
  }).catch((err) => {
});