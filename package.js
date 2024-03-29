Package.describe({
    name: 'xerdi:push-notifications',
    version: '0.0.3',
    summary: 'Enables push notifications with service worker',
    git: 'https://github.com/Xerdi/meteor-push-notifications.git',
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('2.11.0');
    api.use([
        'ecmascript',
        'accounts-base',
        'xerdi:logging@0.0.4'
    ]);
    api.addAssets(['service-worker.js'], 'client');
    api.mainModule('client.js', 'client');
    api.mainModule('server.js', 'server');
});

Package.registerBuildPlugin({
    name: 'vapid',
    use: ['ecmascript'],
    npmDependencies: { "web-push": "3.5.0" },
    sources: ['build-plugin.js', 'credentials.js']
});

Npm.depends({
    "web-push": "3.5.0"
});
