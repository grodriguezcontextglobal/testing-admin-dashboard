export default class ImageUploaderFormat {
  constructor(
    file,
    companyID = "",
    category = "",
    itemGroup = "",
    name = "",
    lastName = "",
    UID = "",
    eventID = ""
  ) {
    this.file = file;
    this.companyID = companyID;
    this.category = category;
    this.itemGroup = itemGroup;
    this.name = name;
    this.lastName = lastName;
    this.UID = UID;
    this.eventID = eventID;
  }

  staff_uploader() {
    return {
      imageFile: this.file,
      imageID: this.UID,
      tags: [this.UID],
      context: `user_id:${
        this.UID
      }|created_at:${new Date().getTime()}|updated_at:${new Date().getTime()}|userID:${
        this.UID
      }`,
    };
  }

  item_uploader() {
    return {
      imageFile: this.file,
      imageID: `${this.companyID}_${this.category}_${this.itemGroup}`,
      tags: [this.companyID, this.itemGroup, this.category],
      context: `category_name:${this.category}|group_name:${
        this.itemGroup
      }|created_at:${new Date().getTime()}|updated_at:${new Date().getTime()}`,
    };
  }
  company_uploader() {
    return {
      imageFile: this.file,
      imageID: this.companyID,
      tags: [this.companyID],
      context: `company_id:${
        this.companyID
      }|created_at:${new Date().getTime()}|updated_at:${new Date().getTime()}`,
    };
  }

  event_uploader() {
    return {
      imageFile: this.file,
      imageID: this.eventID,
      tags: [this.eventID, this.companyID],
      context: `event_id:${this.eventID}|company_id:${
        this.companyID
      }|created_at:${new Date().getTime()}|updated_at:${new Date().getTime()}`,
    };
  }
}
