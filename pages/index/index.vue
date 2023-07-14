<template>
	<view class="app">
		<!-- 页面示例开始 -->
		<view class="page-content">

			<view class="card">
				<view style="margin-bottom: 8px;">支付金额（单位元）：</view>
				<input class="input" type="text" v-model="formData.total_fee" placeholder="支付金额" />
				<view style="margin-bottom: 8px;">订单号</view>
				<input class="input" type="text" v-model="formData.out_trade_no" placeholder="订单号" />
				<button class="button" type="primary" @click="createPayment">发起支付</button>
				<button class="button" type="default" @click="afreshPayment" v-if="formData.out_trade_no">原订单发起支付</button>
				<button class="button" @click="queryPayment">支付结果查询</button>
			</view>

			<view class="hr"></view>

			<view class="card">
				<view style="margin-bottom: 8px;">退款（单位元）：</view>
				<input class="input" type="text" v-model="formData.refund_fee" placeholder="退款金额" />
				<view style="margin-bottom: 8px;">退款单号</view>
				<input class="input" type="text" v-model="formData.out_refund_no" placeholder="退款单号" />
				<button class="button" @click="refund">申请退款</button>
				<button class="button" @click="queryRefund">退款结果查询</button>
			</view>

			<view class="hr"></view>

			<view class="card">
				<view style="margin-bottom: 8px;">用户付款条形码</view>
				<input class="input" type="text" v-model="formData.auth_code" placeholder="用户付款条形码" />
				<button class="button" type="default" @click="micropay">刷卡支付</button>
				<button class="button" @click="queryPayment">支付结果查询</button>
			</view>

		</view>
		<!-- 页面示例结束 -->

		<!-- 弹窗开始 -->

		<!-- 二维码支付弹窗开始 -->
		<view class="pay-qrcode-popup" v-if="qrcodePopup.show">
			<view class="pay-qrcode-popup-mask" @click="closePopup"></view>
			<view class="pay-qrcode-popup-content">
				<vk-uni-qrcode :text="payUrl" :size="225" unit="px"></vk-uni-qrcode>
				<view class="pay-qrcode-popup-info">
					<view>
						<text class="pay-qrcode-popup-info-fee">{{ formData.total_fee }}</text>
						<text>元</text>
					</view>
					<view style="font-size: 14px;" v-if="qrcodePopup.mode === 'qrcode'">
						<text>请用</text>
						<text style="color: #22ac38;font-weight: bold;margin: 0 2px;font-size: 18px;">微信</text>
						<text>或</text>
						<text style="color: #027aff;font-weight: bold;margin: 0 2px;font-size: 18px;">支付宝</text>
						<text>扫码支付</text>
					</view>
					<view style="font-size: 14px;" v-else-if="qrcodePopup.mode === 'scheme'">
						<text>请用</text>
						<text style="color: #22ac38;font-weight: bold;margin: 0 2px;font-size: 18px;">微信</text>
						<text>扫码支付（先截屏）</text>
						<!-- <view>请先截屏保存二维码，再点击</view>
						<view style="color: #22ac38;font-weight: bold;margin: 0 2px;font-size: 18px;">我已截屏现在去微信支付</view>
						<view>按钮调起微信扫一扫，最后选择刚保存的图片进行识别二维码支付</view> -->
					</view>
				</view>
				<button type="primary" class="btn-success" v-if="qrcodePopup.mode === 'scheme'" style="margin-bottom: 10px;" @click="toWeixinScanqrcode">前往微信</button>
				<button type="primary" @click="queryPayment">我已完成支付</button>
			</view>
		</view>
		<!-- 二维码支付弹窗结束 -->

		<!-- 外部浏览器H5支付弹窗确认开始 -->
		<!-- <view class="pay-confirm-popup" v-if="vkPay.confirmShow">
			<view class="pay-confirm-popup-content">
				<view class="pay-confirm-popup-title">请确认支付是否已完成</view>
				<view><button type="primary" @click="queryPayment">已完成支付</button></view>
				<view class="pay-confirm-popup-refresh"><button type="default" @click="afreshPayment">支付遇到问题，重新支付</button></view>
				<view class="pay-confirm-popup-cancel" @click="vkPay.confirmShow = false">暂不支付</view>
			</view>
		</view> -->
		<!-- 外部浏览器H5支付弹窗确认结束 -->

		<!-- 弹窗结束 -->
	</view>
