define([
  'app/config',

  'dojo/on',

  'esri/arcgis/OAuthInfo',
  'esri/arcgis/Portal',
  'esri/arcgis/utils',
  'esri/config',
  'esri/IdentityManager',

  'dojo/domReady!'
], function(
  config,
  on,
  OAuthInfo, arcgisPortal, agsUtils, esriConfig, esriId) {

  return {

    createOAuthAccess: function(appId, AGOLOrgUrl) {

      esriConfig.defaults.io.proxyUrl = config.proxy.url;
      var info = new OAuthInfo({
        appId: appId,
        popup: false,
        portalUrl: AGOLOrgUrl
      });
      esriId.registerOAuthInfos([info]);
      return esriId.checkSignInStatus(info.portalUrl).then(function() {
        portalSignIn();

      }).otherwise(

        function() {
          esriId.getCredential(info.portalUrl);
        });

      function portalSignIn() {
        new arcgisPortal.Portal(info.portalUrl).signIn().then(

          function(portalUser) {
            console.log('Signed in to the portal: ', portalUser);
          }).otherwise(

          function(error) {
            console.log('Error occurred while signing in: ', error);
          });
      }
    },

    signOut: function() {
      esriId.destroyCredentials();
      window.location.reload();
    }
  };
});