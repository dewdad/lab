const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const recorderButton = document.getElementById('recorderButton');
const downloadButton = document.getElementById('downloadButton');

callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);
recorderButton.addEventListener('click', startRecord);
downloadButton.addEventListener('click', download);

var pc;
let localStream;
let remoteStream;
let defer;
let sdpOption = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};
let count = 0;
const recorderEl = document.getElementById('recorder');
const video = document.getElementById('video');
const configuration = {};

localStorage.clear();
window.addEventListener('storage', message => {
    // console.log('localStorage:', message.key, message.newValue);
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
            break;
        case 'hangup':
            hangup();
    }
});

let recordedBlobs;
let recorderUrl;
var recorder;
function startRecord(e) {
    let target = e.currentTarget;
    if (target.innerText === 'Record') {
        recordedBlobs = [];
        target.innerText = 'Stop';
        if (recorder) {
            recorder.start(100);
            return;
        }
        recorder = new MediaRecorder(remoteStream, {mimeType: 'video/webm'});
        recorder.onstop = onRecorderStop;
        recorder.ondataavailable = onRecorderDataAvailable;
        recorder.start(100);
    }
    else {
        target.innerText = 'Record';
        recorder.stop();
    }
}

function onRecorderStop() {
    const blob = new Blob(recordedBlobs, {type: 'video/webm'});
    recorderUrl = window.URL.createObjectURL(blob);
    recorderEl.src = recorderUrl;
}

function onRecorderDataAvailable(e) {
    if (e.data && e.data.size > 0) {
        recordedBlobs.push(e.data);
    }
}

function download() {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = recorderUrl;
    a.download = 'stream.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(recorderUrl);
    }, 100);
}

function getUserMedia() {
    pc.addEventListener('iceconnectionstatechange', () => {
        console.log('iceconnectionstatechange', pc.iceConnectionState);
    });

    pc.addEventListener('icegatheringstatechange', () => {
        console.log('icegatheringstatechange', pc.iceGatheringState);
    });

    pc.addEventListener('connectionstatechange', () => {
        console.log('connectionstatechange', pc.connectionState);
    });

    pc.addEventListener('signalingstatechange', () => {
        console.log('signalingstatechange', pc.connectionState);
    });

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
        video.srcObject = remoteStream = e.stream;
    });

    getUserMedia().then(stream => {
        localStream = stream;
        pc.addStream(localStream);
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
        video.srcObject = remoteStream = e.stream;
    });
    // pc.addEventListener('track', e => {
    //     video.srcObject = e.streams[0];
    // });

    defer = getUserMedia().then(stream => {
        localStream = stream;
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
    localStorage.setItem('hangup', ++count);
    localStream && localStream.getTracks().forEach(track => {
        track.stop();
    });
    pc.close();
    // pc = null;
}
