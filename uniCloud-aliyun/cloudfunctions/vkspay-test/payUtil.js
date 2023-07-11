const crypto = require('crypto');

// 将对象内的属性按照ASCII字符顺序进行排序，返回排序后的对象
function objectKeySort(obj) {
	let keys = Object.keys(obj).sort();
	let newObject = {};
	for (let i in keys) {
		newObject[keys[i]] = (obj[keys[i]]);
	}
	return newObject;
};

// json对象转url参数字符串
function jsonToUrlString(json) {
	let str = "";
	for (let key in json) {
		if (json.hasOwnProperty(key)) {
			let value = json[key];
			if (str !== "") {
				str += "&";
			}
			str += key + "=" + value;
		}
	}
	return str;
}


// md5加密
function md5(text) {
	return crypto.createHash('md5').update(text).digest('hex');
}

// 获取支付时间戳
function getTimestamp() {
	return parseInt(Date.now() / 1000);
}

// 获取签名随机字符串
function getSignaturenonce(length=8) {
	let s = "";
	let list = "123456789";
	for (let i = 0; i < length; i++) {
		let code = list[Math.floor(Math.random() * list.length)];
		s += code;
	}
	return s;
}

function urlStringToJson(str) {
	let json = {};
	if (str != "" && str != undefined && str != null) {
		let arr = str.split("&");
		for (let i = 0; i < arr.length; i++) {
			let arrstr = arr[i].split("=");
			let k = arrstr[0];
			let v = arrstr[1];
			json[k] = v;
		}
	}
	return json;
}



async function request(obj = {}) {
	if (Object.prototype.toString.call(obj.content) === "[object object]") obj.content = JSON.stringify(obj.content);
	if (typeof obj.dataType === "undefined") obj.dataType = "json";
	// 当返回的是二进制时，需要设置dataType = default
	if (obj.dataType == "default" || obj.dataType === "") delete obj.dataType;
	if (obj.useContent) obj.content = JSON.stringify(obj.data);
	if (!obj.method) obj.method = "POST";
	obj.method = obj.method.toUpperCase();
	if (typeof obj.headers === "undefined" && typeof obj.header !== "undefined") {
		obj.headers = obj.header;
	}
	let originalRes = await uniCloud.httpclient.request(obj.url, obj);
	if (!obj.needOriginalRes && originalRes && originalRes.data) {
		return originalRes.data;
	} else {
		return originalRes;
	}
};

module.exports = {
	objectKeySort,
	jsonToUrlString,
	md5,
	getTimestamp,
	getSignaturenonce,
	urlStringToJson,
	request
};