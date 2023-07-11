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
					<view style="font-size: 14px;">
						<text>请用</text>
						<text style="color: #22ac38;font-weight: bold;margin: 0 2px;font-size: 18px;">微信</text>
						<text>或</text>
						<text style="color: #027aff;font-weight: bold;margin: 0 2px;font-size: 18px;">支付宝</text>
						<text>扫码支付</text>
					</view>
				</view>
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
				show: false
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
			// 如果是PC浏览器、小程序、app，则需要弹出二维码
			if (this.needShowQrcode) {
				this.qrcodePopup.show = true;
				this.payUrl = url;
				this.formData.total_fee = total_fee;
			} else {
				window.location.href = url;
			}
			// 临时存储订单号和支付链接地址的关系
			this.orders[out_trade_no] = {
				out_trade_no: out_trade_no,
				url: url,
				total_fee: total_fee
			};
			// 其他环境则直接访问url即可支付
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
			this.payUrl = "";
		}
	},
	// 计算属性
	computed: {
		// 是否需要二维码
		needShowQrcode(){
			let show = false;
			// #ifdef H5
			if (["h5-weixin", "h5-alipay"].indexOf(this.h5Env) > -1) {
				show = false;
			} else {
				show = true;
			}
			// #endif
			
			// #ifdef MP
			show = true;
			// #endif
			
			// #ifdef APP
			show = true;
			// #endif
			return show;
		},
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
		}
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
		margin: 20vh auto 0 auto;
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
