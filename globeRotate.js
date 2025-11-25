class GlobeRotate {
    constructor(viewer) {
        this._viewer = viewer;
        this._isCtrlPressed = false; // 标记 Ctrl 键是否按下
        this._icrfEnabled = false; // 标记 ICRF 旋转是否启用
    }
    _icrf() {
        if (this._viewer.scene.mode !== Cesium.SceneMode.SCENE3D || this._isCtrlPressed) {
            return true;
        }
        let icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(this._viewer.clock.currentTime);
        if (icrfToFixed) {
            let camera = this._viewer.camera;
            let offset = Cesium.Cartesian3.clone(camera.position);
            let transform = Cesium.Matrix4.fromRotationTranslation(icrfToFixed);
            camera.lookAtTransform(transform, offset);
        }
    }
    _bindEvent() {
        // 1. 监听 Ctrl 键按下/松开（全局）
        this._onCtrlKeyDown = (e) => {
            if (e.key === 'Control') {
                if (!this._isCtrlPressed) {
                    this._isCtrlPressed = true;
                    // 按下 Ctrl 时，强制暂停 ICRF 旋转（避免覆盖拖拽）
                    this._viewer.scene.postUpdate.removeEventListener(this._icrf, this);
                    this._viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); // 重置变换矩阵
                }
            }
        };

        this._onCtrlKeyUp = (e) => {
            if (e.key === 'Control') {
                this._isCtrlPressed = false;
                // 松开 Ctrl 后，延迟恢复 ICRF 旋转（可选，提升体验）
                setTimeout(() => {
                    if (this._icrfEnabled) {
                        this._viewer.scene.postUpdate.addEventListener(this._icrf, this);
                    }
                }, 300);
            }
        };
        document.addEventListener('keydown', this._onCtrlKeyDown);
        document.addEventListener('keyup', this._onCtrlKeyUp);
        this._viewer.scene.postUpdate.addEventListener(this._icrf, this);
        this._icrfEnabled = true;

    }
    _unbindEvent() {
        // 解绑所有事件，避免内存泄漏
        document.removeEventListener('keydown', this._onCtrlKeyDown);
        document.removeEventListener('keyup', this._onCtrlKeyUp);
        this._viewer.scene.postUpdate.removeEventListener(this._icrf, this);
        this._viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); // 重置变换矩阵
        this._icrfEnabled = false;
        this._isCtrlPressed = false;

    }
    start() {
        this._viewer.clock.shouldAnimate = true;
        this._unbindEvent();
        this._bindEvent();
        return this;
    }
    stop() {
        this._unbindEvent();
        return this;
    }
}
