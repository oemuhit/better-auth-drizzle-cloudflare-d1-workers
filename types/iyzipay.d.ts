declare module "iyzipay" {
  interface IyzipayConfig {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  interface IyzipayCallback {
    (error: any, result: any): void;
  }

  interface CheckoutFormInitialize {
    create(request: any, callback: IyzipayCallback): void;
  }

  interface CheckoutForm {
    retrieve(request: any, callback: IyzipayCallback): void;
  }

  interface Payment {
    create(request: any, callback: IyzipayCallback): void;
    retrieve(request: any, callback: IyzipayCallback): void;
  }

  interface Refund {
    create(request: any, callback: IyzipayCallback): void;
  }

  interface Cancel {
    create(request: any, callback: IyzipayCallback): void;
  }

  class Iyzipay {
    constructor(config: IyzipayConfig);

    checkoutFormInitialize: CheckoutFormInitialize;
    checkoutForm: CheckoutForm;
    payment: Payment;
    refund: Refund;
    cancel: Cancel;

    static LOCALE: {
      TR: "tr";
      EN: "en";
    };

    static CURRENCY: {
      TRY: "TRY";
      EUR: "EUR";
      USD: "USD";
      GBP: "GBP";
      IRR: "IRR";
      NOK: "NOK";
      RUB: "RUB";
      CHF: "CHF";
    };

    static PAYMENT_GROUP: {
      PRODUCT: "PRODUCT";
      LISTING: "LISTING";
      SUBSCRIPTION: "SUBSCRIPTION";
    };

    static BASKET_ITEM_TYPE: {
      PHYSICAL: "PHYSICAL";
      VIRTUAL: "VIRTUAL";
    };

    static PAYMENT_CHANNEL: {
      WEB: "WEB";
      MOBILE: "MOBILE";
      MOBILE_WEB: "MOBILE_WEB";
      MOBILE_IOS: "MOBILE_IOS";
      MOBILE_ANDROID: "MOBILE_ANDROID";
      MOBILE_WINDOWS: "MOBILE_WINDOWS";
      MOBILE_TABLET: "MOBILE_TABLET";
      MOBILE_PHONE: "MOBILE_PHONE";
    };
  }

  export = Iyzipay;
}
