import 'aframe';
import 'mind-ar/dist/mindar-image-aframe.prod.js';

import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

//const videoElement = document.createElement('a-canvas');
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
});

hands.onResults((results) => {
    if (results.multiHandLandmarks.length > 0) {
        const handPosition = results.multiHandLandmarks[0][9]; // 手の中央あたりの座標を取得
        console.log(handPosition);
        updateArrowDirection(handPosition);
    }
});

let videoElement = null;
document.querySelector('a-scene').addEventListener('arReady', () => {
    const camera = document.getElementById('camera');
    videoElement = document.querySelector('video');
    console.log(videoElement.nodeName, camera);
    
    

    requestAnimationFrame(processFrame);
    
    console.log()
});

const markerElem = document.getElementById('marker');
async function processFrame() {
    await hands.send({image: videoElement});
    // 次のフレームを処理するためにリクエスト

    requestAnimationFrame(processFrame);
}
/*
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
});*/

function updateArrowDirection(handPosition) {
    console.log(markerElem);
    markerElem.style.top = window.innerHeight * handPosition.y;
    markerElem.style.left = window.innerWidth * handPosition.x;

    //const arrow = document.querySelector('#arrow');
    // 手の位置に基づいて矢印の回転を計算
    //const x = handPosition.x * 2 - 1; // 座標を-1から1の範囲に変換
    //const y = 1 - handPosition.y * 2; // y座標の反転
    //arrow.object3D.lookAt(new THREE.Vector3(x, y, -1));
}