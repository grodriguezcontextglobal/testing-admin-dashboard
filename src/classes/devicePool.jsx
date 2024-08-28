export default class DevicePool {
    constructor(
      paymentIntent,
      device,
      user,
      active,
      eventSelected,
      provider,
      timeStamp,
      company
    ) {
      this.paymentIntent = paymentIntent;
      this.device = device;
      this.user = user;
      this.active = active;
      this.eventSelected = eventSelected;
      this.provider = provider;
      this.timeStamp = timeStamp;
      this.company = company;
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
      };
    }
  }
  