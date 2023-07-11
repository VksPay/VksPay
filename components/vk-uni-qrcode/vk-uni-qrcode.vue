<template xlang="wxml" minapp="mpvue">
	<view class="vk-qrcode" v-if="canvasId && text !== ''">
		<!-- #ifndef MP-ALIPAY -->
		<canvas class="vk-qrcode-canvas" :canvas-id="canvasId" :style="{width:cpSize+'px',height:cpSize+'px'}" />
		<!-- #endif -->
		<!-- #ifdef MP-ALIPAY -->
		<canvas :id="canvasId" :width="cpSize" :height="cpSize" class="vk-qrcode-canvas" />
		<!-- #endif -->
		<view v-if="show === false"></view>
		<image class="vk-qrcode-image" :src="result" :style="{width:cpSize+'px',height:cpSize+'px'}" v-else-if="!loading && result"/>
		<view class="loading-text" :style="'width: '+size+unit+';height: '+size+unit+';'" v-else>
			{{ loadingText }}
		</view>
	</view>
</template>

<script>
import QRCode from "./qrcode.js"
let qrcode;

export default {
	name: "vk-uni-qrcode",
	props: {
		value: {
			type: String,
		},
		text: {
			type: String,
			default: ''
		},
		size: {
			type: Number,
			default: 200
		},
		unit: {
			type: String,
			default: 'rpx'
		},
		show: {
			type: Boolean,
			default: true
		},
		background: {
			type: String,
			default: '#ffffff'
		},
		foreground: {
			type: String,
			default: '#000000'
		},
		pdground: {
			type: String,
			default: '#000000'
		},
		image: {
			type: String,
			default: ''
		},
		imageSize: {
			type: Number,
			default: 40
		},
		lv: {
			type: Number,
			default: 3
		},
		onval: {
			type: Boolean,
			default: true
		},
		loadMake: {
			type: Boolean,
			default: true
		},
		usingComponents: {
			type: Boolean,
			default: true
		},
		showLoading: {
			type: Boolean,
			default: false
		},
		loadingText: {
			type: String,
			default: '二维码生成中'
		},
		// 让组件强制进入loading状态
		loading: {
			type: Boolean,
			default: false
		},
	},
	data() {
		return {
			result: '',
			canvasId:"",
		}
	},
	methods: {
		_makeCode() {
			let that = this
			if (!this._empty(this.text)) {
				qrcode = new QRCode({
					context: that, // 上下文环境
					canvasId:that.canvasId, // canvas-id
					usingComponents: that.usingComponents, // 是否是自定义组件
					showLoading: that.showLoading, // 是否显示loading
					loadingText: that.loadingText, // loading文字
					text: that.text, // 生成内容
					size: that.cpSize, // 二维码大小
					background: that.background, // 背景色
					foreground: that.foreground, // 前景色
					pdground: that.pdground, // 定位角点颜色
					correctLevel: that.lv, // 容错级别
					image: that.image, // 二维码图标
					imageSize: that.imageSize,// 二维码图标大小
					cbResult: function (res) { // 生成二维码的回调
						that._result(res);
					},
				});
			} else {
				uni.showToast({
					title: '二维码内容不能为空',
					icon: 'none',
					duration: 2000
				});
			}
		},
		_clearCode() {
			this._result('')
			qrcode.clear()
		},
		_saveCode() {
			let that = this;
			if (this.result != "") {
				uni.saveImageToPhotosAlbum({
					filePath: that.result,
					success: function () {
						uni.showToast({
							title: '二维码保存成功',
							icon: 'success',
							duration: 2000
						});
					}
				});
			}
		},
		_result(res) {
			this.result = res;
			this.$emit('result', res);
			this.$emit('input', res)
		},
		_empty(v) {
			let tp = typeof v,
				rt = false;
			if (tp == "number" && String(v) == "") {
				rt = true
			} else if (tp == "undefined") {
				rt = true
			} else if (tp == "object") {
				if (JSON.stringify(v) == "{}" || JSON.stringify(v) == "[]" || v == null) rt = true
			} else if (tp == "string") {
				if (v == "" || v == "undefined" || v == "null" || v == "{}" || v == "[]") rt = true
			} else if (tp == "function") {
				rt = false
			}
			return rt
		},
		getBase64(){
			return this.result;
		}
	},
	watch: {
		size: function (n, o) {
			if (n != o && !this._empty(n)) {
				this.cSize = n
				if (!this._empty(this.text)) {
					setTimeout(() => {
						this._makeCode()
					}, 100);
				}
			}
		},
		text: function (n, o) {
			let that = this;
			if (that.onval) {
				if (n != o && !that._empty(n)) {
					if (that.textTimer) clearTimeout(that.textTimer);
					that.textTimer = setTimeout(() => {
						that._makeCode()
					}, 300);
				}
			}
		}
	},
	computed: {
		cpSize() {
			if(this.unit == "rpx"){
				return uni.upx2px(this.size)
			}else{
				return this.size
			}
		}
	},
	mounted: function () {
		this.canvasId = "vk-qrcode-canvas-"+ Math.floor(Math.random()*1000000);
		if (this.loadMake) {
			if (!this._empty(this.text)) {
				setTimeout(() => {
					this._makeCode()
				}, 100);
			}
		}
	},
}
</script>
<style scoped>
.vk-qrcode {
	/* #ifndef APP-VUE */
	display: flex;
	/* #endif */
  position: relative;
	justify-content: center;
	align-items: center;
	flex-direction: column;
}
.vk-qrcode-image{
	/* #ifndef APP-VUE */
	display: block;
	/* #endif */
}
.loading-text{
	/* #ifndef APP-VUE */
	display: flex;
	/* #endif */
	color: #9a9a9a;
	justify-content: center;
	align-items: center;
	flex-direction: column;
}
.vk-qrcode-canvas {
  position: fixed;
  top: -99999rpx;
  left: -99999rpx;
  z-index: -99999;
}
</style>
