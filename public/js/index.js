(function(){

var issueInstance = (function(){

	function showIssue(no, issue){
		var cont = document.getElementById('content');

		var issueLastUpdatedEle = cont.querySelector('.js-time-last-updated');
		if(issueLastUpdatedEle){
			var issueLastUpdated = issueLastUpdatedEle.textContent;
			if(issueLastUpdated){
				issueLastUpdated = new Date(issueLastUpdated);
				if((new Date(issue.created)).getTime() <= issueLastUpdated.getTime()){
					console.log('...数据并不新，不更新...');
					return;
				}
			}
		}

		cont.innerHTML = '<h2>第'+no+'期：'+issue.title+'</h2><div class="js-time-last-updated" hidden>'+issue.created+'</div>'+getIssueContHtml(no,issue.list);
		// cont.insertAdjacentHTML('beforeend', '<h2>第'+no+'期：'+issue.title+'</h2><div class="js-time-last-updated" hidden>'+issue.created+'</div>'+getIssueContHtml(no,issue.list));
	}
	function getIssueContHtml(no, issue){
		var html = '';
		var tpl = document.getElementById('tpl').innerHTML;
		for(let i in issue){
			var item = issue[i];
			var video = ppt = '';
			if(item.video){
				video = '<a href="'+item.video+'">视频</a>';
			}
			if(item.ppt){
				ppt = '<a href="'+item.ppt+'">资料下载</a>';
			}

			html += tpl.replace('{theme}', item.theme)
					   .replace('{brief}', item.brief)
					   .replace('{author}', item.author)
					   .replace('{profile}', item.profile)
					   .replace('{video}', video)
					   .replace('{ppt}', ppt);
		}

		return html;
	}

	function getAsyncData(no){
		var url = '/issues/' + no;
		console.log('...[web app] request "' + url + '"');

		var networkDataReceived = false;

		var networkUpdate = function(){
			console.log('...[web app] fetch from network');
			fetch(url).then(function(response){
				return response.json();
			}).then(function(data) {
				console.log('...[web app] data from network: "', data);
				networkDataReceived = true;
				showIssue(no, data);
			});
		}

		// 从缓存中取
		if ('caches' in window) {
			caches.match(url).then(function(response){
				if(!response) throw Error("Cache No Data");
				return response.json();
			}).then(function(data){
				// 优先网络上的
				if(!networkDataReceived){
					console.log('...[web app] data from cache: "', data);
					showIssue(no, data);
				}
			}).catch(function(e){
				// console.error(e);
				// // 缓存优先，若失败则退化到网络
				// networkUpdate();
			});
		}

		// 从网络上取
		networkUpdate();
	}

	return {
		show: getAsyncData
	}
})();


function initPage(){
	var issue_no = localStorage.getItem('issues');
	if(issue_no){
		issueInstance.show(issue_no); //简化处理：仅以第1期为例
	}

	var issueSelect = document.getElementById('issues');
	document.getElementById('btn-add').addEventListener('click', function(){
		localStorage.setItem('issues', issueSelect.value);
		issueInstance.show(issueSelect.value);
	});
}
initPage();



/**
 * 推送通知
 **/
var pushNotifyInstance = (function(){
	let swRegistration = null;
	let isSubscribed = false;
	const pushButton = document.querySelector('#btn-push');

	const applicationServerPublicKey = 'BEEgekSVwBG99VogMLJ6Zb4kgWa1_ElsXf4iCj2Xo-L9PRJg3Vwp4O2Ks8VVqw1VC7ZUiuyzrAuXwGlH0c_jTTs';

	function urlB64ToUint8Array(base64String) {
		const padding = '='.repeat((4 - base64String.length % 4) % 4);
		const base64 = (base64String + padding)
		.replace(/\-/g, '+')
		.replace(/_/g, '/');

		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}
	function updateSubscriptionOnServer(subscription) {
		const subscriptionDetails = document.querySelector('.js-subscription-details');
		const subscriptionJson = document.querySelector('.js-subscription-json');

		if (subscription) {
			subscriptionJson.textContent = JSON.stringify(subscription);
			subscriptionDetails.classList.remove('is-invisible');
		} else {
			subscriptionDetails.classList.add('is-invisible');
		}
	}

	function subscribeUser(){
		const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
		swRegistration.pushManager
			.subscribe({
				userVisibleOnly: true,
				applicationServerKey: applicationServerKey
			}).then(function(pushSubscription) {
				updateSubscriptionOnServer(pushSubscription);

				console.log('用户订阅成功！');
				isSubscribed = true;
				updateBtn();
			}).catch(function(err){
				console.log('用户订阅失败: ', err);
				updateBtn();
			});
	}
	function unsubscribeUser() {
		swRegistration.pushManager
			.getSubscription()
			.then(function(subscription) {
				if(subscription) {
					return subscription.unsubscribe();
				}
			}).catch(function(error) {
				console.log('取消订阅发生错误', error);
			}).then(function() {
				updateSubscriptionOnServer(null);

				console.log('用户取消订阅成功！');
				isSubscribed = false;
				updateBtn();
			});
	}

	function updateBtn() {
		if (Notification.permission === 'denied') {
			pushButton.textContent = '用户拒绝授权';
			pushButton.disabled = true;
			updateSubscriptionOnServer(null);
			return;
		}

		if (isSubscribed) {
			pushButton.textContent = '取消订阅';
		} else {
			pushButton.textContent = '订阅';
		}

		pushButton.disabled = false;
	}
	function initialiseUI(swR) {
		swRegistration = swR;

		// 是否订阅
		swRegistration.pushManager
			.getSubscription()
			.then(function(subscription) {
				isSubscribed = !(subscription === null);

				updateSubscriptionOnServer(subscription);

				if(isSubscribed){
					console.log('用户已经订阅');
				}else{
					console.log('用户没有订阅');
				}

				updateBtn();
		});

		pushButton.addEventListener('click', function() {
			pushButton.disabled = true;
			if (isSubscribed) {
				unsubscribeUser();
			}else{
				subscribeUser();
			}
		});
	}

	return {
		init: initialiseUI
	}
})();



if('serviceWorker' in navigator){
	navigator.serviceWorker
		.register('./sw.js')
		.then(function(swReg){
			// console.log('Service Worker Registered');
			console.log('Service Worker Registered', swReg);

			// 推送消息
			if('PushManager' in window){
				console.log('Service Worker and Push is supported');
				pushNotifyInstance.init(swReg);
			}

			// sync
			return swReg.sync.getTags();

		}).then(function(tags) {

			if (tags.includes('myFirstSync')){
				console.log('已经存在一个标签名为 myFirstSync 的后台同步，它处于pending状态 (同名的会被合并，最后只触发一次)');
			};
		}).catch(function(err) {
			console.log('It broke (probably sync not supported or flag not enabled)');
			console.log(err.message);
		});
}



/**
 * 后台同步
 **/
var syncInstance = function(){

	var isSyncSupported = ('serviceWorker' in navigator && 'SyncManager' in window);

	document.querySelector('#btn-sync').addEventListener('click', function(e){
		e.preventDefault();
		if(isSyncSupported){
			new Promise(function(resolve, reject){
				Notification.requestPermission(function(result){
					if (result!=='granted'){
						return reject(Error("此页面未授权通知"));
					}
					resolve();
				})
			}).then(function() {
				return navigator.serviceWorker.ready;
			}).then(function(reg) {
				return reg.sync.register('myFirstSync');
			}).then(function() {
				console.log('...[web app] Sync "myFirstSync" 注册成功');
			}).catch(function(err) {
				console.log('...[web app] Sync 注册失败');
				console.log(err.message);
			});
		}else{
			console.log('...[web app] 不支持 serviceWorker/SyncManager');
		}
	});

}
syncInstance();






})();