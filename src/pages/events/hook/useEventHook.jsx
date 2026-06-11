import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { onAddContactInfo, onAddDeviceSetup, onAddEventInfoDetail, onAddEventStaff, onAddListEventPermitPerAdmin } from "../../../store/slices/eventSlice";

export const useEventHook = ({ eventList = [] }) => {
    const { user } = useSelector((state) => state.admin);
    const { watch } = useForm();
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

    const searchValue = watch("searchEvent") || "";

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

    const dataToBeRenderedInUpcomingSection = () => {
        const currentDate = new Date();

        return normalizedEvents
            .filter((event) => {
                const ending = new Date(event?.eventInfoDetail?.dateEnd);

                return event?.active === true && ending >= currentDate;
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
        const upcoming = dataToBeRenderedInUpcomingSection();
        const past = dataToBeRenderedInPastSection();

        dispatch(
            onAddListEventPermitPerAdmin({
                active: upcoming,
                completed: past,
            })
        );
        return [...upcoming, ...past];
    };

    return {
        dataToBeRenderedInUpcomingSection,
        dataToBeRenderedInPastSection,
        renderingDataBasedOnStaffAndActiveEvent,
        checkActiveEventsToRemoveDuplicates: () => normalizedEvents,
    };
};