import {Meteor} from "meteor/meteor";
import {currentCredentials} from "./credentials";
import {log} from 'meteor/xerdi:logging';

Meteor.methods({
    async 'Notifications.publicKey'() {
        const cur = await currentCredentials;
        return cur.publicKey;
    },
    'Notifications.authorizeSubscription'(subscription) {
        if (!Meteor.userId()) {
            log.error('Visitor tried to subscribe push notifications');
            throw new Meteor.Error(400, 'Must be logged in');
        }

        return Meteor.users.update(Meteor.userId(), {
            $addToSet: {
                'services.notifications.subscriptions': subscription
            }
        });
    },
    'Notifications.revokeSubscription'(subscription) {
        if (!Meteor.userId()) {
            log.error('Visitor tried to subscribe push notifications');
            throw new Meteor.Error(400, 'Must be logged in');
        }

        return Meteor.users.update(Meteor.userId(), {
            $pull: {
                'services.notifications.subscriptions': subscription
            }
        });
    }
});