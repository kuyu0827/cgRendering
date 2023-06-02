//シーンの追加での実装のための無理やりな実装になってしまいました。

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";
import * as Physijs from "physijs-webpack";
import Stats from "stats.js";
import TWEEN from "@tweenjs/tween.js";

class ThreeJSContainer {
    private scene: THREE.Scene;
    private geometry: THREE.Geometry;
    private material: THREE.Material;
    private cube: THREE.Mesh;
    private light: THREE.Light;
    private cloud: THREE.Points;
    private pvelocity: THREE.Vector3[];
    private camera: THREE.PerspectiveCamera
    

    constructor() {
        this.createScene();
    }

    // 画面部分の作成(表示する枠ごとに)
    public createRendererDOM = (
        width: number,
        height: number,
        cameraPos: THREE.Vector3
    ) => {
    

        //カメラの設定
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.copy(cameraPos);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        let renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(0x000000));
        renderer.setSize(window.innerWidth, window.innerHeight);

        let orbitControls = new OrbitControls(this.camera, renderer.domElement);
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.2;
        // 毎フレームのupdateを呼んで，render
        // reqestAnimationFrame により次フレームを呼ぶ
        let render: FrameRequestCallback = (time) => {
            orbitControls.update();

            renderer.render(this.scene, this.camera);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);

        renderer.domElement.style.cssFloat = "left";
        renderer.domElement.style.margin = "10px";
        return renderer.domElement;
    };



    // シーンの作成(全体で1回)
    private createScene = () => {
        this.scene = new THREE.Scene();

        //個数x個数のcount
        let countP = 5000;
        let cameraSpeed = 0.15;

        //GUIの追加
        let controls = {
            count : 50000,
            cameraSpeed : 0.15
        };

        //幅256で自動的に場所を決める
        let gui = new dat.GUI({ autoPlace: true, width: 256 });

        gui.add(controls, "count", 0, 100000).onChange((e: number) => {
            //ここにGUIにより値が変わったときの動作を追記
            //eの値をcountPに代入する
            countP = e;
            renewGeo();
        });

        gui.add(controls, "cameraSpeed", -0.5, 0.5).onChange((e: number) => {
            //ここにGUIにより値が変わったときの動作を追記
            //eの値をcountSpeedに代入する
            cameraSpeed = e;
        });

        function generate() {
            const canvas = document.createElement('canvas');
            canvas.width = 20;
            canvas.height = 20;
            const context = canvas.getContext('2d');
            const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.3, 'rgba(0,255,255,1)');
            gradient.addColorStop(0.6, 'rgba(0,0,64,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,1)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }

        //canvasにテクスチャを作成
        function generate_points() {
            const canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 16;
            const context = canvas.getContext('2d');
            const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.1, 'rgba(255,200,160,0.3)');
            gradient.addColorStop(0.2, 'rgba(97,37,0,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,1)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }


         //ジオメトリの頂点の作成
        function createPoints(geom) {
                const material = new THREE.PointsMaterial({
    　　        color: 0xffffff,
                size: 3,
                transparent: true,
                blending: THREE.AdditiveBlending,
                map: generate_points(),//canvasをmapで渡す
                depthWrite: false
            });
 
            const cloud = new THREE.Points(geom, material);
            return cloud;
        }

        //ジオメトリの作成
        const geom = new THREE.TorusKnotGeometry(300, 60.9, 2600, 110, 60, 30);
        //マテリアルの作成
        const knot = createPoints(geom);
        this.scene.add(knot);

        let createParticles = () => {
            //ジオメトリの作成
            let geom = new THREE.Geometry();

            //マテリアルの作成
            let material = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 3,
                transparent: true,
                blending: THREE.AdditiveBlending,
                map: generate(),//canvasをmapで渡す
                depthWrite: false
            });
            
            const range = 2000;
            for (var i = 0; i < countP; i++) {
                //THREE.Vector3(x,y,z)
                const particle = new THREE.Vector3(
                  Math.random() * range - range / 2, 
                  Math.random() * range - range / 2,
                  Math.random() * range - range / 2);
              
               //頂点をジオメトリに追加
                geom.vertices.push(particle);
              
               //頂点の色を追加
                const color = new THREE.Color(0xeffffc);
                geom.colors.push(color);
            }
            
            //THREE.Pointsの作成
            this.cloud = new THREE.Points(geom, material);
            geom.verticesNeedUpdate = true;
            //シーンへの追加
            this.scene.add(this.cloud);
        };

        //ベジェ曲線の再描画
        let renewGeo = () => {
            //シーンを削除
            this.scene.remove(this.cloud);
            //再生成
            createParticles();
        };

        //最初の生成

        createParticles();
        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        let lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        let update: FrameRequestCallback = (time) => {
            let geom = <THREE.Geometry>this.cloud.geometry;
            let vertices = geom.vertices;
            this.camera.position.z += cameraSpeed;
            this.camera.position.y += (Math.sin(cameraSpeed) * 2);;

            geom.verticesNeedUpdate = true;

            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    };
}

let container = new ThreeJSContainer();

let viewport = container.createRendererDOM(
    640,
    480,
    new THREE.Vector3(0, -1000, 0)
);
document.body.appendChild(viewport);
