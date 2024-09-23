console.log("qrloader/index.js");
const video = document.getElementById("video");
const cameraCanvas = document.getElementById("videoCanvas");
const arCanvas = document.getElementById("arCanvas");
const context = cameraCanvas.getContext("2d");

navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
  video.play();
});

let threeScene;

video.addEventListener("loadedmetadata", () => {
  cameraCanvas.width = video.videoWidth;
  cameraCanvas.height = video.videoHeight;
  arCanvas.width = video.videoWidth;
  arCanvas.height = video.videoHeight;
  threeScene = new ThreeScene(arCanvas, video.videoWidth, video.videoHeight);
  //threeInit(video.videoWidth, video.videoHeight);
  qrScan();
});

function qrScan() {
  context.drawImage(video, 0, 0, cameraCanvas.width, cameraCanvas.height);

  // QRコードを読み取る
  const imageData = context.getImageData(
    0,
    0,
    cameraCanvas.width,
    cameraCanvas.height
  );

  // カメラの中心に十字を描画
  context.strokeStyle = "white";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(cameraCanvas.width / 2, 0);
  context.lineTo(cameraCanvas.width / 2, cameraCanvas.height);
  context.moveTo(0, cameraCanvas.height / 2);
  context.lineTo(cameraCanvas.width, cameraCanvas.height / 2);
  context.stroke();

  const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
  if (qrCode) {
    const {
      topLeftCorner,
      topRightCorner,
      bottomRightCorner,
      bottomLeftCorner,
    } = qrCode.location;

    //console.log("QRコード内容:", qrCode);

    // 赤い線を描画する
    context.strokeStyle = "yellow";

    context.beginPath();
    context.moveTo(topLeftCorner.x, topLeftCorner.y);
    context.lineTo(topRightCorner.x, topRightCorner.y);
    context.lineTo(bottomRightCorner.x, bottomRightCorner.y);
    context.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
    context.closePath();
    context.stroke();

    threeScene.changeCamera(
      topLeftCorner,
      topRightCorner,
      bottomRightCorner,
      bottomLeftCorner
    );

    // Three.jsのレンダリング
    threeScene.render();
  }

  requestAnimationFrame(qrScan);
}

class ThreeScene {
  constructor(canvas, width, height) {
    this.width = width;
    this.height = height;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
    this.camera.position.z = 10;
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
    this.renderer.setSize(width, height);

    const planeScale = 2;
    const geometry = new THREE.PlaneGeometry(planeScale, planeScale);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.plane = new THREE.Mesh(geometry, material);
    this.pivot = new THREE.Object3D(); // ピボットオブジェクト
    this.scene.add(this.pivot);
    //this.pivot.position.set(-planeScale, planeScale, 0);
    this.pivot.attach(this.camera);
    this.scene.add(this.plane);
  }

  distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }
  center(p1, p2) {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  changeCamera(
    topLeftCorner,
    topRightCorner,
    bottomRightCorner,
    bottomLeftCorner
  ) {
    //this.camera.position.set(0, 0, 3);
    const ax = topRightCorner.x - topLeftCorner.x;
    const ay = topRightCorner.y - topLeftCorner.y;
    const angle = Math.atan2(ay, ax);

    const topLength = this.distance(topLeftCorner, topRightCorner);
    const bottomLength = this.distance(bottomLeftCorner, bottomRightCorner);
    const leftLength = this.distance(topLeftCorner, bottomLeftCorner);
    const rightLength = this.distance(topRightCorner, bottomRightCorner);

    const rateX = Math.abs(topLength) / Math.abs(bottomLength);
    const rateY = Math.abs(leftLength) / Math.abs(rightLength);

    const leftCenter = this.center(topLeftCorner, bottomLeftCorner);
    const rightCenter = this.center(topRightCorner, bottomRightCorner);
    const leftToRight = this.distance(leftCenter, rightCenter);
    const topCenter = this.center(topLeftCorner, topRightCorner);
    const bottomCenter = this.center(bottomLeftCorner, bottomRightCorner);
    const topToBottom = this.distance(topCenter, bottomCenter);

    const centerX = this.width / 2; //topLeftCorner.x;
    const centerY = this.height / 2; //topLeftCorner.y;

    const dx =
      (Math.abs(this.distance(topLeftCorner, topRightCorner)) +
        Math.abs(this.distance(bottomLeftCorner, bottomRightCorner))) /
      2;
    const dy =
      (Math.abs(this.distance(topLeftCorner, bottomLeftCorner)) +
        Math.abs(this.distance(topRightCorner, bottomRightCorner))) /
      2;

    const scaleX = 1 / (dx / this.width); // QRコードの幅を計算
    const scaleY = 1 / (dy / this.height); // QRコードの幅を計算

    // 座標変換（キャンバス座標からthree.jsの座標系に変換）
    const normalizedX = (centerX / this.width) * 2 - 1;
    const normalizedY = -(centerY / this.height) * 2 + 1;

    const left = 0; //-normalizedX * scaleX - 1;
    const top = 0; //-normalizedY * scaleY + 1;

    //this.pivot.rotation.x = 0.3 * Math.PI;
    // this.pivot.position.set(3, 0, 0);

    this.pivot.rotation.z = angle;
    this.pivot.rotation.x = (rateX - 1) * -Math.PI;
    this.pivot.rotation.y = (rateY - 1) * -Math.PI;

    this.camera.position.set(
      left,
      top,
      10
      // *1.2は物理です。はい。
      //((scaleX + scaleY) / 2) * 1.2
    );
    /*


    // カメラの位置と回転をQRコードの中心に合わせる
    */
  }
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
