<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// #ifdef H5
			let returnUrl = uni.getStorageSync("VksPay.returnUrl");
			if (returnUrl) {
				// 先删除缓存，再跳转页面（因为只需要跳转一次即可）
				uni.removeStorageSync("VksPay.returnUrl");
				window.location.href = returnUrl;
			}
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