</template>

<script>
	const vkspayTest = uniCloud.importObject("vkspay-test");

export default {
	data() {
		// 页面数据变量
		return {
			// 表单请求数据
			formData: {
				total_fee: 0.01,
				out_trade_no: "",
				out_refund_no: "",
				auth_code: "",
				refund_fee: 0.01
			},
			qrcodePopup:{
				show: false,
				mode: "qrcode",
				type: ""
			},
			orders: {},
			payUrl: "", // 支付链接地址
		};
	},
	// 监听 - 页面每次【加载时】执行(如：前进)
	onLoad(options = {}) {

	},
	// 监听 - 页面每次【显示时】执行(如：前进和返回) (页面每次出现在屏幕上都触发，包括从下级页面点返回露出当前页面)
	onShow() {

	},
	// 监听 - 页面每次【隐藏时】执行(如：返回)
	onHide() {

	},
	// 函数
	methods: {
		// 发起支付
		createPayment(obj = {}) {
			vkspayTest.webpay({
				total_fee: this.formData.total_fee
			}).then((res)=>{
				console.log('webpay-res: ', res)
				if (res.return_code === "SUCCESS") {
					// 请求成功
					let out_trade_no = res.data.out_trade_no; // 订单号
					let url = res.data.qrcode; // 支付链接地址
					this.callPayment({
						out_trade_no: out_trade_no,
						url: url,
						total_fee: this.formData.total_fee
					});
				} else {
					// 请求失败
					uni.showToast({
						title: res.return_msg || res.msg || "请求失败",
						icon: "none"
					});
				}
			}).catch((err)=>{
				// 请求异常
				uni.showToast({
					title: err.message || "请求异常",
					icon: "none"
				});
			});
		},
		callPayment(order={}){
			let {
				out_trade_no,
				url,
				total_fee
			} = order;
			this.formData.out_trade_no = out_trade_no;
			this.formData.refund_fee = total_fee; // 方便演示一键全额退款
			this.formData.total_fee = total_fee;
			// 如果是PC浏览器、小程序、app，则需要弹出二维码
			let payMode = this.getPayMode({ url });
			if (payMode.mode === "link") {
				// 跳转url链接支付
				window.location.href = payMode.url;
			} else if (payMode.mode === "scheme") {
				// 跳转scheme协议支付
				let itemList = ["微信支付","支付宝"];
				uni.showActionSheet({
					itemList:["微信支付","支付宝"],
					success: (e) => {
						let item = itemList[e.tapIndex];
						if (item === "微信支付") {
							// 如果是微信支付，需要弹窗二维码，让用户保存图片，再自动打开微信调用扫一扫，选择刚保存的图片
							this.openQrcodePopup({
								url:  payMode.wxpay,
								total_fee: total_fee,
								mode: "scheme",
								type: "wxpay"
							});
						} else {
							window.location.href = payMode.alipay;
						}
					}
				});
			} else {
				// 默认均为弹窗扫码支付
				this.openQrcodePopup({
					url:  payMode.url,
					total_fee: total_fee
				});
			}
			// 临时存储订单号和支付链接地址的关系
			this.orders[out_trade_no] = {
				out_trade_no: out_trade_no,
				url: url,
				total_fee: total_fee
			};
			// 其他环境则直接访问url即可支付
		},
		toWeixinScanqrcode(){
			window.location.href = "weixin://scanqrcode";
		},
		// 打开二维码支付弹窗
		openQrcodePopup(obj={}){
			let { url, total_fee, mode, type } = obj;
			this.qrcodePopup.show = true;
			this.qrcodePopup.mode = mode;
			this.qrcodePopup.type = type;
			this.payUrl = url;
			if (total_fee) this.formData.total_fee = total_fee;
		},
		// 重新支付
		afreshPayment() {
			// 重新唤起支付前先查询下订单是否已支付
			vkspayTest.orderquery({
				out_trade_no: this.formData.out_trade_no
			}).then((res)=>{
				if (res.return_code !== "SUCCESS") {
					let order = this.orders[this.formData.out_trade_no];
					if (order && order.url) {
						this.callPayment(order);
					}
				} else {
					// 支付成功
					this.closePopup();
					uni.showToast({
						title: "支付成功",
						icon: "success"
					});
				}
			});
		},
		// 刷卡支付
		micropay(){
			vkspayTest.micropay({
				auth_code: this.formData.auth_code,
				total_fee: this.formData.total_fee
			}).then((res)=>{
				console.log('micropay-res: ', res)
				if (res.return_code === "SUCCESS") {
					// 请求成功
					uni.showToast({
						title: "支付成功",
						icon: "success"
					});
				} else {
					// 请求失败
					uni.showToast({
						title: res.return_msg || res.msg || "请求失败",
						icon: "none"
					});
				}
			}).catch((err)=>{
				// 请求异常
				uni.showToast({
					title: err.message || "请求异常",
					icon: "none"
				});
			});
		},
		// 支付状态查询
		queryPayment() {
			vkspayTest.orderquery({
				out_trade_no: this.formData.out_trade_no
			}).then((res)=>{
				console.log('orderquery-res: ', res)
				if (res.return_code !== "SUCCESS") {
					// 未支付
					uni.showToast({
						title: res.return_msg || res.msg,
						icon: "none"
					});
				} else {
					// 支付成功
					this.closePopup();
					uni.showToast({
						title: "支付成功",
						icon: "success"
					});
				}
			});
		},
		// 退款，此为演示，实际业务开发不应该写在前端，而是写在云函数中。
		refund() {
			vkspayTest.orderrefund({
				out_trade_no: this.formData.out_trade_no,
				refund_fee: this.formData.refund_fee,
			}).then((res)=>{
				console.log('orderrefund-res: ', res)
				if (res.return_code !== "SUCCESS") {
					// 退款失败
					uni.showToast({
						title: res.return_msg || res.msg,
						icon: "none"
					});
				} else {
					this.formData.out_refund_no = res.out_refund_no;
					// 退款成功
					uni.showToast({
						title: "退款成功",
						icon: "success"
					});
				}
			});
		},
		// 退款查询
		queryRefund() {
			vkspayTest.orderrefundquery({
				out_trade_no: this.formData.out_trade_no,
				out_refund_no: this.formData.out_refund_no
			}).then((res)=>{
				console.log('orderrefundquery-res: ', res)
				if (res.return_code !== "SUCCESS") {
					// 退款失败
					uni.showToast({
						title: res.return_msg || res.msg,
						icon: "none"
					});
				} else {
					// 退款成功
					uni.showToast({
						title: "退款成功",
						icon: "success"
					});
				}
			});
		},
		// 关闭弹窗
		closePopup() {
			this.qrcodePopup.show = false;
			this.qrcodePopup.mode = "qrcode";
			this.qrcodePopup.type = "";
			this.payUrl = "";
		},
		// 支付模式
		getPayMode(obj){
			let {
				url
			} = obj;
			let data = {
				mode: "qrcode", // 扫码支付
				url
			};
			// #ifdef H5
			if (["h5-weixin", "h5-alipay"].indexOf(this.h5Env) > -1) {
				data = {
					mode: "link",
					url,
					alipay: url,
					wxpay: url
				}
			} else {
				// 如果是手机，也不需要
				if (this.h5PlatformCom !== "pc") {
					data = {
						mode: "scheme",
						url: `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(url)}`,
						alipay: `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(url)}`,
						wxpay: url
					}
				} else {
					// 如果是电脑，则弹窗扫码支付
					data = {
						mode: "qrcode",
						url,
						alipay: url,
						wxpay: url
					}
				}
			}
			// #endif

			// #ifdef MP
			// 如果是微信小程序，则弹窗扫码支付
			data = {
				mode: "qrcode",
				url,
				alipay: url,
				wxpay: url
			}
			// #endif

			// #ifdef APP
			// 如果是APP，则弹窗扫码支付
			data = {
				mode: "qrcode",
				url,
				alipay: url,
				wxpay: url
			}
			// #endif
			return data;
		}
	},
	// 计算属性
	computed: {
		// h5运行环境
		h5Env(){
			// #ifdef H5
			let ua = window.navigator.userAgent.toLowerCase();
			if (ua.match(/MicroMessenger/i) == 'micromessenger' && (ua.match(/miniprogram/i) == 'miniprogram')) {
				// 微信小程序
				return "mp-weixin";
			}
			if (ua.match(/MicroMessenger/i) == 'micromessenger') {
				// 微信公众号
				return "h5-weixin";
			}
			if (ua.match(/alipay/i) == 'alipay' && ua.match(/miniprogram/i) == 'miniprogram') {
				// 支付宝小程序
				return "mp-alipay";
			}
			if (ua.match(/alipay/i) == 'alipay') {
				// 支付宝内
				return "h5-alipay";
			}
			// 外部 H5
			return "h5";
			// #endif
		},
		h5PlatformCom(){
			// #ifdef H5
			let system = {
				win: false,
				mac: false,
				xll: false
			};
			let p = navigator.platform;
			system.win = p.indexOf("Win") == 0;
			system.mac = p.indexOf("Mac") == 0;
			system.x11 = p == "X11" || p.indexOf("Linux") == 0;
			if (system.win || system.mac || system.xll) {
				let ua = navigator.userAgent.toLowerCase();
				if (ua.indexOf("micromessenger") > -1) {
					// 微信开发者工具下访问（注意微信开发者工具下无法唤起微信公众号支付）
					return "weixin";
				} else {
					return "pc";
				}
			} else {
				if (p.indexOf("iPhone") > -1 || p.indexOf("iPad") > -1) {
					return "ios";
				} else {
					return "android";
				}
			}
			// #endif
		},
	}
};
</script>
<style lang="scss" scoped>
/* 示例页面样式开始 */
.card{
	padding: 15px;
}
.hr{
	height: 10px;
	background-color: #cecece;;
	width: calc(100%);
	margin: 30px 0;
	box-sizing: border-box;
	display: block;
}
.page-content {
	.input {
		width: 100%;
		height: 46px;
		border: solid 1px #dddddd;
		border-radius: 5px;
		margin-bottom: 15px;
		padding: 0px 15px;
		box-sizing: border-box;
	}
	.button {
		margin-bottom: 15px;
	}
}
.btn-success{
	background-color: #22ac38;
	color: #fff;
}
/* 示例页面样式结束 */

