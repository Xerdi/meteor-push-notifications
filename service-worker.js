// References:
// https://github.com/a7ul/web-push-demo
// https://github.com/TomasDePomas/notifier/blob/master/pushNotification/register.js


self.addEventListener('push', function (event) {
    const notification = event.data.json();
    return self.clients.matchAll({type: 'window'})
        .then(function (_clients) {
            for (let client of _clients) {
                if (client.focused)
                    return; // Trust on in-app notification
            }
            // see compatibility https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification#browser_compatibility
            // IOS 16 support will come in 2023 https://www.apple.com/ios/ios-16-preview/features/
            self.registration.showNotification(notification.title, notification.opts)
                .then(console.log)
                .catch(console.error);
        });
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const action = event.action || ('data' in event.notification && event.notification.data.defaultAction);

    event.waitUntil(self.clients.matchAll({type: 'window'}).then(function (clients) {
        let focusedWindow;
        let openWindow;
        let actionMatch;
        let fallback;

        for (let client of clients) {
            if (client.focused)
                focusedWindow = client;
            if (client.visibilityState === 'visible')
                openWindow = client;
            if (action && client.url.endsWith(action)) {
                actionMatch = client;
            }
            fallback = client;
        }

        if (actionMatch) {
            return actionMatch.focus();
        } else if (focusedWindow) {
            return action && focusedWindow.navigate(action);
        } else if (openWindow) {
            openWindow.focus();
            return action && openWindow.navigate(action);
        } else if (fallback) {
            fallback.focus();
            return action && fallback.navigate(action);
        } else {
            return self.clients.openWindow(action || '/notifications')
                .then(client => client.focus());
        }
    }));
});
