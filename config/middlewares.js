module.exports = [
  "strapi::errors",
  {
    name: 'strapi::body',
    config: {
      formLimit: '10mb',
      jsonLimit: '10mb',
      textLimit: '10mb',
      enableTypes: ['json', 'form', 'text', 'raw'],  // 🔥 önemli
      includeUnparsed: true,                         // 🔥 önemli
      enableRawBody: true,                           // 🔥 en önemlisi
    },
  },
  "strapi::security",
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::logger",
  "strapi::query",
  "strapi::favicon",
  "strapi::public",
];