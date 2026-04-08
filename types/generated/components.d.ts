import type { Schema, Attribute } from '@strapi/strapi';

export interface ContactOfficeContactOffice extends Schema.Component {
  collectionName: 'components_contact_office_contact_offices';
  info: {
    displayName: 'ContactOffice';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    adress: Attribute.String;
    phone: Attribute.String;
    email: Attribute.String;
    image: Attribute.Media;
  };
}

export interface FeaturesFeatures extends Schema.Component {
  collectionName: 'components_features_features';
  info: {
    displayName: 'features';
  };
  attributes: {
    title: Attribute.String;
  };
}

export interface Section3FeaturesSection3Features extends Schema.Component {
  collectionName: 'components_section3features_section3features';
  info: {
    displayName: 'section3features';
  };
  attributes: {
    title: Attribute.String;
    desc: Attribute.String;
    image: Attribute.Media;
  };
}

export interface SeoSeo extends Schema.Component {
  collectionName: 'components_seo_seos';
  info: {
    displayName: 'Seo';
  };
  attributes: {
    metaTitle: Attribute.Text;
    metaDesc: Attribute.Text;
  };
}

export interface VehiclesVehicles extends Schema.Component {
  collectionName: 'components_vehicles_vehicles';
  info: {
    displayName: 'vehicles';
    description: '';
  };
  attributes: {
    vehicle: Attribute.Relation<
      'vehicles.vehicles',
      'oneToOne',
      'api::vehicle.vehicle'
    >;
    percentage: Attribute.Decimal & Attribute.Required;
    hourly: Attribute.Decimal & Attribute.Required;
    daily: Attribute.Decimal & Attribute.Required;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'contact-office.contact-office': ContactOfficeContactOffice;
      'features.features': FeaturesFeatures;
      'section3features.section3features': Section3FeaturesSection3Features;
      'seo.seo': SeoSeo;
      'vehicles.vehicles': VehiclesVehicles;
    }
  }
}
