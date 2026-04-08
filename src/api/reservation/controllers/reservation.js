'use strict';

const fs = require('fs');
const transporter = require('../../../../config/nodemailer')
const utils = require('@strapi/utils');
const { ApplicationError } = utils.errors;
/**
 * reservation controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::reservation.reservation', ({ strapi }) => ({
    async create(ctx) {
        const body = ctx.request.body

        let vehiclePrice = 0
        let extraPrice = 0



        const vehicleData = await strapi.entityService.findOne('api::vehicle.vehicle', body?.data?.vehicle, {
            fields: ['title', 'category', 'dailyPrice', 'hourlyPrice'],
            populate: ['prices']
        });

        const extraPrices = await strapi.entityService.findMany('api::general-price-setting.general-price-setting', {

        });

        const cityInfo = await strapi.entityService.findMany(
            'api::city.city',
            {
                filters: {
                    slug: {
                        $eq: body?.data?.citySlug
                    }
                },
                populate: {
                    vehicles: {
                        populate: {
                            vehicle: {
                                fields: ["title"]
                            }
                        }
                    }
                }
            }
        )

        const calcPrice = (id, price) => {
            const percentage = cityInfo?.[0]?.vehicles?.find((el) => el?.vehicle?.id === id)

            if (percentage) {
                return Math.ceil(price * (1 + percentage?.percentage / 100))
            } else {
                return Math.ceil(price)
            }
        }

        const calcHourlyPrice = (id, hour, basePrice) => {
            const percentage = cityInfo?.[0]?.vehicles?.find((el) => el?.vehicle?.id === id)

            if (percentage) {
                return Math.ceil(hour * percentage?.hourly)
            } else {
                return Math.ceil(basePrice)
            }
        }

        const calcDailyPrice = (id, day, basePrice) => {
            const percentage = cityInfo?.[0]?.vehicles?.find((el) => el?.vehicle?.id === id)

            if (percentage) {
                return Math.ceil(day * percentage?.daily)
            } else {
                return Math.ceil(basePrice)
            }
        }

        const vehiclePriceCalculate = async () => {
            if (body?.data?.reservationType === 0) {
                const distance = parseFloat(body?.data?.totalDistance.replace(' km', '').replace(' m', ''));

                if (body?.data?.totalDistance.includes(' m')) {
                    const prices = vehicleData?.prices?.map((o) => o.price);
                    return vehiclePrice = calcPrice(body?.data?.vehicle, (vehiclePrice + Math.min(...prices)))
                } else {
                    const price = vehicleData?.prices?.find((price) => {
                        return distance >= price.km1 && distance < price.km2;
                    });
                    if (price) {
                        return vehiclePrice = calcPrice(body?.data?.vehicle, (vehiclePrice + price?.price))
                    } else {
                        return vehiclePrice = calcPrice(body?.data?.vehicle, (vehiclePrice + vehicleData?.dailyPrice))
                    }
                }
            } else if (body?.data?.reservationType === 1) {
                // return vehiclePrice = calcPrice(body?.data?.vehicle, (vehiclePrice + (vehicleData?.hourlyPrice * parseInt(body?.data?.hourlyDuration))))
                return vehiclePrice = calcHourlyPrice(body?.data?.vehicle, parseInt(body?.data?.hourlyDuration), (vehicleData?.hourlyPrice * parseInt(body?.data?.hourlyDuration)))
            } else if (body?.data?.reservationType === 2) {
                // return vehiclePrice = calcPrice(body?.data?.vehicle, (vehiclePrice + (vehicleData?.dailyPrice * parseInt(body?.data?.dailyDuration))))
                return vehiclePrice = calcDailyPrice(body?.data?.vehicle, parseInt(body?.data?.dailyDuration), (vehicleData?.dailyPrice * parseInt(body?.data?.dailyDuration)))
            }
            return vehiclePrice = 0
        }

        const extraPriceCalculate = async () => {
            if (body?.data?.bodyguardService) {
                // extraPrice = extraPrice + extraPrices?.bodyguardService
                extraPrice = extraPrice + (extraPrices?.bodyguardService * parseInt(body?.data?.bodyguardService))
            }
            if (body?.data?.airportAssistanceHostessService) {
                // extraPrice = extraPrice + extraPrices?.airportAssistanceHostessService
                extraPrice = extraPrice + (extraPrices?.airportAssistanceHostessService * parseInt(body?.data?.airportAssistanceHostessService))
            }
            if (body?.data?.childSeat) {
                extraPrice = extraPrice + (extraPrices?.childSeat * parseInt(body?.data?.childSeat))
            }
        }

        vehiclePriceCalculate()
        extraPriceCalculate()

        const data = {
            name: `${body?.data?.name} ${body?.data?.surname}`,
            phone: body?.data?.phone,
            vehicleTitle: vehicleData?.title,
            reservationType: body?.data?.reservationType === 0 ? 'One Way' : body?.data?.reservationType === 1 ? 'Hourly' : body?.data?.reservationType === 2 ? 'Daily' : '',
            address: body?.data?.address,
            firstLocation: body?.data?.firstLocation,
            lastLocation: body?.data?.lastLocation,
            date: body?.data?.date,
            time: body?.data?.time?.toString().slice(0, 5),
            vehicleClass: vehicleData?.category,
            email: body?.data?.email,
            flightNumber: body?.data?.flightNumber,
            childSeat: body?.data?.childSeat || 0,
            bodyguardService: body?.data?.bodyguardService || 0,
            airportAssistanceHostessService: body?.data?.airportAssistanceHostessService || 0,
            passenger: body?.data?.passenger || 0,
            luggage: body?.data?.luggage || 0,
            paymentMethod: body?.data?.paymentMethod === 0 ? 'Cash' : 'Credit Card',
            price: `€${vehiclePrice + extraPrice}`,
            hourlyDuration: body?.data?.hourlyDuration,
            dailyDuration: body?.data?.dailyDuration
        };

        data.hourlyDurationRow =
            body?.data?.reservationType === 1 && data.hourlyDuration
                ? `
        <tr>
            <td style="padding: 8px 0; font-weight: bold;">Hourly Duration:</td>
            <td style="padding: 8px 0;">${data.hourlyDuration}</td>
        </tr>
        `
                : '';

        data.dailyDuration =
            body?.data?.reservationType === 2 && data.dailyDuration
                ? `
        <tr>
            <td style="padding: 8px 0; font-weight: bold;">Daily Duration:</td>
            <td style="padding: 8px 0;">${data.dailyDuration}</td>
        </tr>
        `
                : '';

        ctx.request.body.data = {
            ...body.data,
            totalPrice: vehiclePrice + extraPrice
        }

        try {
            let template = fs.readFileSync('mailtemplate.html', 'utf-8');

            Object.keys(data).forEach(key => {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                template = template.replace(regex, data[key] ?? '');
            });

            await transporter.sendMail({
                from: 'info@724chauffeur.com',
                to: [
                    "info@724chauffeur.com",
                    "info@grandedigital.com"
                ],
                subject: 'Reservation Info',
                text: "Text",
                html: template
            })
        } catch (error) {
            console.log(error);
            throw new ApplicationError(error.message);
        }

        const response = await super.create(ctx);
        return response;
    },
    async reservationDetail(ctx) {
        const stripeSessionId = ctx.request.query?.stripeSessionId || ctx.query?.stripeSessionId || ctx.request.body?.stripeSessionId;

        if (!stripeSessionId) {
            return ctx.unauthorized('stripeSessionId gereklidir');
        }

        const matches = await strapi.entityService.findMany('api::reservation.reservation', {
            filters: { stripeSessionId: { $eq: stripeSessionId } },
            populate: {
                vehicle: {
                    fields: ["*"],
                    populate: {
                        image: {
                            fields: ["*"]
                        }
                    }
                }
            }
        });

        if (matches && matches.length > 0) {
            return matches[0];
        }

        return ctx.unauthorized('Yetkisiz işlem');
    },
}))

