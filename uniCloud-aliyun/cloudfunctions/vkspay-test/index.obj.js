// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const payUtil = require("./payUtil");

// 配置
const config = require("./config");

const db = uniCloud.database();
const _ = db.command;
const $ = _.aggregate;

module.exports = {
	_before: function() {
		if (!config.merchantno || !config.key) {
			throw new Error("请先配置商户号和密钥");
		}
	},
	// 支付回调
	notice: async function(data) {
		const clientInfo = this.getClientInfo();
		let { clientIP, source } = clientInfo;
		if (source !== "http") return { code: -1, msg: "请使用http请求" };
		const httpInfo = this.getHttpInfo();
		console.log('httpInfo: ', httpInfo);
		let body = httpInfo.body;
		if (httpInfo.isBase64Encoded) {
			body = Buffer.from(body, 'base64').toString('utf-8');
		}
		if (typeof body === "string") {
			body = payUtil.urlStringToJson(body);
		}

		console.log('body: ', body)

		let {
			out_trade_no, // 订单号
		} = body;

		// 根据订单号再查一次订单是否真的支付了

		let key = config.key;
		let requestData = {
			"method": "orderquery",
			"merchantno": config.merchantno,
			"out_trade_no": out_trade_no,
			"signaturenonce": payUtil.getSignaturenonce(),
			"timestamp": payUtil.getTimestamp(),
			"version": "2.0"
		};
		// 去除值为undefined的字段
		requestData = JSON.parse(JSON.stringify(requestData));
		// 属性排序
		requestData = payUtil.objectKeySort(requestData);
		// 拼接待签名的字符串
		let signStr = payUtil.jsonToUrlString(requestData);
		// 拼接key
		signStr += `&key=${key}`;
		// 进行MD5签名
		let sign = payUtil.md5(signStr);
		// 请求参数带上签名
		requestData.sign = sign;
		console.log('requestData: ', requestData);
		console.log('sign: ', sign);
		let result = await payUtil.request({
			url: `https://vk-spay-openapi.fsq.pub/api`,
			method: "POST",
			header: {
				"content-type": "application/json; charset=utf-8",
			},
			timeout: 30000,
			data: requestData
		});
		console.log('result: ', result);
		if (result.return_code !== "SUCCESS") {
			console.log("------检测到异步回调疑似伪造，已拦截------");
			console.log("------检测到异步回调疑似伪造，已拦截------");
			console.log("------检测到异步回调疑似伪造，已拦截------");
			// 未支付
			// 不管未支付还是已支付，均返回 { code: "SUCCESS", msg: "SUCCESS" }
			return {
				code: "SUCCESS",
				msg: "SUCCESS"
			}
		}

		// 注意：异步回调有可能会1秒内连续回调两次，故需要自己做好防重判断，即同一个订单号只处理一次
		// 防重示例，记录全部的通知信息，方便模拟重试通知
		try {
			let setRes = await db.collection("vkspay-notice").doc(out_trade_no).set({
				httpInfo,
				notice_time: Date.now()
			});
			if (setRes.updated > 0) {
				// 代表是重复通知，直接拒绝
				console.log("------检测到重复通知，已拦截------");
				console.log("------检测到重复通知，已拦截------");
				console.log("------检测到重复通知，已拦截------");
				return {
					code: "SUCCESS",
					msg: "SUCCESS"
				}
			}

			// 已支付，执行自己的逻辑
			console.log("------已支付，执行自己的逻辑------");

			// 自己的业务逻辑开始-----------------------------------------------------------
			console.log("------自己的业务逻辑开始------");



			console.log("------自己的业务逻辑结束------");
			// 自己的业务逻辑结束-----------------------------------------------------------
		} catch (err) {
			console.error('err: ', err)
		}

		return {
			code: "SUCCESS",
			msg: "SUCCESS"
		}
	},
	/**
	 * 收银台支付
	 */
	webpay: async function(data = {}) {
		// 业务逻辑开始-----------------------------------------------------------
		let {
			total_fee
		} = data;
		if (!total_fee) {
			return { code: -1, msg: "支付金额不能为空" };
		}
		if (Number(total_fee > 0.1)) {
			return { code: -1, msg: "当前为支付试用，最大仅支持0.1元" };
		}
		let key = config.key;
		// 注意：如果回调地址经常不通，会被封号，因此在未对接完异步回调时，建议可先不填异步回调地址，避免被封号
		let requestData = {
			"method": "webpay",
			"merchantno": config.merchantno,
			"total_fee": total_fee,
			"notify_url": "https://fc-mp-262ec330-2ac2-4e79-874a-6ff6f13bceb2.next.bspapp.com/vkspay/notice",
			"signaturenonce": payUtil.getSignaturenonce(),
			"timestamp": payUtil.getTimestamp(),
			"version": "2.0",
		};
		// 去除值为undefined的字段
		requestData = JSON.parse(JSON.stringify(requestData));
		// 属性排序
		requestData = payUtil.objectKeySort(requestData);
		// 拼接待签名的字符串
		let signStr = payUtil.jsonToUrlString(requestData);
		// 拼接key
		signStr += `&key=${key}`;
		// 进行MD5签名
		let sign = payUtil.md5(signStr);
		// 请求参数带上签名
		requestData.sign = sign;
		console.log('requestData: ', requestData)
		console.log('sign: ', sign);
		let result = await payUtil.request({
			url: `https://vk-spay-openapi.fsq.pub/api`,
			method: "POST",
			header: {
				"content-type": "application/json; charset=utf-8",
			},
			timeout: 30000,
			data: requestData
		});
		console.log('result: ', result);
		// 业务逻辑结束-----------------------------------------------------------
		return {
			...result,
			code: 0
		}
	},
	/**
	 * 刷卡支付
	 */
	micropay: async function(data = {}) {
		let res = { code: 0, msg: '' };
		// 业务逻辑开始-----------------------------------------------------------
		let {
			auth_code,
			total_fee
		} = data;
		if (!auth_code) {
			return { code: -1, msg: "请先扫描后输入付款码" };
		}
		if (!total_fee) {
			return { code: -1, msg: "支付金额不能为空" };
		}
		if (Number(total_fee > 0.1)) {
			return { code: -1, msg: "当前为支付试用，最大仅支持0.1元" };
		}

		const clientInfo = this.getClientInfo();
		let key = config.key;
		let requestData = {
			"method": "micropay",
			"merchantno": config.merchantno,
			"total_fee": total_fee,
			"pay_chnl": "wxpay",
			"client_ip": clientInfo.clientIP,
			"auth_code": auth_code,
			"cashier": "default",
			"kuantai": "default",
			"source": "default",
			"pay_cate": "pay",
			"signaturenonce": payUtil.getSignaturenonce(),
			"timestamp": payUtil.getTimestamp(),
			"version": "2.0"
		};

		// 去除值为undefined的字段
		requestData = JSON.parse(JSON.stringify(requestData));
		// 属性排序
		requestData = payUtil.objectKeySort(requestData);
		// 拼接待签名的字符串
		let signStr = payUtil.jsonToUrlString(requestData);
		// 拼接key
		signStr += `&key=${key}`;
		// 进行MD5签名
		let sign = payUtil.md5(signStr);
		// 请求参数带上签名
		requestData.sign = sign;
		console.log('requestData: ', requestData)
		console.log('sign: ', sign);
		let result = await payUtil.request({
			url: `https://vk-spay-openapi.fsq.pub/api`,
			method: "POST",
			header: {
				"content-type": "application/json; charset=utf-8",
			},
			timeout: 30000,
			data: requestData
		});
		console.log('result: ', result);
		// 业务逻辑结束-----------------------------------------------------------
		return {
			...result,
			code: 0
		}
	},
	/**
	 * 查询订单
	 */
	orderquery: async function(data = {}) {
		// 业务逻辑开始-----------------------------------------------------------
		let {
			out_trade_no
		} = data;

		if (!out_trade_no) {
			return { code: -1, msg: "订单号不能为空" };
		}

		let key = config.key;
		let requestData = {
			"method": "orderquery",
			"merchantno": config.merchantno,
			"out_trade_no": out_trade_no,
			"signaturenonce": payUtil.getSignaturenonce(),
			"timestamp": payUtil.getTimestamp(),
			"version": "2.0"
		};
		// 去除值为undefined的字段
		requestData = JSON.parse(JSON.stringify(requestData));
		// 属性排序
		requestData = payUtil.objectKeySort(requestData);
		// 拼接待签名的字符串
		let signStr = payUtil.jsonToUrlString(requestData);
		// 拼接key
		signStr += `&key=${key}`;
		// 进行MD5签名
		let sign = payUtil.md5(signStr);
		// 请求参数带上签名
		requestData.sign = sign;
		console.log('requestData: ', requestData)
		console.log('sign: ', sign);
		let result = await payUtil.request({
			url: `https://vk-spay-openapi.fsq.pub/api`,
			method: "POST",
			header: {
				"content-type": "application/json; charset=utf-8",
			},
			timeout: 30000,
			data: requestData
		});
		console.log('result: ', result);
		// 业务逻辑结束-----------------------------------------------------------
		return {
			...result,
			code: 0
		}
	},
	/**
	 * 订单退款
	 */
	orderrefund: async function(data = {}) {
		// 业务逻辑开始-----------------------------------------------------------
		let {
			out_trade_no,
			refund_fee
		} = data;
		if (!out_trade_no) {
			return { code: -1, msg: "订单号不能为空" };
		}
		if (!refund_fee) {
			return { code: -1, msg: "退款金额不能为空" };
		}
		let key = config.key;
		let requestData = {
			"method": "orderrefund",
			"merchantno": config.merchantno,
			"out_trade_no": out_trade_no,
			"refund_fee": refund_fee,
			"signaturenonce": payUtil.getSignaturenonce(),
			"timestamp": payUtil.getTimestamp(),
			"version": "2.0"
		};
		// 去除值为undefined的字段
		requestData = JSON.parse(JSON.stringify(requestData));
		// 属性排序
		requestData = payUtil.objectKeySort(requestData);
		// 拼接待签名的字符串
		let signStr = payUtil.jsonToUrlString(requestData);
		// 拼接key
		signStr += `&key=${key}`;
		// 进行MD5签名
		let sign = payUtil.md5(signStr);
		// 请求参数带上签名
		requestData.sign = sign;
		console.log('requestData: ', requestData)
		console.log('sign: ', sign);
		let result = await payUtil.request({
			url: `https://vk-spay-openapi.fsq.pub/api`,
			method: "POST",
			header: {
				"content-type": "application/json; charset=utf-8",
			},
			timeout: 30000,
			data: requestData
		});
		console.log('result: ', result);

		//"out_refund_no": "R3493-20230707180825169779",
		// 业务逻辑结束-----------------------------------------------------------
		return {
			...result,
			code: 0
		}
	},
	/**
	 * 订单退款查询
	 */
	orderrefundquery: async function(data) {
		// 业务逻辑开始-----------------------------------------------------------
		let {
			out_trade_no,
			out_refund_no
		} = data;
		if (!out_trade_no) {
			return { code: -1, msg: "订单号不能为空" };
		}
		if (!out_refund_no) {
			return { code: -1, msg: "退款订单不能为空" };
		}
		let key = config.key;
		let requestData = {
			"method": "orderrefundquery",
			"merchantno": config.merchantno,
			"out_trade_no": out_trade_no,
			"out_refund_no": out_refund_no,
			"signaturenonce": payUtil.getSignaturenonce(),
			"timestamp": payUtil.getTimestamp(),
			"version": "2.0"
		};
		// 去除值为undefined的字段
		requestData = JSON.parse(JSON.stringify(requestData));
		// 属性排序
		requestData = payUtil.objectKeySort(requestData);
		// 拼接待签名的字符串
		let signStr = payUtil.jsonToUrlString(requestData);
		// 拼接key
		signStr += `&key=${key}`;
		// 进行MD5签名
		let sign = payUtil.md5(signStr);
		// 请求参数带上签名
		requestData.sign = sign;
		console.log('requestData: ', requestData)
		console.log('sign: ', sign);
		let result = await payUtil.request({
			url: `https://vk-spay-openapi.fsq.pub/api`,
			method: "POST",
			header: {
				"content-type": "application/json; charset=utf-8",
			},
			timeout: 30000,
			data: requestData
		});
		console.log('result: ', result);

		// 业务逻辑结束-----------------------------------------------------------
		return {
			...result,
			code: 0
		}
	},

}