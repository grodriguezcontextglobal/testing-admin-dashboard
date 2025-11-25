import { devitrakApi } from "../../../../api/devitrakApi";
import DeviceAssigned from "../../../../classes/deviceAssigned";
import { checkArray } from "../../../../components/utils/checkArray";
import { formatDate } from "../../../inventory/utils/dateFormat";

export const updateDeviceInWarehouse = ({
  item_group,
  category_name,
  data,
  user,
}) => {
  try {
    const updateItemsInWarehouse = async () => {
      await devitrakApi.post("/db_item/item-out-warehouse", {
        warehouse: 0,
        company_id: user.sqlInfo.company_id,
        item_group: item_group,
        category_name: category_name,
        data: data,
      });
    };
    return updateItemsInWarehouse();
  } catch (error) {
    console.log(error);
  }
};
export const createNewLease = ({
  template,
  deviceInfo,
  user,
  consumerInfoSqlDb,
}) => {
  try {
    const createLease = async () => {
      const newLeaseIds = [];
      for (let data of deviceInfo) {
        const newLease = await devitrakApi.post(
          "/db_lease/new-consumer-lease",
          {
            staff_admin_id: user.sqlMemberInfo.staff_id,
            company_id: user.sqlInfo.company_id,
            subscription_expected_return_data: formatDate(new Date()),
            subscription_initial_date: formatDate(new Date()),
            location: `${template.street} ${template.city} ${template.state} ${template.zip}`,
            consumer_member_id:
              consumerInfoSqlDb.consumer_id.consumer_id ??
              consumerInfoSqlDb.consumer_id,
            device_id: data.item_id,
          }
        );
        newLeaseIds.push(newLease.insertId);
      }
    };
    return createLease();
  } catch (error) {
    console.log(error);
  }
};
export const createEvent = ({ template, customer, user, newEventInfo }) => {
  try {
    const createEventSQL = async () => {
      try {
        const respoNewEvent = await devitrakApi.post("/db_event/new_event", {
          event_name: `${customer.name} ${customer.lastName} / ${
            customer.email
          } / ${new Date().toLocaleDateString()}`,
          venue_name: `${customer.name} ${customer.lastName} / ${
            customer.email
          } / ${new Date().toLocaleDateString()}`,
          street_address: template.street,
          city_address: template.city,
          state_address: template.state,
          zip_address: template.zip,
          email_company: customer.email,
          phone_number: customer.phone ?? "000-000-0000",
          company_assigned_event_id: user.sqlInfo.company_id,
          contact_name: `${user.name} ${user.lastName}`,
        });
        if (respoNewEvent.data) {
          return (newEventInfo.insertId = respoNewEvent.data.consumer.insertId);
        }
      } catch (error) {
        return null;
      }
    };
    return createEventSQL();
  } catch (error) {
    console.log(error);
  }
};
export const createDeviceRecordInNoSQLDatabase = ({
  deviceInfo,
  customer,
  user,
  contractList,
  addContracts,
  verificationInfo,
  stampTime,
}) => {
  try {
    const db = deviceInfo;
    let items = [];
    const createDevicePoolEvent = async () => {
      for (let index = 0; index < db.length; index++) {
        const deviceTemplate = {
          device: db[index].serial_number,
          status: "Operational",
          activity: true,
          comment: "No comment",
          eventSelected: `${customer.name} ${customer.lastName} / ${
            customer.email
          } / ${new Date().toLocaleDateString()}`,
          provider: user.company,
          type: db[index].item_group,
          company: user.companyData.id,
          contract_type: "lease",
        };
        await devitrakApi.post("/receiver/receivers-pool", deviceTemplate);
        items.push({
          serial_number: db[index].serial_number,
          type: db[index].item_group,
          id: db[index].item_id,
        });
      }
      {
        addContracts &&
          emailContractToStaffMember({
            customer,
            user,
            contractList,
            stampTime,
            verificationInfo,
            items,
          });
      }
      return null;
    };
    return createDevicePoolEvent();
  } catch (error) {
    console.log(error);
  }
};
export const addDeviceToEvent = ({
  selectedList,
  newEventInfo,
  queryClient,
}) => {
  try {
    const insertingDeviceSQL = async () => {
      for (let item of selectedList) {
        await devitrakApi.post("/db_event/event_device_directly", {
          event_id: newEventInfo.insertId,
          item_id: item.item_id,
        });
      }
    };
    insertingDeviceSQL();
    queryClient.invalidateQueries({
      queryKey: ["staffMemberInfo"],
      exact: true,
    });
    queryClient.invalidateQueries({
      queryKey: ["imagePerItemList"],
      exact: true,
    });
    return queryClient.invalidateQueries({
      queryKey: ["ItemsInventoryCheckingQuery"],
      exact: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const createEventNoSQL = ({
  template,
  deviceInfo,
  quantity,
  customer,
  user,
  verificationInfo,
  contractList,
  addContracts,
  stampTime,
}) => {
  try {
    const createEventNoSQL = async () => {
      const eventName = `${customer.name} ${customer.lastName} / ${
        customer.email
      } / ${new Date().toLocaleDateString()} / Lease`;
      const leasedTime = new Date();
      leasedTime.setFullYear(leasedTime.getFullYear() + 2);
      const eventLink = eventName.replace(/ /g, "%20");
      verificationInfo.eventName = eventName;
      const eventFormat = {
        user: user.email,
        company: user.company,
        subscription: [],
        eventInfoDetail: {
          eventName: eventName,
          eventLocation: `${template.state}, ${template.zip}`,
          address: `${template.street}, ${template.city} ${template.state}, ${template.zip}`,
          building: eventName,
          floor: "",
          merchant: false,
          dateBegin: new Date().toString(),
          dateEnd: leasedTime.toString(),
          dateBeginTime: new Date().getTime(),
        },
        staff: {
          adminUser: [
            {
              firstName: user.name,
              lastName: user.lastName,
              email: user.email,
              role: "Administrator",
            },
          ],
          headsetAttendees: [],
        },
        deviceSetup: [
          {
            category: deviceInfo[0].category_name,
            group: deviceInfo[0].item_group,
            value: deviceInfo[0].cost,
            description: deviceInfo[0].descript_item,
            company: deviceInfo[0].company_id,
            ownership: deviceInfo[0].ownership,
            createdBy: user.email,
            key: deviceInfo[0].item_id,
            dateCreated: deviceInfo[0].create_at,
            resume: deviceInfo[0].descript_item,
            existing: true,
            quantity: quantity,
            consumerUses: false,
            startingNumber: deviceInfo[0].serial_number,
            endingNumber: deviceInfo.at(-1).serial_number,
          },
        ],
        extraServicesNeeded: false,
        extraServices: [],
        active: true,
        contactInfo: {
          name: `${user.name} ${user.lastName}`,
          phone: [user.phone],
          email: user.email,
        },
        qrCodeLink: `https://app.devitrak.net/?event=${eventLink}&company=${user.companyData.id}`,
        type: "lease",
        company_id: user.companyData.id,
      };
      const newEventInfo = await devitrakApi.post(
        "/event/create-event",
        eventFormat
      );
      if (newEventInfo.data) {
        const eventId = checkArray(newEventInfo.data.event);
        verificationInfo.noSql = {
          eventId: eventId.id,
        };
        await devitrakApi.patch(`/event/edit-event/${eventId.id}`, {
          qrCodeLink: `https://app.devitrak.net/?event=${eventId.id}&company=${user.companyData.id}`,
        });
        await createDeviceRecordInNoSQLDatabase({
          deviceInfo: deviceInfo,
          event_id: eventId.id,
          customer,
          user,
          contractList,
          addContracts,
          verificationInfo,
          stampTime,
        });
      }
    };
    return createEventNoSQL();
  } catch (error) {
    console.log(error);
  }
};
export const verificationContractStaffMember = ({
  customer,
  user,
  contractList,
  stampTime,
  verificationInfo,
}) => {
  try {
    const verificationSignature = async () => {
      const verification = await devitrakApi.post(
        "/document/verification/consumer_member/signed_document",
        {
          consumer_member_id: customer.uid ?? customer.id,
          contract_list: contractList,
          company_id: user.companyData.id,
          assigner_staff_member_id: user.uid ?? user.id,
          date: stampTime,
        }
      );
      return (verificationInfo._id = verification.data.verificationInfo._id);
    };
    return verificationSignature();
  } catch (error) {
    console.log(error);
  }
};
export const emailContractToStaffMember = ({
  customer,
  user,
  contractList,
  stampTime,
  verificationInfo,
  items,
}) => {
  try {
    const sendingEmailNotificationToConsumer = async () => {
      try {
        await devitrakApi.post(
          "/nodemailer/liability-contract-consumer-email-notification",
          {
            company_name: user.companyData.company_name,
            email_admin: user.email,
            consumer: {
              name: `${customer.name ?? ""} ${customer.lastName ?? ""}`,
              firstName: customer.name,
              lastName: customer.lastName,
              email: customer.email,
              consumer_member_id: customer.uid ?? customer.id,
            },
            contract_list: contractList,
            subject: "Device Liability Contract",
            items: items,
            company_id: user.companyData.id,
            date_reference: stampTime,
            verification_id: verificationInfo._id,
          }
        );
        return null;
      } catch (error) {
        console.log(error);
      }
    };
    return sendingEmailNotificationToConsumer();
  } catch (error) {
    console.log(error);
  }
};

export const transactionDeviceAdded = ({
  deviceInfo,
  qty,
  nanoid,
  reference,
  customer,
  verificationInfo,
  user,
}) => {
  try {
    const createTransaction = async () => {
            const eventName = `${customer.name} ${customer.lastName} / ${
        customer.email
      } / ${new Date().toLocaleDateString()} / Lease / ${
          customer.id ?? customer.uid
        }`;

      const id = nanoid(12);
      const max = 918273645;
      const transactionGenerated = "pi_" + id;
      reference.current = transactionGenerated;
      const stripeTransaction = {
        paymentIntent: transactionGenerated,
        clientSecret: 1 + customer.uid + Math.floor(Math.random() * max),
        device: Number(qty),
        user: customer.uid,
        eventSelected: eventName,
        provider: user.company,
        company: user.companyData.id,
        type: "lease",
      };
      const newTransaction = await devitrakApi.post(
        "/stripe/stripe-transaction-no-regular-user",
        stripeTransaction
      );
      if (newTransaction.data) {
        const transactionProfile = {
          paymentIntent: reference.current,
          clientSecret:
            newTransaction.data.stripeTransaction.clientSecret ?? "unknown",
          device: {
            deviceType: deviceInfo[0].item_group,
            deviceNeeded: qty,
            deviceValue: deviceInfo[0].cost,
            device: [
              {
                deviceValue: deviceInfo[0].cost,
                deviceType: deviceInfo[0].item_group,
                deviceNeeded: qty,
              },
            ],
          },
          consumerInfo: customer,
          provider: user.company,
          eventSelected: eventName,
          event_id: verificationInfo.noSql.eventId,
          date: new Date(),
          company: user.companyData.id,
          type: "lease",
        };
        await devitrakApi.post("/stripe/save-transaction", transactionProfile);
        deviceInfo.forEach((item) => {
          const deviceFormat = {
            serialNumber: item.serial_number,
            deviceType: item.item_group,
            status: true,
          };
          const transaction = new DeviceAssigned(
            transactionGenerated,
            deviceFormat,
            customer.email,
            true,
            eventName,
            user.company,
            new Date().getTime(),
            user.companyData.id,
            verificationInfo.noSql.eventId
          );
          const fetchingNewDeviceTransaction = async () => {
            return await devitrakApi.post("/receiver/receiver-assignation", {
              ...transaction.render(),
            });
          };
          fetchingNewDeviceTransaction();
        });
      }
    };
    return createTransaction();
  } catch (error) {
    console.log(error);
  }
};
