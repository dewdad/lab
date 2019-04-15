const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);

let pc;
let peerStream;
let defer;
let sdpOption = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};
const video = document.getElementById('video');
const configuration = {};

window.addEventListener('storage', message => {
    console.log('localStorage:', message.key, message.newValue);
    switch (message.key) {
        case 'offer':
            onReciveOffer(message.newValue);
            break;
        case 'answer':
            onReciveAnswer(message.newValue);
            break;
        case 'iceOffer':
            onReciveIceOffer(message.newValue);
            break;
        case 'iceAnswer':
            onReciveIceAnswer(message.newValue);
    }
});

function getUserMedia() {
    return navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
}

function onReciveOffer(offer) {
    answer(JSON.parse(offer));
}

function onReciveAnswer(answer) {
    pc.setRemoteDescription(JSON.parse(answer));
}

function onReciveIceOffer(iceOffer) {
    defer.then(() => {
        pc.addIceCandidate(JSON.parse(iceOffer));
    });
}

function onReciveIceAnswer(iceAnswer) {
    pc.addIceCandidate(JSON.parse(iceAnswer));
}

function call() {
    pc = new RTCPeerConnection(configuration);
    pc.addEventListener('icecandidate', e => onIceCandidate(e, 'iceOffer'));
    pc.addEventListener('addstream', e => {
        peerStream = e.stream;
        video.srcObject = e.stream;
    });
    // pc.addEventListener('track', e => {
    //     video.srcObject = e.streams[0];
    // });
    getUserMedia().then(stream => {
        pc.addStream(stream);
        // stream.getTracks().forEach(track => pc.addTrack(track, stream));
        createOffer();
    });
}

function createOffer() {
    pc.createOffer(sdpOption).then(offer => {
        pc.setLocalDescription(offer).then(() => {});
        localStorage.setItem('offer', JSON.stringify(offer));
    });
}

function answer(offer) {
    pc = new RTCPeerConnection(configuration);
    pc.addEventListener('icecandidate', e => onIceCandidate(e, 'iceAnswer'));
    pc.addEventListener('addstream', e => {
        peerStream = e.stream;
        video.srcObject = e.stream;
    });
    pc.addEventListener('removestream', () => {
        video.srcObject = null;
    });
    // pc.addEventListener('track', e => {
    //     video.srcObject = e.streams[0];
    // });

    defer = getUserMedia().then(stream => {
        pc.addStream(stream);
        // stream.getTracks().forEach(track => pc.addTrack(track, stream));
        return pc.setRemoteDescription(offer).then(() => {
            pc.createAnswer().then(answer => {
                pc.setLocalDescription(answer).then(() => {});
                localStorage.setItem('answer', JSON.stringify(answer));
            });
        });
    });
}

function onIceCandidate(e, type) {
    localStorage.setItem(type, JSON.stringify(e.candidate));
}

function hangup() {
  pc.removeStream(peerStream);
  peerStream && peerStream.getTracks().forEach(track => track.stop());
  pc.close();
  pc = null;
}
