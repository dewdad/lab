const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);

let pc1;
let pc2;
let localStream;
let sdpOption = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const configuration = {};

function call() {
    let pcOffer = pc1 = new RTCPeerConnection(configuration);
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
        offer(pcOffer);
    });
}

function offer(pcOffer) {
    localStream.getTracks().forEach(track => pcOffer.addTrack(track, localStream));

    pcOffer.createOffer(sdpOption).then(offer => {
        pcOffer.setLocalDescription(offer).then(() => {});
        answer(offer, pcOffer);
    });
}

function answer(offer, pcOffer) {
    let pcAnswer = pc2 = new RTCPeerConnection(configuration);
    
    pcOffer.addEventListener('icecandidate', e => onIceCandidate(pcAnswer, e));
    pcAnswer.addEventListener('icecandidate', e => onIceCandidate(pcOffer, e)); 

    pcAnswer.addEventListener('track', e => {
        remoteVideo.srcObject = e.streams[0];
    });

    pcAnswer.setRemoteDescription(offer).then(() => {
        pcAnswer.createAnswer().then(answer => {
            pcAnswer.setLocalDescription(answer).then(() => {});
            pcOffer.setRemoteDescription(answer);
        });
    });
}

function onIceCandidate(pc, e) {
    pc.addIceCandidate(e.candidate);
}

function hangup() {
  pc1 && pc1.close();
  pc2 && pc2.close();
  pc1 = null;
  pc2 = null;
  localStream && localStream.getTracks().forEach(track => track.stop());
}
