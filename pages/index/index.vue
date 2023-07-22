<template>
	<view class="app">
		<!-- 页面示例开始 -->
		<view class="page-content">
			<view class="card">
				<view class="title">支付示例</view>
				<view class="content">
					<view style="margin-bottom: 8px">支付金额（单位元）：</view>
					<input class="input" type="text" v-model="formData.total_fee" placeholder="支付金额" />
					<view style="margin-bottom: 8px">订单号</view>
					<input class="input" type="text" v-model="formData.out_trade_no" placeholder="订单号" />
					<button class="button" type="primary" @click="createPayment">发起支付</button>
					<button class="button" type="default" @click="afreshPayment" v-if="formData.out_trade_no">原订单发起支付</button>
					<button class="button" type="default" @click="queryPayment">支付结果查询</button>
				</view>
			</view>

			<view class="card">
				<view class="title">退款示例</view>
				<view class="content">
					<view style="margin-bottom: 8px">退款（单位元）：</view>
					<input class="input" type="text" v-model="formData.refund_fee" placeholder="退款金额" />
					<view style="margin-bottom: 8px">退款单号</view>
					<input class="input" type="text" v-model="formData.out_refund_no" placeholder="退款单号" />
					<button class="button" type="warn" @click="refund">申请退款</button>
					<button class="button" type="default" @click="queryRefund">退款结果查询</button>
				</view>
			</view>

			<view class="card">
				<view class="title">刷条形码支付示例</view>
				<view class="content">
					<view style="margin-bottom: 8px">用户付款条形码</view>
					<input class="input" type="text" v-model="formData.auth_code" placeholder="用户付款条形码" />
					<button class="button" type="primary" @click="micropay">刷卡支付</button>
					<button class="button" type="default" @click="queryPayment">支付结果查询</button>
				</view>
			</view>
		</view>
		<!-- 页面示例结束 -->

		<!-- 弹窗开始 -->

		<!-- 二维码支付弹窗开始 -->
		<view class="pay-qrcode-popup" v-if="payPopup.show">
			<view class="pay-qrcode-popup-mask" @click="closePopup"></view>
			<view class="pay-qrcode-popup-content">
				<vk-uni-qrcode ref="qrcode" :text="payPopup.qrcode" :size="225" unit="px"></vk-uni-qrcode>
				<view class="pay-qrcode-popup-info">
					<view>
						<text class="pay-qrcode-popup-info-fee">{{ formData.total_fee }}</text>
						<text>元</text>
					</view>
					<template v-if="!typeCom">
						<view class="pay-qrcode-popup-tips-box">
							<text>请用</text>
							<text class="pay-qrcode-popup-type-text wxpay">微信</text>
							<text>或</text>
							<text class="pay-qrcode-popup-type-text alipay">支付宝</text>
							<text>扫码支付</text>
						</view>
					</template>
					<template v-else-if="payPopup.type === 'wxpay'">
						<view class="pay-qrcode-popup-tips-box">
							<text>请用</text>
							<text class="pay-qrcode-popup-type-text wxpay">微信</text>
							<text>扫码支付</text>
							<text v-if="payPopup.mode === 'scheme'">（先截屏）</text>
							<view class="pay-qrcode-popup-type-tips">支付完成后，返回页面点【我已完成支付】</view>
						</view>
					</template>
					<template v-else-if="payPopup.type === 'alipay'">
						<view class="pay-qrcode-popup-tips-box">
							<text>请用</text>
							<text class="pay-qrcode-popup-type-text alipay">支付宝</text>
							<text>支付</text>
							<view class="pay-qrcode-popup-type-tips">支付完成后，返回页面点【我已完成支付】</view>
						</view>
					</template>
				</view>
				<button
					type="primary"
					:class="payPopup.type === 'wxpay' ? 'pay-qrcode-popup-btn-success' : ''"
					v-if="payPopup.mode === 'scheme'"
					style="margin-bottom: 10px"
					@click="toPayByScheme(payPopup.type)"
				>
					前往{{ typeCom }}
				</button>
				<button type="primary" :class="payPopup.type === 'alipay' ? 'pay-qrcode-popup-btn-success' : ''" @click="queryPayment">我已完成支付</button>
			</view>
		</view>
		<!-- 二维码支付弹窗结束 -->

		<!-- 弹窗结束 -->
	</view>
</template>

