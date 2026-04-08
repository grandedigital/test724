"use strict";

module.exports = {
  routes: [
    {
      method: "POST",
      path: "/payments/create-checkout-session",
      handler: "payment.createCheckoutSession",
      config: { auth: false }, // istersen true yaparsın
    },
    {
      method: "POST",
      path: "/payments/webhook",
      handler: "payment.webhook",
      config: { auth: false },
    },
  ],
};
