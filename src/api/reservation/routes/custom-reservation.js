module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/reservationDetail',
            handler: 'reservation.reservationDetail',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};