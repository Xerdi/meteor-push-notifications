# Meteor Push Notifications

Enable Push Notifications for Meteor Apps.

## Installation

Add the package to your project:
```shell
meteor add xerdi:push-notifications
```

## Usage

Every client which want to receive incoming push notifications must firstly register and after that subscribe to the `PushNotifications` service.
```javascript
import {PushNotifications} from 'meteor/xerdi:push-notifications';

PushNotifications.registerAndSubscribe();

// OR

await PushNotifications.register();
await PushNotifications.subscribe();
```

Then on the server every subscribed client can be notified like:
```javascript
import {VAPIDCredentials, PushNotifications} from 'meteor/xerdi:push-notifications';

Meteor.startup(function () {
    // Sets the credentials in any possible way
    VAPIDCredentials.auto().init();
    // VAPIDCredentials.fromSecrets().init();
    // VAPIDCredentials.fromEnv().init();
    // VAPIDCredentials.fromSettings().init();
    
    // Get the connection info of a users subscription (required)
    const user = Meteor.users.findOne({});
    const {subscriptions} = user.services.notifications;
    for (let sub of subscriptions) {
        PushNotifications.sendNotification(sub, {
            title: 'Test notification',
            opts: {
                icon: '/icons/my-icon.png',
                body: 'Hello World!'
            }
        });
    }
});
```

## API

### PushNotifications
The `PushNotifications` class has the following members and methods:
 - `registration : ServiceWorkerRegistration` The service worker registration.
 - `subscription : PushSubscription` The push subscription.
 - `status` Either `uninitialized`, `unsupported`, `registered` or `subscribed`.
 - `notifications()` Gets the notifications of the current registration.
 - `registerAndSubscribe()` Both registers and subscribes to push notifications.
 - `register()` Registers a service worker.
 - `subscribe()` Enables push notifications for the current user.
 - `unsubscribe()` Destroys both the registration and subscriptions. This method has to be called before `Accounts#onLogout`, since it has to be logged in for it to work.
 - `sendNotification(sub, notification)` Pushes a notification for the given subscription.
 - `requestPermission()` Requests browser permission for receiving push notifications.

### VAPIDCredentials

The `VAPIDCredentials` class has the following static factory methods:
 - `#auto()` Tries all underlying methods in the exact same order.
 - `#fromSecrets()` Tries to get the values from Docker secrets under `/run/secrets`. Allowed keys are `vapid-public-key`, `vapid-private-key` and `vapid-contact-uri`.
 - `#fromEnv()` Tries to get the values from `process.env`. Allowed keys are `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_CONTACT_URI`.
 - `#fromSettings()` Tries to get the values from `Meteor.settings`. Don't forget to add `settings.json` to your `.gitignore`.
 - `#create()` Generates credentials with `webpush.generateVAPIDKeys`.

Furthermore, the `VAPIDCredentials` has the following members and methods:
 - `.isNewlyCreated : boolean` Whether the credentials are newly created.
 - `.contactUri : String` The contact URI of this subscription.
 - `.publicKey : String` The public key.
 - `.privateKey : String` The private key.
 - `.init()` Sets the credentials for the `webpush` service.
 - `.save()` Stores the values in `<project_dir>/settings.json`.

Note: the `build-plugin.js` will store the credentials automatically if newly created.
