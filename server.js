import {Meteor} from "meteor/meteor";

import './methods';
export {VAPIDCredentials} from "./credentials";
export {PushNotifications} from './push-notifications';

Meteor.startup(function () {

    // NotificationCredentials.auto().init();

});
