/*jshint maxparams:15 */
define([
  'jquery',
  'vendor/OktaAuth',
  'helpers/mocks/Util',
  'helpers/dom/EnrollTokenFactorForm',
  'helpers/dom/Beacon',
  'helpers/util/Expect',
  'sandbox',
  'helpers/xhr/MFA_ENROLL_allFactors',
  'helpers/xhr/SUCCESS',
  'LoginRouter'
],
function ($, OktaAuth, Util, Form, Beacon, Expect, $sandbox,
          resAllFactors, resSuccess, Router) {

  var itp = Expect.itp;
  var tick = Expect.tick;

  describe('EnrollYubikey', function () {

    function setup(startRouter) {
      var setNextResponse = Util.mockAjax();
      var baseUrl = 'https://foo.com';
      var authClient = new OktaAuth({uri: baseUrl});
      var router = new Router({
        el: $sandbox,
        baseUrl: baseUrl,
        authClient: authClient,
        globalSuccessFn: function () {}
      });
      Util.mockRouterNavigate(router, startRouter);
      setNextResponse(resAllFactors);
      authClient.status();
      return tick()
      .then(function () {
        router.enrollYubikey();
        return tick();
      })
      .then(function () {
        return {
          router: router,
          beacon: new Beacon($sandbox),
          form: new Form($sandbox),
          ac: authClient,
          setNextResponse: setNextResponse
        };
      });
    }

    afterEach(function () {
      $sandbox.empty();
    });

    describe('Header & Footer', function () {
      itp('displays the correct factorBeacon', function () {
        return setup().then(function (test) {
          expect(test.beacon.isFactorBeacon()).toBe(true);
          expect(test.beacon.hasClass('mfa-yubikey')).toBe(true);
        });
      });
      itp('has a "back" link in the footer', function () {
        return setup().then(function (test) {
          Expect.isVisible(test.form.backLink());
        });
      });
    });

    describe('Enroll factor', function () {
      itp('has passCode field', function () {
        return setup().then(function (test) {
          Expect.isPasswordField(test.form.codeField());
        });
      });
      itp('has a verify button', function () {
        return setup().then(function (test) {
          Expect.isVisible(test.form.submitButton());
        });
      });
      itp('does not allow autocomplete', function () {
        return setup().then(function (test) {
          expect(test.form.getCodeFieldAutocomplete()).toBe('off');
        });
      });
      itp('returns to factor list when browser\'s back button is clicked', function () {
        return setup(true).then(function (test) {
          Util.triggerBrowserBackButton();
          return test;
        })
        .then(function (test) {
          Expect.isEnrollChoicesController(test.router.controller);
          Util.stopRouter();
        });
      });
      itp('does not send request and shows error if code is not entered', function () {
        return setup().then(function (test) {
          $.ajax.calls.reset();
          test.form.submit();
          expect(test.form.hasErrors()).toBe(true);
          expect($.ajax).not.toHaveBeenCalled();
        });
      });
      itp('calls enroll with the right params', function () {
        return setup().then(function (test) {
          $.ajax.calls.reset();
          test.form.setCode(123456);
          test.setNextResponse(resSuccess);
          test.form.submit();
          return tick();
        })
        .then(function () {
          expect($.ajax.calls.count()).toBe(1);
          Expect.isJsonPost($.ajax.calls.argsFor(0), {
            url: 'https://foo.com/api/v1/authn/factors',
            data: {
              factorType: 'token:hardware',
              provider: 'YUBICO',
              passCode: '123456',
              stateToken: 'testStateToken'
            }
          });
        });
      });
    });

  });
});
