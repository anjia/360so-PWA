var dataCacheName = 'issueData-api';
var cacheName = 'appShell-assets';
var filesToCache = [
	'/',
	'/css/common.css',
	'css/index.css',
	'/js/index.js',
	'https://p.ssl.qhimg.com/t015417e7ae1b162e37.png'
];


self.addEventListener('install', function(e){
	console.log('[ServiceWorker] Install');
	e.waitUntil(
		caches.open(cacheName).then(function(cache){
			console.log('[ServiceWorker] Install then(): Caching app shell');
			// cache.addAll(cacheName_1);
			return cache.addAll(filesToCache);
		})
	);
});


self.addEventListener('activate', function(e){
	console.log('[ServiceWorker] Activate');
	e.waitUntil(
		caches.keys().then(function(keyList){
			return Promise.all(keyList.map(function(key){
				console.log('[ServiceWorker] Activate: Removing old cache', key);
				if(key!==cacheName && key!==dataCacheName){
					console.log('[ServiceWorker] Activate: delete()');
					return caches.delete(key);
				}
			}));
		})
	);
});


self.addEventListener('fetch', function(e){
	console.log('[ServiceWorker] Fetch', e.request.url);

	var dataUrl = '/issues/';
	if(e.request.url.indexOf(dataUrl)!=-1){
		e.respondWith(
			fetch(e.request).then(function(response){
				return caches.open(dataCacheName).then(function(cache){
					console.log('[ServiceWorker] Fetched & Update Cached DataAPI');
					cache.put(e.request.url, response.clone());
					return response;
				});
			})
		);
	}else{
		e.respondWith(
			caches.match(e.request).then(function(response){
				return response || fetch(e.request);
			})
		);
	}
});


var notificationclickUrl = '';
self.addEventListener('push', function(e) {

	var data = e.data.text();

	console.log('[Service Worker] Push 已经收到。');
	console.log(`[Service Worker] Push 的数据是: "${data}"`);

	e.waitUntil(
		self.registration.showNotification('push-新通知', {
			"body": "点击查看",
			"icon": "http://p5.qhimg.com/t01bf4bb5936bdceddc.png"
		})
	);

	// // 通知内容由server控制：示例数据见 site/server/data.sync.json
	// var notifyInfo = e.data.json();
	// notificationclickUrl = notifyInfo.more_url;
	// e.waitUntil(
	// 	self.registration.showNotification(notifyInfo.title, notifyInfo.options)
	// );
});


self.addEventListener('notificationclick', function(e) {
	console.log('[Service Worker] Notification 点击事件已收到。');

	e.notification.close();

	var url = notificationclickUrl || 'http://localhost:3000/';
	e.waitUntil(
		clients.matchAll({
			type: 'window'
		}).then(function(windowClients) {
			for(var i=0; i<windowClients.length; i++){
				var client = windowClients[i];
				if(client.url===url && 'focus' in client){
					return client.focus();
				}
			}
			if(clients.openWindow){
				return clients.openWindow(url);
			}
		})
	);
});


self.addEventListener('sync', function(e) {
	if (e.tag == 'myFirstSync') {
		console.log('[Service Worker] sync: myFirstSync');
		self.registration.showNotification("Sync event fired!");
	}
});