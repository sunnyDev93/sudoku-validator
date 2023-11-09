importScripts("./ngsw-worker.js");

(function () {
	"use strict";

	self.addEventListener("notificationclick", (event) => {
		console.log("notification:", event.notification);

		event.waitUntil(
			clients.matchAll({ type: "window" }).then((windowClients) => {
				const url = event.notification.data.url;
				// If a Window tab matching the targeted URL already exists, focus that;
				const hadWindowToFocus = windowClients.some((windowClient) =>
					windowClient.url === url ? (windowClient.focus(), true) : false,
				);
				// Otherwise, open a new tab to the applicable URL and focus it.
				if (!hadWindowToFocus)
					clients
						.openWindow(url)
						.then((windowClient) => (windowClient ? windowClient.focus() : null));
			}),
		);
	});
})();
