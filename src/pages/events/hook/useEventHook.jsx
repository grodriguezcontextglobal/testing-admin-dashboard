import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { onAddContactInfo, onAddDeviceSetup, onAddEventInfoDetail, onAddEventStaff, onAddListEventPermitPerAdmin } from "../../../store/slices/eventSlice";

export const useEventHook = ({ eventList = [], searchValue = "" }) => {
    const { user } = useSelector((state) => state.admin);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(
            onAddEventInfoDetail({
                eventName: undefined,
                eventLocation: undefined,
                address: undefined,
                building: undefined,
                floor: undefined,
                phoneNumber: [],
                merchant: false,
                dateBegin: new Date().toString(),
                dateEnd: new Date().toString(),
            })
        );

        dispatch(onAddContactInfo(undefined));
        dispatch(
            onAddEventStaff({
                adminUser: [],
                headsetAttendees: [],
            })
        );
        dispatch(onAddDeviceSetup([]));
    }, [dispatch, user.company]);

    const dataPerCompany = useMemo(() => {
        const list = Array.isArray(eventList) ? eventList : [];

        if (!searchValue.trim()) return list;

        return list.filter(
            (item) =>
                item?.company === user.company &&
                item?.eventInfoDetail?.eventName
                    ?.toLowerCase()
                    .includes(searchValue.toLowerCase())
        );
    }, [eventList, searchValue, user.company]);

    const userRole = useMemo(() => {
        return user?.companyData?.employees?.find(
            (employee) => employee.user === user.email
        )?.role;
    }, [user]);

    const filterEventsByEmail = (events = [], key = null) => {
        if (userRole < 1) return events;

        return events.filter((event) => {
            if (key) {
                return event?.staff?.[key]?.some(
                    (member) => member.email === user.email
                );
            }

            const adminUser = event?.staff?.adminUser ?? [];
            const headsetAttendees = event?.staff?.headsetAttendees ?? [];
            const staff = [...adminUser, ...headsetAttendees];

            return staff.some((member) => member.email === user.email);
        });
    };

    const permittedEvents = useMemo(() => {
        return filterEventsByEmail(dataPerCompany);
    }, [dataPerCompany, userRole, user.email]);

    const removeDuplicatesById = (events = []) => {
        const map = new Map();

        events.forEach((event) => {
            if (event?.id && !map.has(event.id)) {
                map.set(event.id, event);
            }
        });

        return Array.from(map.values());
    };

    const normalizedEvents = useMemo(() => {
        return removeDuplicatesById(permittedEvents);
    }, [permittedEvents]);

    // Events happening right now: active and the current moment is within
    // [begin, end]. Sorted by which ends soonest.
    const dataToBeRenderedInLiveSection = () => {
        const currentDate = new Date();

        return normalizedEvents
            .filter((event) => {
                const begin = new Date(event?.eventInfoDetail?.dateBegin);
                const ending = new Date(event?.eventInfoDetail?.dateEnd);

                return (
                    event?.active === true &&
                    begin <= currentDate &&
                    ending >= currentDate
                );
            })
            .map((event) => ({
                key: event.id,
                ...event,
            }))
            .sort(
                (a, b) =>
                    new Date(a.eventInfoDetail.dateEnd).getTime() -
                    new Date(b.eventInfoDetail.dateEnd).getTime()
            );
    };

    // Active events that have not started yet. Sorted by which starts soonest.
    const dataToBeRenderedInUpcomingSection = () => {
        const currentDate = new Date();

        return normalizedEvents
            .filter((event) => {
                const begin = new Date(event?.eventInfoDetail?.dateBegin);
                const ending = new Date(event?.eventInfoDetail?.dateEnd);

                return (
                    event?.active === true &&
                    ending >= currentDate &&
                    begin > currentDate
                );
            })
            .map((event) => ({
                key: event.id,
                ...event,
            }))
            .sort(
                (a, b) =>
                    new Date(a.eventInfoDetail.dateBegin).getTime() -
                    new Date(b.eventInfoDetail.dateBegin).getTime()
            );
    };

    const dataToBeRenderedInPastSection = () => {
        const currentDate = new Date();

        return normalizedEvents
            .filter((event) => {
                const ending = new Date(event?.eventInfoDetail?.dateEnd);

                return event?.active === false || ending < currentDate;
            })
            .map((event) => ({
                key: event.id,
                ...event,
            }))
            .sort(
                (a, b) =>
                    new Date(b.eventInfoDetail.dateEnd).getTime() -
                    new Date(a.eventInfoDetail.dateEnd).getTime()
            );
    };

    const renderingDataBasedOnStaffAndActiveEvent = () => {
        const live = dataToBeRenderedInLiveSection();
        const upcoming = dataToBeRenderedInUpcomingSection();
        const past = dataToBeRenderedInPastSection();
        return [...live, ...upcoming, ...past];
    };

    // Keep the redux contract in sync without dispatching during render.
    // "active" historically meant every currently-relevant event
    // (live + not-yet-started).
    useEffect(() => {
        const currentDate = new Date();
        const active = normalizedEvents
            .filter((event) => {
                const ending = new Date(event?.eventInfoDetail?.dateEnd);
                return event?.active === true && ending >= currentDate;
            })
            .map((event) => ({ key: event.id, ...event }));
        const completed = normalizedEvents
            .filter((event) => {
                const ending = new Date(event?.eventInfoDetail?.dateEnd);
                return event?.active === false || ending < currentDate;
            })
            .map((event) => ({ key: event.id, ...event }));
        dispatch(onAddListEventPermitPerAdmin({ active, completed }));
    }, [normalizedEvents, dispatch]);

    return {
        dataToBeRenderedInLiveSection,
        dataToBeRenderedInUpcomingSection,
        dataToBeRenderedInPastSection,
        renderingDataBasedOnStaffAndActiveEvent,
        checkActiveEventsToRemoveDuplicates: () => normalizedEvents,
    };
};