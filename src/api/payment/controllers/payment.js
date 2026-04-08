"use strict";

const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

module.exports = {
  /**
   *  POST /payments/create-checkout-session
   *  body: { reservationId }
   */
  async createCheckoutSession(ctx) {
    try {
      const { reservationId } = ctx.request.body || {};
      if (!reservationId) {
        return ctx.badRequest("reservationId zorunlu");
      }

      // 1) rezervasyonu DB'den çek (örnek model adı reservation)
      const reservation = await strapi.entityService.findOne(
        "api::reservation.reservation",
        reservationId,
        { populate: ["*"] }
      );

      if (!reservation) return ctx.notFound("Rezervasyon bulunamadı");

      // 2) fiyatı hesapla (örnek alan: totalPrice)
      const amount = Math.round(Number(reservation.totalPrice) * 100); // kuruş
      if (!amount || amount < 100) return ctx.badRequest("Geçersiz tutar");

      // 3) checkout session oluştur
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        success_url: process.env.STRIPE_SUCCESS_URL,
        cancel_url: process.env.STRIPE_CANCEL_URL,
        customer_email: reservation.email || undefined,

        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: amount,
              product_data: {
                name: reservation.villa?.title
                  ? `${reservation.villa.title} Rezervasyonu`
                  : "Araç Rezervasyonu",
                description: `000 - 000`,
              },
            },
          },
        ],

        metadata: {
          reservationId: String(reservationId),
          villaId: reservation.villa?.id ? String(reservation.villa.id) : "",
          userEmail: reservation.email || "",
        },
      });

      // 4) reservation’a "pending" ödeme kaydı geç (opsiyonel ama önerilir)
      await strapi.entityService.update(
        "api::reservation.reservation",
        reservationId,
        {
          data: {
            paymentStatus: "pending",
            stripeSessionId: session.id,
          },
        }
      );

      ctx.send({ url: session.url, id: session.id });
    } catch (err) {
      strapi.log.error("Stripe createCheckoutSession error:", err);
      ctx.internalServerError("Stripe session oluşmadı");
    }
  },

  /**
   * Stripe webhook endpoint
   * POST /payments/webhook
   */
  async webhook(ctx) {
    const sig = ctx.request.headers["stripe-signature"];
    let event;

    // 🔥 BODY BURADA! (raw body)
    const rawBody = ctx.request.body?.[Symbol.for("unparsedBody")];

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      strapi.log.error("Webhook signature doğrulanamadı:", err.message);
      return ctx.badRequest(`Webhook Error: ${err.message}`);
    }

    // Aşağısı aynı
    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const reservationId = session.metadata?.reservationId;

        if (reservationId) {
          await strapi.entityService.update(
            "api::reservation.reservation",
            reservationId,
            {
              data: {
                paymentStatus: "paid",
                stripePaymentIntentId: session.payment_intent,
                stripeCustomerId: session.customer,
              },
            }
          );
        }
      }

      ctx.send({ received: true });
    } catch (err) {
      strapi.log.error("Webhook işlenemedi:", err);
      ctx.internalServerError("Webhook işlenemedi");
    }
  }

};
