export default class EmailStructureUpdateItem {
  constructor(
    customerName,
    customerLastName,
    customerEmail,
    serialNumber,
    deviceType,
    eventName,
    company,
    paymentIntent,
    date,
    time,
    link
  ) {
    this.customerName = customerName;
    this.customerLastName = customerLastName;
    this.customerEmail = customerEmail;
    this.serialNumber = serialNumber;
    this.deviceType = deviceType;
    this.eventName = eventName;
    this.company = company;
    this.paymentIntent = paymentIntent;
    this.date = date;
    this.time = time;
    this.link = link;
  }

  render() {
    return {
      consumer: {
        name: `${this.customerName} ${this.customerLastName}`,
        email: this.customerEmail,
      },
      device: {
        serialNumber: this.serialNumber,
        deviceType: this.deviceType,
      },
      event: this.eventName,
      company: this.company,
      transaction: this.paymentIntent,
      date: this.date,
      time: this.time,
      link: this.link,
    };
  }
}