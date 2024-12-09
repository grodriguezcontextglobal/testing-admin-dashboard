export default class DeviceAssigned {
  constructor(
    paymentIntent,
    device,
    user,
    active,
    eventSelected,
    provider,
    timeStamp,
    company,
    event_id
  ) {
    this.paymentIntent = paymentIntent;
    this.device = device;
    this.user = user;
    this.active = active;
    this.eventSelected = eventSelected;
    this.provider = provider;
    this.timeStamp = timeStamp;
    this.company = company;
    this.event_id = event_id;
  }

  render() {
    return {
      paymentIntent: this.paymentIntent,
      device: this.device,
      user: this.user,
      active: this.active,
      eventSelected: this.eventSelected,
      provider: this.provider,
      timeStamp: this.timeStamp,
      company: this.company,
      event_id: this.event_id,
    };
  }
}
