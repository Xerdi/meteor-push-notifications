// @flow
import log from 'meteor/xerdi:logging';
import webpush from "web-push";

class PushNotificationsPrototype {
    url = '/packages/xerdi_push-notifications/service-worker.js';
    registration: ServiceWorkerRegistration | undefined;
    subscription: PushSubscription | null;
    status = 'uninitialized';

    notifications() {
        return this.registration.getNotifications();
    }

    async registerAndSubscribe() {
        if (!this.registration) {
            await this.register();
        }
        if (!this.subscription) {
            await this.subscribe();
        }
        return this.subscription;
    }

    async register() {
        if (this.status === 'uninitialized' && navigator && navigator.serviceWorker) {
            try {
                this.registration = await navigator.serviceWorker.register(this.url);
                this.status = 'registered';
            } catch (err) {
                log.error('failed to register service worker');
                console.error(err);
                this.status = 'unsupported';
            }
        }
    }

    async subscribe() {
        if (this.status === 'registered') {
            this.validateSession();
            try {
                const existingSubscription = await this.registration.pushManager.getSubscription();
                this.subscription = existingSubscription || await this._subscribe();
                this.status = 'subscribed';
            } catch (err) {
                log.error('failed to subscribe');
                console.error(err);
                this.status = 'unsupported';
            }
        }
        if (this.subscription) {
            const subInfo = this.subscription.toJSON();
            Meteor.call('Notifications.authorizeSubscription', subInfo, function (err, data) {
                if (err) {
                    log.error(err);
                } else {
                    log.info(`Added ${data || 0} subscriptions`);
                }
            });
            return subInfo;
        }
    }

    async _subscribe() {
        return await this.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: await this.serverKey()
        });
    }

    async unsubscribe() {
        if (!this.registration) {
            this.subscription = null;
            this.status = 'uninitialized';
            log.warn('no service worker registration for push notifications');
            return;
        }
        if (!this.subscription)
            this.subscription = await this.registration.pushManager.getSubscription();
        if (this.subscription) {
            Meteor.call('Notifications.revokeSubscription', this.subscription.toJSON(), function (err, data) {
                if (err)
                    log.error(err);
                else {
                    log.info(`Pulled ${data || 0} subscriptions`);
                }
            });
            await this.subscription.unsubscribe()
                .catch(function (err) {
                    log.error('Failed to unsubscribe push manager');
                    log.error(err);
                });
            this.subscription = null;
        } else {
            log.warn('No subscription to stop');
        }
        if (this.registration) {
            await this.registration.unregister()
                .catch(function (err) {
                    log.error('Failed to unregister push manager');
                    log.error(err);
                });
            this.registration = null;
        }
        this.status = !!this.registration ? 'registered' : 'uninitialized';
    }

    sendNotification(connection, notification) {
        return webpush.sendNotification(connection, notification);
    }

    async requestPermission() {
        const self = this;
        if (Notification && Notification.requestPermission) {
            return await Notification.requestPermission()
                .then(function (permission) {
                    return permission === 'granted';
                })
                .catch(function (err) {
                    self.status = 'unsupported';
                    log.error(err.message);
                    return false;
                });
        } else {
            self.status = 'unsupported';
            log.warn('Notifications not supported');
        }
        return false;
    }

    validateSession() {
        if (!this.registration) {
            throw new Meteor.Error('A Service Worker must be registered');
        }
        if (!Meteor.userId()) {
            throw new Meteor.Error('You need to be logged in');
        }
    }

    async serverKey() {
        const self = this;
        return await new Promise(function (resolve, reject) {
            Meteor.call('Notifications.publicKey', function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(self.toBase64(data));
                }
            });
        });
    }

    toBase64(url) {
        const padding = '='.repeat((4 - (url.length % 4)) % 4)
        const base64 = (url + padding).replace(/\-/g, '+').replace(/_/g, '/')
        const rawData = atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray;
    }
}

export const PushNotifications = new PushNotificationsPrototype();