<script>
// 引入vkspay-test测试云对象
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
			// 支付弹窗
			payPopup: {
				show: false, // 是否打开弹窗
				mode: "qrcode", // qrcode 二维码 scheme 跳协议头支付 link 跳链接支付
				type: "", // wxpay 微信支付 alipay 支付宝支付
				qrcode: "", // 二维码支付链接地址
				alipay: "", // 支付宝支付链接
				wxpay: "", // 微信支付链接
			},
			orders: {} // 订单数据缓存
		};
	},
	// 监听 - 页面每次【加载时】执行(如：前进)
	onLoad(options = {}) {
		// 如果是同步回调过来的，执行下查询
		if (options.return && options.out_trade_no) {
			this.formData.out_trade_no = options.out_trade_no;
			this.queryPayment();
		}
	},
	// 监听 - 页面每次【显示时】执行(如：前进和返回) (页面每次出现在屏幕上都触发，包括从下级页面点返回露出当前页面)
	onShow() {},
	// 监听 - 页面每次【隐藏时】执行(如：返回)
	onHide() {},
	// 函数
	methods: {
		// 创建支付订单
		async createPayment() {
			try {
				let res = await vkspayTest.webpay({
					total_fee: this.formData.total_fee
				});
				console.log("webpay-res: ", res);
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
			} catch (err) {
				// 请求异常
				uni.showToast({
					title: err.message || "请求异常",
					icon: "none"
				});
			}
		},
		// 发起支付
		callPayment(order = {}) {
			let { out_trade_no, url, total_fee } = order;
			this.formData.out_trade_no = out_trade_no;
			this.formData.total_fee = total_fee;
			this.formData.refund_fee = total_fee; // 方便演示一键全额退款
			// 如果是PC浏览器、小程序、app，则需要弹出二维码
			let payInfo = this.getPayInfo(url);
			this.payPopup.wxpay = payInfo.wxpay;
			this.payPopup.alipay = payInfo.alipay;
			if (payInfo.mode === "link") {
				// 跳转url链接支付
				// 记录当前页面数据，因为支付完会强制关闭页面，因此下次进入任意页面后，应该在App.vue的onLaunch里再跳回来
				let nowUrl = window.location.href;
				// 在当前url上带上参数，代表是同步跳转过来的
				let returnUrl = this.addOrUpdateURLParameter(nowUrl, {
					return: 1,
					out_trade_no: out_trade_no
				});
				uni.setStorageSync("VksPay.returnUrl", returnUrl);
				uni.showModal({
					title: "提示",
					content: `支付结果查询链接已复制到您的剪切板，待支付完成后，您可以通过向文件助手粘贴链接或点击本站任意链接均可即可查看支付结果`,
					showCancel: false,
					confirmText: "去支付",
					success: () => {
						// 同时也将结果链接存进剪切板，方便复制粘贴再次进去
						// h5中setClipboardData必须在用户点击事件中触发，故写在uni.showModal的点击回调中执行
						uni.setClipboardData({
							data: returnUrl,
							showToast: false
						});
						window.location.href = payInfo.qrcode;
					}
				});
			} else if (payInfo.mode === "scheme") {
				// 跳转scheme协议支付
				let itemList = ["支付宝", "微信支付"];
				uni.showActionSheet({
					itemList: itemList,
					success: e => {
						let item = itemList[e.tapIndex];
						if (item === "微信支付") {
							// 如果是微信支付，需要弹窗二维码，让用户保存图片，再自动打开微信调用扫一扫，选择刚保存的图片
							// #ifdef APP
							// APP可以先帮用户截屏
							this.openPopup({
								qrcode: payInfo.qrcode,
								total_fee: total_fee,
								mode: "scheme",
								type: "wxpay"
							});
							setTimeout(() => {
								let base64 = this.$refs.qrcode.getBase64();
								uni.saveImageToPhotosAlbum({
									filePath: base64,
									success: () => {
										uni.showModal({
											title: "提示",
											content: "支付二维码已自动保存到您的相册，请打开微信扫一扫，从相册选择最新保存的支付二维码进行支付",
											showCancel: false,
											confirmText: "打开微信扫一扫",
											success: () => {
												plus.runtime.openURL(payInfo.wxpay);
											}
										});
									}
								});
							}, 1000);
							// #endif

							// #ifndef APP
							this.openPopup({
								qrcode: payInfo.qrcode,
								total_fee: total_fee,
								mode: "scheme",
								type: "wxpay"
							});
							// #endif
						} else {
							this.openPopup({
								qrcode: payInfo.qrcode,
								total_fee: total_fee,
								mode: "scheme",
								type: "alipay"
							});
							// #ifdef APP
							plus.runtime.openURL(payInfo.alipay);
							// #endif

							// #ifndef APP
							window.location.href = payInfo.alipay;
							// #endif
						}
					}
				});
			} else {
				// 默认均为弹窗扫码支付
				this.openPopup({
					qrcode: payInfo.qrcode,
					total_fee: total_fee,
					mode: "qrcode"
				});
				// #ifdef MP
				setTimeout(() => {
					let base64 = this.$refs.qrcode.getBase64();
					uni.saveImageToPhotosAlbum({
						filePath: base64,
						success: () => {
							uni.showModal({
								title: "提示",
								content: "支付二维码已保存到您的相册，请打开wx或zfb扫一扫，从相册选择最新保存的支付二维码进行支付",
								showCancel: false,
								confirmText: "我知道了"
							});
						}
					});
				}, 1000);
				// #endif
			}
			// 临时存储订单号和支付链接地址的关系
			this.orders[out_trade_no] = {
				out_trade_no: out_trade_no,
				url: url,
				total_fee: total_fee
			};
		},
		// 根据scheme调起支付
		toPayByScheme(type) {
			let { payPopup } = this;
			if (type === "wxpay") {
				window.location.href = payPopup.wxpay;
			} else {
				window.location.href = payPopup.alipay;
			}
		},
		// 打开二维码支付弹窗
		openPopup(obj = {}) {
			let { qrcode, total_fee, mode, type } = obj;
			this.payPopup.show = true;
			this.payPopup.mode = mode;
			this.payPopup.type = type;
			// #ifdef MP-WEIXIN
			this.payPopup.type = "wxpay";
			// #endif
			// #ifdef MP-ALIPAY
			this.payPopup.type = "alipay";
			// #endif
			this.payPopup.qrcode = qrcode;
			if (total_fee) this.formData.total_fee = total_fee;
		},
		// 关闭弹窗
		closePopup() {
			this.payPopup.show = false;
			// 重置数据
			this.payPopup.mode = "qrcode";
			this.payPopup.type = "";
			this.payPopup.qrcode = "";
		},
		// 获取支付信息，识别支付模式
		getPayInfo(url) {
			let data = {
				mode: "qrcode", // 扫码支付
				qrcode: url
			};
			// #ifdef H5
			if (["h5-weixin", "h5-alipay"].indexOf(this.h5Env) > -1) {
				data = {
					mode: "link",
					qrcode: url,
					alipay: url,
					wxpay: url
				};
			} else if (["h5-qq"].indexOf(this.h5Env) > -1) {
				let alipayUrl = `alipays://platformapi/startapp?saId=10000007&qrcode=${url}`;
				data = {
					mode: "scheme",
					qrcode: url,
					//alipay: alipayUrl,
					//alipay: `https://render.alipay.com/p/s/i?scheme=${encodeURIComponent(alipayUrl)}`,
					alipay: `https://ulink.alipay.com?scheme=${encodeURIComponent(alipayUrl)}`,
					//alipay: `https://ds.alipay.com?scheme=${encodeURIComponent(alipayUrl)}`,
					wxpay: `weixin://scanqrcode`
				};
			} else {
				// 如果是手机，也不需要
				if (this.h5PlatformCom !== "pc") {
					//let alipayUrl = `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(url)}`;
					//let alipayUrl = `alipays://platformapi/startapp?saId=10000007&qrcode=${encodeURIComponent(url)}?_s=web-other`;
					let alipayUrl = `alipays://platformapi/startapp?saId=10000007&qrcode=${url}`;
					data = {
						mode: "scheme",
						qrcode: url,
						alipay: alipayUrl,
						//alipay: `https://ulink.alipay.com?scheme=${encodeURIComponent(alipayUrl)}`,
						wxpay: `weixin://scanqrcode`
					};
				} else {
					// 如果是电脑，则弹窗扫码支付
					data = {
						mode: "qrcode",
						qrcode: url,
						alipay: url,
						wxpay: url
					};
				}
			}
			// #endif

			// #ifdef MP
			// 如果是微信小程序，则弹窗扫码支付
			data = {
				mode: "qrcode",
				qrcode: url,
				alipay: url,
				wxpay: url
			};
			// #endif

			// #ifdef APP
			// 如果是APP，则弹窗扫码支付
			//let alipayUrl = `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(url)}`;
			let alipayUrl = `alipays://platformapi/startapp?saId=10000007&qrcode=${url}`;
			data = {
				mode: "scheme",
				qrcode: url,
				//alipay: alipayUrl,
				//alipay: `https://render.alipay.com/p/s/i?scheme=${encodeURIComponent(alipayUrl)}`,
				alipay: `https://ulink.alipay.com?scheme=${encodeURIComponent(alipayUrl)}`,
				wxpay: `weixin://scanqrcode`
			};
			// #endif
			return data;
		},
		// #ifdef H5
		addOrUpdateURLParameter(url, paramsObj) {
			const urlObject = new URL(url);
			const searchParams = urlObject.searchParams;

			for (const key in paramsObj) {
				if (paramsObj.hasOwnProperty(key)) {
					const value = paramsObj[key];
					searchParams.set(key, value);
				}
			}

			urlObject.search = searchParams.toString();
			return urlObject.toString();
		},
		// #endif
		// 重新支付
		async afreshPayment() {
			// 重新唤起支付前先查询下订单是否已支付
			let res = await vkspayTest.orderquery({
				out_trade_no: this.formData.out_trade_no
			});
			if (res.return_code !== "SUCCESS") {
				let order = this.orders[this.formData.out_trade_no];
				if (order && order.url) {
					this.callPayment(order);
				} else {
					uni.showModal({
						title: "提示",
						content: `原订单已取消，请重新支付`,
						showCancel: true,
						confirmText: "重新支付",
						cancelText: "取消",
						success: res => {
							if (res.confirm) {
								this.createPayment();
							}
						}
					});
				}
			} else {
				// 支付成功
				this.closePopup();
				uni.showToast({
					title: "支付成功",
					icon: "success"
				});
			}
		},
		// 刷卡支付
		async micropay() {
			try {
				let res = await vkspayTest.micropay({
					auth_code: this.formData.auth_code,
					total_fee: this.formData.total_fee
				});

				console.log("micropay-res: ", res);
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
			} catch (err) {
				// 请求异常
				uni.showToast({
					title: err.message || "请求异常",
					icon: "none"
				});
			}
		},
		// 支付状态查询
		async queryPayment() {
			let res = await vkspayTest.orderquery({
				out_trade_no: this.formData.out_trade_no
			});
			console.log("orderquery-res: ", res);
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
		},
		// 退款，此为演示，实际业务开发不应该写在前端，而是写在云函数中。
		async refund() {
			let res = await vkspayTest.orderrefund({
				out_trade_no: this.formData.out_trade_no,
				refund_fee: this.formData.refund_fee
			});
			console.log("orderrefund-res: ", res);
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
		},
		// 退款查询
		async queryRefund() {
			let res = await vkspayTest.orderrefundquery({
				out_trade_no: this.formData.out_trade_no,
				out_refund_no: this.formData.out_refund_no
			});
			console.log("orderrefundquery-res: ", res);
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
		}
	},
	// 计算属性
	computed: {
		// h5运行环境
		h5Env() {
			// #ifdef H5
			let ua = window.navigator.userAgent.toLowerCase();
			if (ua.match(/MicroMessenger/i) == "micromessenger" && ua.match(/miniprogram/i) == "miniprogram") {
				// 微信小程序
				return "mp-weixin";
			}
			if (ua.match(/MicroMessenger/i) == "micromessenger") {
				// 微信公众号
				return "h5-weixin";
			}
			if (ua.match(/alipay/i) == "alipay" && ua.match(/miniprogram/i) == "miniprogram") {
				// 支付宝小程序
				return "mp-alipay";
			}
			if (ua.match(/alipay/i) == "alipay") {
				// 支付宝内
				return "h5-alipay";
			}
			if (ua.match(/QQ/i) == "qq") {
				// qq内
				return "h5-qq";
			}
			// 外部 H5
			return "h5";
			// #endif
		},
		// h5运行平台
		h5PlatformCom() {
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
		// 当前支付方式中文表示
		typeCom() {
			let { payPopup = {} } = this;
			let type = payPopup.type;
			let typeObj = {
				wxpay: "微信支付",
				alipay: "支付宝"
			};
			return typeObj[type];
		}
	}
};
</script>
<style lang="scss" scoped>
/* 示例页面样式开始 */
page,
.app{
	background-color: #f8f8f8;
}
.page-content {
	padding: 1px 0;
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
.card {
	margin: 10px;
	background-color: #ffffff;
	border-radius: 10px;
	box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
	.title{
		padding: 15px;
		font-weight: bold;
		font-size: 17px;
		border-bottom: 1px solid #ebeef5
	}
	.content{
		padding: 15px;
	}
}
/* 示例页面样式结束 */

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
		.pay-qrcode-popup-info {
			text-align: center;
			padding: 10px;
			.pay-qrcode-popup-info-fee {
				color: red;
				font-size: 30px;
				font-weight: bold;
			}
			.pay-qrcode-popup-tips-box {
				font-size: 14px;
				.pay-qrcode-popup-type-text {
					font-weight: bold;
					margin: 0 2px;
					font-size: 18px;
					&.wxpay {
						color: #22ac38;
					}
					&.alipay {
						color: #027aff;
					}
				}
				.pay-qrcode-popup-type-tips {
					font-size: 12px;
				}
			}
		}
		.pay-qrcode-popup-image {
			width: 225px;
			height: 225px;
		}
	}
	.pay-qrcode-popup-btn-success {
		background-color: #22ac38;
		color: #fff;
	}
}
/* 二维码支付弹窗结束 */
</style>
