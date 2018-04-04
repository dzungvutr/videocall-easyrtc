$(document).ready(function() {

    $('#div-remote-id').hide();
    $('#div-chat').hide();
    $('#div-video').hide();
    $('#div-video-localstream').hide()
    $('#acceptCallBox').hide();
    var socket = io('https://videocall-easyrtc.herokuapp.com/');
    //var socket = io('http://localhost:8443');
    var callerPending = null;
    var checkVideo = true;
    var checkAudio = true;
    
    //Get PeerId
    function connect() {
        easyrtc.connect("snowchat", connectSuccess, failureCallback);


        //Reject Call
        easyrtc.setCallCancelled(function(easyrtcid) {
            if (easyrtcid === callerPending) {
                document.getElementById('acceptCallBox').style.display = "none";
                callerPending = false;
            }
        });


        //Accept Call
        easyrtc.setAcceptChecker(function(easyrtcid, callback) {
            //$('#acceptCallBox').show();
            document.getElementById('acceptCallBox').style.display = "inline-block";
            callerPending = easyrtcid;
            if (easyrtc.getConnectionCount() > 0) {
                document.getElementById('acceptCallLabel').innerHTML = "Drop current call and accept new from " + easyrtc.idToName(easyrtcid) + " ?";
            } else {
                document.getElementById('acceptCallLabel').innerHTML = "Accept incoming call from " + easyrtc.idToName(easyrtcid) + " ?";
            }
            var acceptTheCall = function(wasAccepted) {
                document.getElementById('acceptCallBox').style.display = "none";
                if (wasAccepted && easyrtc.getConnectionCount() > 0) {
                    hangupAll();
                }
                callback(wasAccepted);
                callerPending = null;
            };
            document.getElementById("callAcceptButton").onclick = function() {
                acceptTheCall(true);
            };
            document.getElementById("callRejectButton").onclick = function() {
                acceptTheCall(false);
            };
        });

        //Get RemoteStream
        easyrtc.setStreamAcceptor(function(callerEasyrtcid, stream) {
            $('#div-chat').hide();
            $('#div-video').show();
            $('#div-video-localstream').show()
            document.getElementById("div-video").classList.add('col-md-8');
            document.getElementById("div-video-localstream").classList.add('col-md-4');
            var localVideo = document.getElementById("localStream");
            easyrtc.setVideoObjectSrc(localVideo, easyrtc.getLocalStream());
            var remoteVideo = document.getElementById('remoteStream');
            easyrtc.setVideoObjectSrc(remoteVideo, stream);
        });

        //Remove RemoteStream
        easyrtc.setOnStreamClosed(function(callerEasyrtcid) {
            easyrtc.setVideoObjectSrc(document.getElementById('localStream'), "");
            easyrtc.setVideoObjectSrc(document.getElementById('remoteStream'), "");
            easyrtc.closeLocalMediaStream();
        });

        easyrtc.setPeerClosedListener(function() {
            $('#div-chat').show();
            $('#div-video').hide();
            $('#div-video-localstream').hide()
        });
    }


    //Get LocalStream
    // function openStream() {
    //     easyrtc.initMediaSource(function() {
    //         //easyrtc.setVideoDims(640, 480);
    //         //var localVideo = document.getElementById("localStream");
    //         //easyrtc.setVideoObjectSrc(localVideo, easyrtc.getLocalStream());
    //     }, failureCallback);
    // }



    // connect();

    // $('#btnCall').click(function () {
    //     var id = $('#txtEasyId').val();
    //     performCall(id);
    // });

    //Signup Username
    $('#btnSignUp').click(function() {
        connect();
    });

    //Call
    $('#ulUser').on('click', 'li', function() {
        //openStream();
        var id = $(this).attr('id');
        performCall(id);
    });

    $('#icnRejectVideo').click(function() {
        if (checkVideo === true) {
            document.getElementById("icnRejectVideo").innerHTML = "videocam_off";
            enableVideo(false);
            checkVideo = false;
        } else {
            document.getElementById("icnRejectVideo").innerHTML = "videocam";
            enableVideo(true);
            checkVideo = true;
        }
    });


    $('#icnRejectAudio').click(function() {
        if (checkAudio === true) {
            document.getElementById("icnRejectAudio").innerHTML = "mic_off";
            enableAudio(false);
            checkAudio = false;
        } else {
            document.getElementById("icnRejectAudio").innerHTML = "mic";
            enableAudio(true);
            checkAudio = true;
        }
    });

    $('#icnCancelCall').click(function() {
        hangupAll();
    });
    //class="vdLocalStream col-md-2"
    //class="col-md-7 videochat"
    //server send list user
    socket.on('server-send-user', function(arrayUser) {
        $('#div-chat').show();
        $('#div-sign-up').hide();
        $("#ulUser").empty();
        arrayUser.forEach(function(user) {
            var { name, peerId } = user;
            var ulclone = $('.ulList_clone').clone();
            ulclone.removeClass('ulList_clone');
            ulclone.find('#txtName').text(name);
            ulclone.find('li').attr('id', peerId);
            $('#ulUser').append(ulclone.find('li'));
            //$('#ulUser').append(`<li id='${peerId}'>${name}</li>`);
            //$('#txtName').append(`<div id >`)
        });
    });

    //server send new user
    socket.on('server-send-new-user', function(user) {
        var { name, peerId } = user;
        var ulclone = $('.ulList_clone').clone();
        ulclone.removeClass('ulList_clone');
        ulclone.find('#txtName').text(name);
        ulclone.find('li').attr('id', peerId);
        $('#ulUser').append(ulclone.find('li'));
        //$('#ulUser').append(`<li id='${peerId}'>${name}</li>`);
    });

    //client disconnect
    socket.on('client-disconnect', function(peerId) {
        $(`#${peerId}`).remove();
    });

    //signup fail
    socket.on('sign-up-fail', () => alert('User has been sign up!'));


    function performCall(otherEasyrtcid) {
        var successCB = function() {};
        var failureCB = function() {
            // var msg = otherEasyrtcid + " is busy!!"
            // alert(msg);
            //alert("message?: DOMString")
        };

        //set ice server from client
        easyrtc.setIceUsedInCalls({
            "iceServers": [
                { 'urls': 'stun:stun.l.google.com:19302' },
                {
                    'urls': 'turn:numb.viagenie.ca:3478',
                    'username': 'krtacc01@gmail.com',
                    'credential': 'krtacc01'
                }
            ]
        });
        enableVideo(true);
        enableAudio(true);
        easyrtc.call(otherEasyrtcid, successCB, failureCB);
    }

    function enableVideo(checkBoolean) {
        easyrtc.enableCamera(checkBoolean);
    }

    function enableAudio(checkBoolean) {
        easyrtc.enableMicrophone(checkBoolean)
    }

    function hangupAll() {
        easyrtc.hangupAll();
    }

    //var myEasyrtcId; //client id
    var connectSuccess = function(easyrtcId) {
        //myEasyrtcId = easyrtcId;
        console.log('Connect successful, my ID : ' + easyrtcId);
        var username = $('#txtUsername').val();
        $('#my-account').append(username);
        $('#my-peer-id').append(easyrtcId);
        socket.emit('client-sign-up', { name: username, peerId: easyrtcId });
    }

    var failureCallback = function(err, msg) {
        console.log(err);
        console.log(msg);
    }

});