/* 外部浏览器H5支付弹窗确认开始 */
.pay-confirm-popup {
	position: fixed;
	z-index: 2;
	width: 100vw;
	top: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
	.pay-confirm-popup-content {
		width: 275px;
		margin: 50% auto 0 auto;
		background-color: #ffffff;
		border-radius: 5px;
		padding: 20px;
		.pay-confirm-popup-title {
			text-align: center;
			padding: 10px 0;
			margin-bottom: 15px;
		}
		.pay-confirm-popup-refresh{
			margin-top: 10px;
		}
		.pay-confirm-popup-cancel{
			margin-top: 10px;
			text-align: center;
		}
	}
}
/* 外部浏览器H5支付弹窗确认结束 */

/* 二维码支付弹窗开始 */
.pay-qrcode-popup {
	position: fixed;
	z-index: 2;
	width: 100vw;
	top: 0;
	bottom: 0;
	.pay-qrcode-popup-mask {
		position: absolute;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.6);
	}
	.pay-qrcode-popup-content {
		position: relative;
		width: 250px;
		margin: 17vh auto 0 auto;
		background-color: #ffffff;
		border-radius: 5px;
		padding: 20px;
		box-sizing: content-box;
		text-align: center;
		.pay-qrcode-popup-info{
			text-align: center;
			padding: 10px;
			.pay-qrcode-popup-info-fee{
				color: red;
				font-size: 30px;
				font-weight: bold;
			}
		}
		.pay-qrcode-popup-image{
			width: 225px;
			height: 225px;
		}
	}
}
/* 二维码支付弹窗结束 */
</style>
