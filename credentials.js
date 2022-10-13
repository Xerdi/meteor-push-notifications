// @flow

import {Meteor} from "meteor/meteor";
import Fs from 'fs';
import Path from 'path';
import webpush from 'web-push';

let resolveCredentials;

export const currentCredentials = new Promise(function (resolve) {
    resolveCredentials = resolve;
});

export class VAPIDCredentials {

    static DEFAULT_CONTACT_URI : String = 'mailto:info@xerdi.com';

    isNewlyCreated : boolean = false;

    contactUri : String | undefined;
    publicKey : String | undefined;
    privateKey : String | undefined;

    init() {
        webpush.setVapidDetails(this.contactUri, this.publicKey, this.privateKey);
        resolveCredentials(this);
    }

    save() {
        const path = Path.join(process.cwd(), 'settings.json');
        Meteor.settings.vapid = this.toJSON();
        Fs.writeFile(path, JSON.stringify(Meteor.settings, null, 2));
    }

    toJSON() {
        return {
            contactUri: this.contactUri,
            publicKey: this.publicKey,
            privateKey: this.privateKey
        };
    }

    static auto() {
        if (this._getSecret('vapid-public-key', false)) {
            return this.fromSecrets();
        }
        if ('VAPID_PUBLIC_KEY' in process.env) {
            return this.fromEnv();
        }
        if ('vapid' in Meteor.settings) {
            return this.fromSettings();
        }
        return this.create();
    }

    static create() {
        const credentials = new VAPIDCredentials();
        const {publicKey, privateKey} = webpush.generateVAPIDKeys();
        credentials.isNewlyCreated = true;
        credentials.contactUri = this.DEFAULT_CONTACT_URI;
        credentials.publicKey = publicKey;
        credentials.privateKey = privateKey;
        return credentials;
    }

    static fromSettings() {
        const credentials = new VAPIDCredentials();
        const {contactUri, publicKey, privateKey} = Meteor.settings.vapid;
        credentials.contactUri = contactUri || this.DEFAULT_CONTACT_URI;
        credentials.publicKey = publicKey;
        credentials.privateKey = privateKey;
        return credentials;
    }

    static fromEnv() {
        const credentials = new VAPIDCredentials();
        const {VAPID_CONTACT_URI, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY} = process.env;
        credentials.contactUri = VAPID_CONTACT_URI || this.DEFAULT_CONTACT_URI;
        credentials.publicKey = VAPID_PUBLIC_KEY;
        credentials.privateKey = VAPID_PRIVATE_KEY;
        return credentials;
    }

    static fromSecrets() {
        const credentials = new VAPIDCredentials();
        credentials.contactUri = this._getSecret('vapid-contact-uri', false) || this.DEFAULT_CONTACT_URI;
        credentials.publicKey = this._getSecret('vapid-public-key');
        credentials.privateKey = this._getSecret('vapid-private-key');
        return credentials;
    }

    static _getSecret(key, required= true) {
        let value;
        try {
            value = Fs.readFileSync(`/run/secrets/${key}`, 'utf8');
        } catch(err) {
            if (required) {
                throw err;
            }
        }
        return value;
    }
}
