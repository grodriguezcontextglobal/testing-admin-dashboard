import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../apis/devitrakApi";
import { rightDoneMessage } from "../../helper/swalFireMessage";
import { useNavigate } from "react-router-dom";
import {
  onAddSubscription,
  onUpgradeSubscription,
} from "../../store/slices/subscriptionSlice";
import { useEffect } from "react";
import Swal from "sweetalert2";

const UpgradeConfirmationPage = () => {
  const { upgrade } = useSelector((state) => state.subscription);
  const { event } = useSelector((state) => state.event);
  const dispatch = useDispatch();
  const navigation = useNavigate();
  const payment_intent = new URLSearchParams(window.location.search).get(
    "payment_intent"
  );

  const clientSecret = new URLSearchParams(window.location.search).get(
    "payment_intent_client_secret"
  );

  const upgradeEvenSubscriptiontFetch = async () => {
    const resp = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
      ...event,
      subscription: upgrade,
    });
    if (resp) {
      rightDoneMessage(`Subscription upgraded to ${upgrade.name}`);
      dispatch(onAddSubscription(upgrade));
      dispatch(onUpgradeSubscription(undefined));
      let timerInterval;
      Swal.fire({
        title: `Subscription upgraded to ${upgrade.name}`,
        html: "You will redirect to Attendees Page in <b></b> milliseconds.",
        timer: 5000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
          const b = Swal.getHtmlContainer().querySelector("b");
          timerInterval = setInterval(() => {
            b.textContent = Swal.getTimerLeft();
          }, 100);
        },
        willClose: () => {
          clearInterval(timerInterval);
        },
      }).then((result) => {
        /* Read more about handling dismissals below */
        if (result.dismiss === Swal.DismissReason.timer) {
          navigation("/events/event-attendees");
        }
      });
    }
  };
  useEffect(() => {
    upgradeEvenSubscriptiontFetch();
  }, [payment_intent, clientSecret]);// eslint-disable-line react-hooks/exhaustive-deps 

  return <div>Upgrade Confirmation Page</div>;
};

export default UpgradeConfirmationPage;
